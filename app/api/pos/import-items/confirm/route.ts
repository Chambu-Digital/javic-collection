import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import BranchStock from '@/models/BranchStock'
import { requireAuth } from '@/lib/auth'
import { recordStockMovement } from '@/lib/inventory-ledger'
import { syncProductStockQuantity } from '@/lib/branch-inventory'
import mongoose from 'mongoose'
import type { PreviewRow } from '../preview/route'

/**
 * POST /api/pos/import-items/confirm
 *
 * Writes valid rows from the preview into the database.
 * Only rows where valid === true (and not duplicate, unless overwriteDuplicates
 * is set) are processed.
 *
 * For rows with initialQty > 0, a BranchStock record is created and an
 * opening-stock LedgerEntry is written.
 *
 * Body: {
 *   rows: PreviewRow[],       // full preview array from /preview
 *   branchId: string,
 *   vendorId: string,
 *   overwriteDuplicates: boolean,  // if true, skip duplicate rows entirely
 * }
 */

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function uniqueSlug(base: string, session: mongoose.ClientSession): Promise<string> {
  let slug = base, i = 1
  while (await Product.findOne({ slug }).session(session)) {
    slug = `${base}-${i++}`
  }
  return slug
}

export async function POST(request: NextRequest) {
  const session = await mongoose.startSession()
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()
    const body = await request.json()
    const { rows, branchId, vendorId, overwriteDuplicates = false } = body as {
      rows: PreviewRow[]
      branchId: string
      vendorId: string
      overwriteDuplicates: boolean
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows to import' }, { status: 400 })
    }
    if (!branchId) return NextResponse.json({ error: 'Branch is required' }, { status: 400 })
    if (!vendorId) return NextResponse.json({ error: 'Vendor (supplier) is required for stock records' }, { status: 400 })

    const Branch = (await import('@/models/Branch')).default
    const branch = await Branch.findById(branchId).lean()
    if (!branch || !branch.isActive) {
      return NextResponse.json({ error: 'Branch not found or inactive' }, { status: 400 })
    }

    const Vendor = (await import('@/models/Vendor')).default
    const vendor = await Vendor.findById(vendorId).lean()
    if (!vendor || !vendor.isActive) {
      return NextResponse.json({ error: 'Vendor not found or inactive' }, { status: 400 })
    }

    // Only process valid rows; skip duplicates unless overwrite requested
    const toImport = rows.filter(r => r.valid && (!r.isDuplicate || overwriteDuplicates === false))
      // When overwriteDuplicates is false we simply skip duplicates (no error)

    let created = 0
    let skipped = 0
    const errors: string[] = []

    // Category cache to avoid repeated DB hits
    const categoryCache = new Map<string, { id: mongoose.Types.ObjectId; name: string }>()

    const getOrCreateCategory = async (name: string, sess: mongoose.ClientSession) => {
      const key = name.toLowerCase().trim() || 'uncategorised'
      if (categoryCache.has(key)) return categoryCache.get(key)!
      let cat = await Category.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') }).session(sess)
      if (!cat) {
        const catSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'uncategorised'
        cat = new Category({
          name: name.trim() || 'Uncategorised',
          slug: catSlug,
          description: `${name.trim() || 'Uncategorised'} category`,
          image: '/placeholder.svg',
          icon: '📦',
          isActive: true,
        })
        await cat.save({ session: sess })
      }
      const result = { id: cat._id as mongoose.Types.ObjectId, name: cat.name }
      categoryCache.set(key, result)
      return result
    }

    await session.withTransaction(async () => {
      for (const row of toImport) {
        try {
          if (row.isDuplicate) { skipped++; continue }

          const categoryName = row.category || 'Uncategorised'
          const cat = await getOrCreateCategory(categoryName, session)
          const baseSlug = slugify(row.name)
          const slug = await uniqueSlug(baseSlug, session)

          const product = new Product({
            name: row.name,
            slug,
            description: row.name,   // placeholder; user edits after import
            price: row.sellingPrice,
            buyingPrice: row.buyingPrice || 0,
            barcode: row.barcode || undefined,
            sku: row.sku || undefined,
            lowStockThreshold: row.minStockLevel || 10,
            category: cat.name,
            categoryId: cat.id,
            images: [{ url: '/placeholder.svg' }],
            sizes: [],
            inStock: row.initialQty > 0,
            stockQuantity: 0,   // synced from BranchStock below
            isActive: true,
            isNewProduct: true,
            branchInventoryEnabled: true,
          })
          await product.save({ session })

          // Opening stock
          if (row.initialQty > 0) {
            const productSku = row.sku || `PROD${product._id.toString().slice(-6)}`
            const stockIdentifier = (BranchStock as any).generateStockIdentifier(
              productSku, (branch as any).branchCode, 0
            )
            const stockRecord = new BranchStock({
              productId: product._id,
              branchId: new mongoose.Types.ObjectId(branchId),
              vendorId: new mongoose.Types.ObjectId(vendorId),
              imageIndex: 0,
              stockIdentifier,
              quantity: row.initialQty,
            })
            await stockRecord.save({ session })
            await syncProductStockQuantity(product._id, session)

            await recordStockMovement(
              'inventory_added',
              'admin',
              row.initialQty,
              0,
              row.initialQty,
              {
                branchId,
                branchCode: (branch as any).branchCode,
                branchStockId: stockRecord._id.toString(),
                userId: user.id,
                userName: `${user.firstName} ${user.lastName}`,
                productId: product._id.toString(),
                productName: product.name,
                referenceNumber: `IMPORT-${new Date().toISOString().slice(0,10)}`,
                notes: 'Opening stock via bulk import',
                metadata: { source: 'import_items', unitCost: row.initialCost },
                session,
              }
            )
          }

          created++
        } catch (rowErr: any) {
          errors.push(`Row ${row.rowIndex + 1} (${row.name}): ${rowErr.message}`)
          skipped++
        }
      }
    })

    await session.endSession()

    return NextResponse.json({
      success: true,
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    await session.endSession()
    console.error('Error confirming import:', error)
    return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 })
  }
}
