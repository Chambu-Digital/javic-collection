import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import StockCount from '@/models/StockCount'
import BranchStock from '@/models/BranchStock'
import Product from '@/models/Product'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

/** Generate a sequential count reference: CNT-YYYYMMDD-NNN */
async function generateCountRef(session?: mongoose.ClientSession): Promise<string> {
  const date = new Date()
  const stamp =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0')

  const last = await StockCount.findOne(
    { countRef: new RegExp(`^CNT-${stamp}`) },
    { countRef: 1 },
    { session: session || undefined }
  ).sort({ countRef: -1 })

  let seq = 1
  if (last) {
    const m = last.countRef.match(/(\d+)$/)
    if (m) seq = parseInt(m[1], 10) + 1
  }

  return `CNT-${stamp}-${String(seq).padStart(3, '0')}`
}

/**
 * POST /api/pos/stock-count
 *
 * Start a new stock count for a branch. Seeds empty lines from the current
 * BranchStock records (with physicalQty defaulting to 0 so the counter starts
 * fresh). systemQty is captured at Apply time, not here.
 *
 * Body: { branchId, scope ('all'|'category'|'list'), scopeValue?, notes? }
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
    const { branchId, scope = 'all', scopeValue, notes } = body

    if (!branchId) {
      return NextResponse.json({ error: 'Branch is required' }, { status: 400 })
    }

    const Branch = (await import('@/models/Branch')).default
    const branch = await Branch.findById(branchId).lean()
    if (!branch || !branch.isActive) {
      return NextResponse.json({ error: 'Branch not found or inactive' }, { status: 400 })
    }

    // Build the query to seed lines from BranchStock
    const stockQuery: any = { branchId: new mongoose.Types.ObjectId(branchId) }

    if (scope === 'category' && scopeValue?.length) {
      // scopeValue contains category IDs — find matching productIds
      const products = await Product.find(
        { categoryId: { $in: scopeValue.map((id: string) => new mongoose.Types.ObjectId(id)) } }
      ).select('_id').lean()
      stockQuery.productId = { $in: products.map((p: any) => p._id) }
    } else if (scope === 'list' && scopeValue?.length) {
      stockQuery.productId = { $in: scopeValue.map((id: string) => new mongoose.Types.ObjectId(id)) }
    }

    // Fetch all BranchStock rows for the scope
    const stockRows = await BranchStock.find(stockQuery)
      .populate('productId', 'name images')
      .lean()

    if (stockRows.length === 0) {
      return NextResponse.json(
        { error: 'No inventory records found for this branch and scope' },
        { status: 400 }
      )
    }

    // Build lines — physicalQty starts at 0 (the counter will fill these in)
    const lines = stockRows.map((row: any) => ({
      productId: row.productId._id,
      productName: row.productId.name,
      variantImageUrl: row.productId.images?.[row.imageIndex]?.url || row.productId.images?.[0]?.url,
      imageIndex: row.imageIndex,
      selectedSize: row.selectedSize,
      branchStockId: row._id.toString(),
      stockIdentifier: row.stockIdentifier,
      systemQty: 0,        // will be captured from live BranchStock at apply time
      physicalQty: 0,      // filled in by the counter
      difference: 0,
    }))

    let stockCount: any
    await session.withTransaction(async () => {
      const newCount = new StockCount({
        countRef: await generateCountRef(session),
        branchId: new mongoose.Types.ObjectId(branchId),
        branchCode: (branch as any).branchCode,
        scope,
        scopeValue: scopeValue || [],
        status: 'in_progress',
        initiatedBy: new mongoose.Types.ObjectId(user.id),
        initiatedByName: `${user.firstName} ${user.lastName}`,
        notes,
        lines,
      })
      await newCount.save({ session })
      stockCount = newCount
    })

    if (!stockCount) {
      throw new Error('Failed to create stock count — transaction did not produce a document')
    }

    await session.endSession()
    return NextResponse.json({
      success: true,
      stockCount: {
        _id: stockCount._id,
        countRef: stockCount.countRef,
        status: stockCount.status,
        lineCount: lines.length,
      },
    })
  } catch (error: any) {
    await session.endSession()
    console.error('Error starting stock count:', error)
    return NextResponse.json({ error: error.message || 'Failed to start stock count' }, { status: 500 })
  }
}

/**
 * GET /api/pos/stock-count — list counts for a branch, newest first.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()
    const { searchParams } = new URL(request.url)
    const branchId   = searchParams.get('branchId') || ''
    const statusFilter = searchParams.get('status') || ''
    const page  = parseInt(searchParams.get('page')  || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const query: any = {}
    if (branchId) query.branchId = new mongoose.Types.ObjectId(branchId)
    if (['in_progress', 'applied', 'cancelled'].includes(statusFilter)) {
      query.status = statusFilter
    }

    const [counts, total] = await Promise.all([
      StockCount.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-lines')   // omit lines from the list view for performance
        .lean(),
      StockCount.countDocuments(query),
    ])

    return NextResponse.json({
      counts: counts.map((c: any) => ({
        _id: c._id,
        countRef: c.countRef,
        branchCode: c.branchCode,
        scope: c.scope,
        status: c.status,
        initiatedByName: c.initiatedByName,
        appliedAt: c.appliedAt,
        appliedByName: c.appliedByName,
        notes: c.notes,
        createdAt: c.createdAt,
      })),
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error listing stock counts:', error)
    return NextResponse.json({ error: error.message || 'Failed to list stock counts' }, { status: 500 })
  }
}
