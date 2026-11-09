import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import StockCount from '@/models/StockCount'
import BranchStock from '@/models/BranchStock'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

type Ctx = { params: Promise<{ id: string }> }

// ─── GET ─────────────────────────────────────────────────────────────────────
/**
 * GET /api/pos/stock-count/[id]
 * Load a count with its full lines.  For each in-progress count, we also
 * return the current live BranchStock quantity so the UI can show the system
 * figure without actually writing it to the document yet.
 */
export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const count = await StockCount.findById(id).lean()
    if (!count) return NextResponse.json({ error: 'Stock count not found' }, { status: 404 })

    // For in-progress counts, fetch live quantities so the UI shows current stock
    let liveQtyMap: Record<string, number> = {}
    if (count.status === 'in_progress') {
      const stockIds = (count.lines as any[])
        .filter((l: any) => l.branchStockId)
        .map((l: any) => new mongoose.Types.ObjectId(l.branchStockId))

      const rows = await BranchStock.find({ _id: { $in: stockIds } })
        .select('_id quantity')
        .lean()

      rows.forEach((r: any) => {
        liveQtyMap[r._id.toString()] = r.quantity
      })
    }

    const lines = (count.lines as any[]).map((l: any) => ({
      productId:      l.productId?.toString(),
      productName:    l.productName,
      variantImageUrl:l.variantImageUrl,
      imageIndex:     l.imageIndex,
      selectedSize:   l.selectedSize,
      branchStockId:  l.branchStockId,
      stockIdentifier:l.stockIdentifier,
      // For applied counts, show the captured systemQty; for in-progress, show live
      systemQty:      count.status === 'in_progress'
        ? (l.branchStockId ? (liveQtyMap[l.branchStockId] ?? 0) : 0)
        : l.systemQty,
      physicalQty:    l.physicalQty,
      difference:     count.status === 'applied' ? l.difference : l.physicalQty - (l.branchStockId ? (liveQtyMap[l.branchStockId] ?? 0) : 0),
      notes:          l.notes,
    }))

    return NextResponse.json({
      count: {
        _id:            count._id,
        countRef:       count.countRef,
        branchId:       count.branchId?.toString(),
        branchCode:     count.branchCode,
        scope:          count.scope,
        status:         count.status,
        initiatedByName:count.initiatedByName,
        appliedAt:      count.appliedAt,
        appliedByName:  count.appliedByName,
        notes:          count.notes,
        createdAt:      count.createdAt,
        lines,
      },
    })
  } catch (error: any) {
    console.error('Error fetching stock count:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch stock count' }, { status: 500 })
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
/**
 * PATCH /api/pos/stock-count/[id]
 * Save progress on an in-progress count.  Only physicalQty and notes per line
 * are accepted — the system qty remains live and is never stored until Apply.
 * Body: { lines: [{ branchStockId, physicalQty, notes? }], notes? }
 */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const body = await request.json()
    const { lines, notes } = body

    const count = await StockCount.findById(id)
    if (!count) return NextResponse.json({ error: 'Stock count not found' }, { status: 404 })
    if (count.status !== 'in_progress') {
      return NextResponse.json({ error: 'Only in-progress counts can be updated' }, { status: 400 })
    }

    // Build a lookup by branchStockId for fast updating
    const updates: Record<string, { physicalQty: number; notes?: string }> = {}
    if (Array.isArray(lines)) {
      for (const l of lines) {
        if (l.branchStockId && typeof l.physicalQty === 'number' && l.physicalQty >= 0) {
          updates[l.branchStockId] = {
            physicalQty: Math.round(l.physicalQty),
            notes: l.notes,
          }
        }
      }
    }

    // Apply updates to the embedded lines
    // isCounted = true marks lines the cashier explicitly touched — apply will
    // only adjust these lines, skipping untouched ones.
    const updatedLines = (count.lines as any[]).map((l: any) => {
      const upd = l.branchStockId ? updates[l.branchStockId] : undefined
      if (!upd) return l
      return {
        ...l.toObject(),
        physicalQty: upd.physicalQty,
        notes: upd.notes !== undefined ? upd.notes : l.notes,
        isCounted: true,   // flag: cashier explicitly set this line
      }
    })

    count.lines = updatedLines as any
    if (notes !== undefined) count.notes = notes
    await count.save()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error saving stock count:', error)
    return NextResponse.json({ error: error.message || 'Failed to save stock count' }, { status: 500 })
  }
}

// ─── DELETE (cancel) ──────────────────────────────────────────────────────────
/**
 * DELETE /api/pos/stock-count/[id]
 * Cancel an in-progress count. No stock effect.
 */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const count = await StockCount.findById(id)
    if (!count) return NextResponse.json({ error: 'Stock count not found' }, { status: 404 })
    if (count.status !== 'in_progress') {
      return NextResponse.json({ error: 'Only in-progress counts can be cancelled' }, { status: 400 })
    }

    count.status = 'cancelled'
    await count.save()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error cancelling stock count:', error)
    return NextResponse.json({ error: error.message || 'Failed to cancel stock count' }, { status: 500 })
  }
}
