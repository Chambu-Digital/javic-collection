import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import StockOut from '@/models/StockOut'
import BranchStock from '@/models/BranchStock'
import Product from '@/models/Product'
import { requireAuth } from '@/lib/auth'
import { syncProductStockQuantity } from '@/lib/branch-inventory'
import { recordStockMovement } from '@/lib/inventory-ledger'
import mongoose from 'mongoose'

const VALID_REASONS = ['damaged','expired','consumed','sample','theft_loss','supplier_return','other']

function generateRef(): string {
  const d = new Date()
  const stamp = d.getFullYear().toString()
    + String(d.getMonth()+1).padStart(2,'0')
    + String(d.getDate()).padStart(2,'0')
    + String(d.getHours()).padStart(2,'0')
    + String(d.getMinutes()).padStart(2,'0')
    + String(d.getSeconds()).padStart(2,'0')
  return `OUT-${stamp}-${Math.random().toString(36).substring(2,6).toUpperCase()}`
}

/**
 * POST /api/pos/stock-out
 * Create a stock-out transaction. Immediately deducts BranchStock for every
 * line inside a single transaction and records movement history.
 *
 * Body: { branchId, reason, notes?, supplierRef?, vendorId?, lines[] }
 * lines[]: { productId, imageIndex, selectedSize?, quantity }
 */
export async function POST(request: NextRequest) {
  const session = await mongoose.startSession()
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()
    const body = await request.json()
    const { branchId, reason, notes, supplierRef, vendorId, lines } = body

    // ── Validation ────────────────────────────────────────────────────
    if (!branchId) return NextResponse.json({ error: 'Branch is required' }, { status: 400 })
    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'A valid reason is required' }, { status: 400 })
    }
    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: 'Add at least one product line' }, { status: 400 })
    }
    for (const l of lines) {
      if (!l.productId) return NextResponse.json({ error: 'Missing product in a line' }, { status: 400 })
      if (!Number.isFinite(l.quantity) || l.quantity < 1) {
        return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 })
      }
    }

    const Branch = (await import('@/models/Branch')).default
    const branch = await Branch.findById(branchId).lean()
    if (!branch || !branch.isActive) {
      return NextResponse.json({ error: 'Branch not found or inactive' }, { status: 400 })
    }

    // Optional vendor for supplier returns
    let vendorDoc: any = null
    if (vendorId) {
      const Vendor = (await import('@/models/Vendor')).default
      vendorDoc = await Vendor.findById(vendorId).lean()
    }

    let stockOut: any
    await session.withTransaction(async () => {
      const builtLines: any[] = []

      for (const l of lines) {
        const product = await Product.findById(l.productId).session(session)
        if (!product) throw new Error(`Product not found: ${l.productId}`)

        const image = product.images?.[l.imageIndex ?? 0]
        const sizes = image?.sizes || product.sizes || []
        if (sizes.length > 0 && !l.selectedSize) {
          throw new Error(`Size is required for ${product.name}`)
        }

        // Find the BranchStock record
        const stockQuery: any = {
          productId: product._id,
          branchId: new mongoose.Types.ObjectId(branchId),
          imageIndex: l.imageIndex ?? 0,
        }
        if (l.selectedSize) stockQuery.selectedSize = l.selectedSize
        else stockQuery.selectedSize = { $exists: false }

        const stockRecord = await BranchStock.findOne(stockQuery).session(session)
        if (!stockRecord) throw new Error(`No stock record found for ${product.name}`)
        if (stockRecord.quantity < l.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${stockRecord.quantity}, Requested: ${l.quantity}`
          )
        }

        const prevQty = stockRecord.quantity
        stockRecord.quantity -= l.quantity
        await stockRecord.save({ session })
        await syncProductStockQuantity(product._id, session)

        await recordStockMovement(
          'inventory_removed',
          'pos',
          l.quantity,
          prevQty,
          stockRecord.quantity,
          {
            branchId,
            branchCode: (branch as any).branchCode,
            branchStockId: stockRecord._id.toString(),
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            productId: product._id,
            productName: product.name,
            variantImageUrl: image?.url,
            size: l.selectedSize,
            notes: `Stock Out (${reason})${notes ? ': ' + notes : ''}`,
            metadata: { reason, source: 'stock_out' },
            session,
          }
        )

        builtLines.push({
          productId: product._id,
          productName: product.name,
          variantImageUrl: image?.url,
          imageIndex: l.imageIndex ?? 0,
          selectedSize: l.selectedSize,
          branchStockId: stockRecord._id.toString(),
          quantity: l.quantity,
          unitCost: product.buyingPrice || 0,
          lineTotal: (product.buyingPrice || 0) * l.quantity,
        })
      }

      stockOut = new StockOut({
        referenceNo: generateRef(),
        branchId: new mongoose.Types.ObjectId(branchId),
        branchCode: (branch as any).branchCode,
        reason,
        notes,
        supplierRef,
        vendorId: vendorId ? new mongoose.Types.ObjectId(vendorId) : undefined,
        vendorName: vendorDoc?.name,
        lines: builtLines,
        totalQuantity: builtLines.reduce((s: number, l: any) => s + l.quantity, 0),
        createdBy: new mongoose.Types.ObjectId(user.id),
        createdByName: `${user.firstName} ${user.lastName}`,
      })
      await stockOut.save({ session })
    })

    await session.endSession()
    return NextResponse.json({
      success: true,
      referenceNo: stockOut.referenceNo,
      _id: stockOut._id,
    })
  } catch (error: any) {
    await session.endSession()
    console.error('Error creating stock out:', error)
    return NextResponse.json({ error: error.message || 'Failed to create stock out' }, { status: 500 })
  }
}

/**
 * GET /api/pos/stock-out — list stock-out records for a branch.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || ''
    const reason   = searchParams.get('reason') || ''
    const search   = searchParams.get('search') || ''
    const page     = parseInt(searchParams.get('page') || '1')
    const limit    = parseInt(searchParams.get('limit') || '20')

    const query: any = {}
    if (branchId) query.branchId = new mongoose.Types.ObjectId(branchId)
    if (VALID_REASONS.includes(reason)) query.reason = reason
    if (search) {
      query.$or = [
        { referenceNo: { $regex: search, $options: 'i' } },
        { 'lines.productName': { $regex: search, $options: 'i' } },
      ]
    }

    const [records, total] = await Promise.all([
      StockOut.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      StockOut.countDocuments(query),
    ])

    return NextResponse.json({
      records: records.map((r: any) => ({
        _id: r._id,
        referenceNo: r.referenceNo,
        reason: r.reason,
        notes: r.notes,
        vendorName: r.vendorName,
        lineCount: r.lines?.length || 0,
        totalQuantity: r.totalQuantity,
        createdByName: r.createdByName,
        createdAt: r.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    console.error('Error listing stock outs:', error)
    return NextResponse.json({ error: error.message || 'Failed to list stock outs' }, { status: 500 })
  }
}
