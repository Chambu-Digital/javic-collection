import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { requireAuth } from '@/lib/auth'

/**
 * POST /api/pos/import-items/preview
 *
 * Accepts a JSON array of raw rows parsed on the client from a CSV/Excel file.
 * Returns a validated preview — each row is marked valid/invalid with
 * field-level error messages, and duplicates are identified.
 *
 * No data is written. This is purely a validation pass.
 *
 * Body: { rows: RawRow[] }
 *
 * RawRow (all strings from the spreadsheet):
 *   name, barcode?, sku?, category?, brand?, variant?,
 *   unit?, buyingPrice?, sellingPrice?, minStockLevel?,
 *   supplier?, initialQty?, initialCost?
 */

export interface RawRow {
  name?: string
  barcode?: string
  sku?: string
  category?: string
  brand?: string
  variant?: string
  unit?: string
  buyingPrice?: string | number
  sellingPrice?: string | number
  minStockLevel?: string | number
  supplier?: string
  initialQty?: string | number
  initialCost?: string | number
}

export interface PreviewRow {
  rowIndex: number
  raw: RawRow
  // Normalised values (populated on valid rows)
  name: string
  barcode: string
  sku: string
  category: string
  buyingPrice: number
  sellingPrice: number
  minStockLevel: number
  initialQty: number
  initialCost: number
  // Validation
  valid: boolean
  errors: string[]
  warnings: string[]
  isDuplicate: boolean      // matches an existing product by name slug or barcode
  duplicateOf?: string      // existing product name
}

function num(v: string | number | undefined, fallback = 0): number {
  const n = parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : fallback
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()
    const body = await request.json()
    const rows: RawRow[] = body.rows

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
    }
    if (rows.length > 2000) {
      return NextResponse.json({ error: 'Maximum 2 000 rows per import' }, { status: 400 })
    }

    // Pre-load existing slugs and barcodes for duplicate detection
    const existingProducts = await Product.find({}, 'name slug barcode').lean()
    const existingSlugs   = new Set(existingProducts.map((p: any) => p.slug))
    const existingBarcodes = new Map<string, string>() // barcode → product name
    for (const p of existingProducts as any[]) {
      if (p.barcode) existingBarcodes.set(p.barcode.trim().toLowerCase(), p.name)
    }

    // Track barcodes seen in this import batch to catch intra-batch duplicates
    const batchBarcodes = new Map<string, number>() // barcode → first row index

    const existingCategories = await Category.find({}, 'name').lean()
    const categorySet = new Set(existingCategories.map((c: any) => c.name.toLowerCase()))

    const preview: PreviewRow[] = rows.map((raw, idx) => {
      const errors: string[]   = []
      const warnings: string[] = []

      const name         = String(raw.name ?? '').trim()
      const barcode      = String(raw.barcode ?? '').trim()
      const sku          = String(raw.sku ?? '').trim()
      const category     = String(raw.category ?? '').trim()
      const sellingPrice = num(raw.sellingPrice)
      const buyingPrice  = num(raw.buyingPrice)
      const minStockLevel= Math.round(num(raw.minStockLevel, 10))
      const initialQty   = Math.round(num(raw.initialQty))
      const initialCost  = num(raw.initialCost, buyingPrice)

      // Required fields
      if (!name) errors.push('Product name is required')
      if (sellingPrice <= 0) errors.push('Selling price must be greater than 0')

      // Price sanity
      if (buyingPrice < 0) errors.push('Buying price cannot be negative')
      if (buyingPrice > 0 && sellingPrice > 0 && buyingPrice > sellingPrice) {
        warnings.push('Buying price is higher than selling price')
      }

      // Stock
      if (initialQty < 0) errors.push('Initial quantity cannot be negative')
      if (initialQty > 0 && initialCost <= 0) {
        warnings.push('Initial stock has no cost price — FIFO valuation will be zero for this batch')
      }

      // Category warning (not error — will be created if missing)
      if (category && !categorySet.has(category.toLowerCase())) {
        warnings.push(`Category "${category}" does not exist — it will be created`)
      }

      // Duplicate detection — barcode
      let isDuplicate = false
      let duplicateOf: string | undefined

      if (barcode) {
        const barcodeKey = barcode.toLowerCase()
        const existingName = existingBarcodes.get(barcodeKey)
        if (existingName) {
          isDuplicate = true
          duplicateOf = existingName
          errors.push(`Barcode "${barcode}" already belongs to "${existingName}"`)
        } else if (batchBarcodes.has(barcodeKey)) {
          errors.push(`Barcode "${barcode}" appears again in row ${(batchBarcodes.get(barcodeKey)! + 1)}`)
        } else {
          batchBarcodes.set(barcodeKey, idx)
        }
      }

      // Duplicate detection — name slug
      if (name && existingSlugs.has(slugify(name))) {
        isDuplicate = true
        duplicateOf = duplicateOf || name
        warnings.push(`A product with the name "${name}" already exists — it will be skipped on import unless you choose to overwrite`)
      }

      return {
        rowIndex: idx,
        raw,
        name,
        barcode,
        sku,
        category,
        buyingPrice,
        sellingPrice,
        minStockLevel,
        initialQty,
        initialCost,
        valid: errors.length === 0,
        errors,
        warnings,
        isDuplicate,
        duplicateOf,
      }
    })

    const validCount   = preview.filter(r => r.valid).length
    const invalidCount = preview.filter(r => !r.valid).length
    const dupCount     = preview.filter(r => r.isDuplicate).length

    return NextResponse.json({ preview, validCount, invalidCount, dupCount })
  } catch (error: any) {
    console.error('Error previewing import:', error)
    return NextResponse.json({ error: error.message || 'Preview failed' }, { status: 500 })
  }
}
