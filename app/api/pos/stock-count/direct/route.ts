import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BranchStock from '@/models/BranchStock'
import Product from '@/models/Product'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

/**
 * GET /api/pos/stock-count/direct
 *
 * Returns the live inventory snapshot for a branch — exactly what the
 * stock count screen needs to show as "System Qty".
 *
 * No StockCount document is created here. The cashier fills in physical
 * quantities on the front-end, then hits Apply which calls the existing
 * POST + apply endpoints.
 *
 * Query params:
 *   branchId   (required)
 *   search     (optional, product name / SKU)
 *   categoryId (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()
    const { searchParams } = new URL(request.url)
    const branchId   = searchParams.get('branchId')   || ''
    const search     = searchParams.get('search')     || ''
    const categoryId = searchParams.get('categoryId') || ''

    if (!branchId) {
      return NextResponse.json({ error: 'branchId is required' }, { status: 400 })
    }

    // Base match: all BranchStock rows for this branch
    const matchConditions: any = {
      branchId: new mongoose.Types.ObjectId(branchId),
    }

    const pipeline: any[] = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
    ]

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'product.name':  { $regex: search, $options: 'i' } },
            { 'product.sku':   { $regex: search, $options: 'i' } },
            { stockIdentifier: { $regex: search, $options: 'i' } },
          ],
        },
      })
    }

    // Category filter
    if (categoryId) {
      pipeline.push({
        $match: {
          'product.categoryId': new mongoose.Types.ObjectId(categoryId),
        },
      })
    }

    // Sort by product name
    pipeline.push({ $sort: { 'product.name': 1, imageIndex: 1 } })

    const rows = await BranchStock.aggregate(pipeline)

    const lines = rows.map((row: any) => {
      const product = row.product
      const image   = product.images?.[row.imageIndex] || product.images?.[0] || null

      return {
        branchStockId:   row._id.toString(),
        stockIdentifier: row.stockIdentifier,
        productId:       product._id.toString(),
        productName:     product.name,
        productSku:      product.sku || null,
        variantImageUrl: image?.url || null,
        imageIndex:      row.imageIndex,
        selectedSize:    row.selectedSize || null,
        systemQty:       row.quantity,   // live quantity — read-only for the cashier
        category:        product.category || '',
        categoryId:      product.categoryId?.toString() || '',
      }
    })

    return NextResponse.json({ lines, total: lines.length })
  } catch (error: any) {
    console.error('Error fetching stock count snapshot:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory snapshot' },
      { status: 500 }
    )
  }
}
