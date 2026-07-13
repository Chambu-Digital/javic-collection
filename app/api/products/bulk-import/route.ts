import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { requireAdmin } from '@/lib/auth'
import mongoose from 'mongoose'

interface ParsedVariant {
  label: string   // neutral row label (was color)
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
  variants: ParsedVariant[]   // still used by the import page parser
  tags: string[]              // from the Tags column
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

    const categoryCache = new Map<string, { id: mongoose.Types.ObjectId; name: string }>()

    const getCategory = async (name: string) => {
      const key = name.toLowerCase().trim()
      if (categoryCache.has(key)) return categoryCache.get(key)!

      let cat = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') })
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

        // Skip duplicates
        const baseSlug = slugify(p.name, p.itemCode)
        const existingBySlug = await Product.findOne({ slug: new RegExp(`^${baseSlug}`, 'i') })
        if (existingBySlug) {
          skipped++
          continue
        }

        const categoryName = p.category?.trim() || 'Uncategorised'
        const category = await getCategory(categoryName)
        const slug = await uniqueSlug(baseSlug)

        // Collect all unique sizes across all variants (rows) for this product
        const allSizes = Array.from(
          new Set(p.variants.flatMap(v => v.sizes).filter(Boolean))
        )

        // Total stock across all variants
        const totalStock = p.variants.reduce((sum, v) => sum + v.quantity, 0)

        await Product.create({
          name: p.name,
          slug,
          description: p.description,
          price: p.retailPrice,
          wholesalePrice: p.wholesalePrice || undefined,
          wholesaleThreshold: p.wholesaleThreshold || undefined,
          // One placeholder per variant row — admin replaces with real images after import
          images: p.variants.length > 0
            ? p.variants.map(() => ({ url: '/placeholder.svg' }))
            : [{ url: '/placeholder.svg' }],
          sizes: allSizes,
          tags: p.tags || [],
          category: category.name,
          categoryId: category.id,
          inStock: totalStock > 0,
          stockQuantity: totalStock,
          rating: 0,
          reviews: 0,
          isActive: !p.hasNoVariants,
          isNewProduct: true,
        })

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
