import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { requireAdmin } from '@/lib/auth'
import mongoose from 'mongoose'

interface ColorVariant {
  color: string
  quantity: number
  sizes: string[]
}

interface ParsedProduct {
  itemCode: string
  name: string
  category: string
  description: string
  retailPrice: number
  wholesalePrice: number
  buyingPrice: number
  wholesaleThreshold: number
  bulkDiscountPercent: number
  variants: ColorVariant[]
  hasNoVariants: boolean
  parseWarnings: string[]
}

function slugify(name: string, code: string): string {
  return (
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
    '-' +
    code.toLowerCase()
  )
}

// Ensure slug is unique by appending a counter if needed
async function uniqueSlug(base: string): Promise<string> {
  let slug = base
  let i = 1
  while (await Product.findOne({ slug })) {
    slug = `${base}-${i++}`
  }
  return slug
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)
    await connectDB()

    const body = await request.json()
    const products: ParsedProduct[] = body.products

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'No products provided' }, { status: 400 })
    }

    // Cache categories to avoid repeated DB hits
    const categoryCache = new Map<string, { id: mongoose.Types.ObjectId; name: string }>()

    const getCategory = async (name: string) => {
      const key = name.toLowerCase().trim()
      if (categoryCache.has(key)) return categoryCache.get(key)!

      // Try to find existing category (case-insensitive)
      let cat = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') })

      // Create it if it doesn't exist
      if (!cat) {
        cat = await Category.create({
          name: name.trim(),
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          description: `${name} collection`,
          image: '/placeholder.svg',
          icon: '👗',
          isActive: true,
        })
      }

      const result = { id: cat._id as mongoose.Types.ObjectId, name: cat.name }
      categoryCache.set(key, result)
      return result
    }

    let created = 0
    let skipped = 0
    const errors: string[] = []

    for (const p of products) {
      try {
        // Validation
        if (!p.itemCode || !p.name) {
          errors.push(`Skipped: missing Item Code or Item Name`)
          skipped++
          continue
        }
        if (!p.retailPrice || p.retailPrice <= 0) {
          errors.push(`${p.itemCode} (${p.name}): missing Retail Price — skipped`)
          skipped++
          continue
        }

        // Skip duplicates by item code stored in slug
        const baseSlug = slugify(p.name, p.itemCode)
        const existingBySlug = await Product.findOne({
          slug: new RegExp(`^${baseSlug}`, 'i')
        })
        if (existingBySlug) {
          skipped++
          continue
        }

        // Resolve category
        const categoryName = p.category?.trim() || 'Uncategorised'
        const category = await getCategory(categoryName)

        const slug = await uniqueSlug(baseSlug)
        const hasVariants = p.variants.length > 0

        // Build variants for the Product schema
        const variants = p.variants.map((v, idx) => ({
          id: `${p.itemCode}-${v.color.replace(/\s+/g, '-').toLowerCase()}-${idx}`,
          color: v.color,
          availableSizes: v.sizes,
          price: p.retailPrice,
          wholesalePrice: p.wholesalePrice || undefined,
          wholesaleThreshold: p.wholesaleThreshold || undefined,
          image: '/placeholder.svg', // admin adds real images after import
          stock: v.quantity,
          sku: `${p.itemCode}-${v.color.substring(0, 3).toUpperCase()}`,
          isActive: true,
        }))

        const totalStock = hasVariants
          ? variants.reduce((sum, v) => sum + v.stock, 0)
          : 0

        const productData: any = {
          name: p.name,
          slug,
          description: p.description,
          hasVariants,
          category: category.name,
          categoryId: category.id,
          inStock: totalStock > 0 || !hasVariants,
          stockQuantity: totalStock,
          rating: 0,
          reviews: 0,
          isActive: !p.hasNoVariants, // drafts for products with no data
          isNewProduct: true,
        }

        if (hasVariants) {
          productData.variants = variants
          productData.price = 0 // required field default for variant products
        } else {
          // Simple product (no variant data)
          productData.price = p.retailPrice
          productData.wholesalePrice = p.wholesalePrice || undefined
          productData.wholesaleThreshold = p.wholesaleThreshold || undefined
          productData.images = ['/placeholder.svg']
        }

        await Product.create(productData)
        created++
      } catch (rowErr: any) {
        errors.push(`${p.itemCode}: ${rowErr.message}`)
        skipped++
      }
    }

    return NextResponse.json({ created, skipped, errors: errors.length > 0 ? errors : undefined })
  } catch (error: any) {
    console.error('[bulk-import] Error:', error)
    if (error.message === 'Admin access required' || error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 })
  }
}
