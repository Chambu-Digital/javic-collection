import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import StockCount from '@/models/StockCount'
import BranchStock from '@/models/BranchStock'
import { requireAuth } from '@/lib/auth'
import { syncProductStockQuantity } from '@/lib/branch-inventory'
import { recordStockMovement } from '@/lib/inventory-ledger'
import mongoose from 'mongoose'

type Ctx = { params: Promise<{ id: string }> }

/**
 * POST /api/pos/stock-count/[id]/apply
 *
 * Apply a stock count:
 *   1. Inside a single transaction, for every line:
 *      a. Read the live BranchStock.quantity  → this becomes systemQty (the
 *         "before" snapshot, captured at the exact moment of apply).
 *      b. Set BranchStock.quantity = physicalQty  (the override).
 *      c. Sync Product.stockQuantity aggregate.
 *      d. Write a LedgerEntry (inventory_adjusted) recording prev/new/diff,
 *         the count reference, the user, and the exact timestamp.
 *   2. Stamp the count with appliedAt = now, appliedBy = current user,
 *      status = 'applied'. The status guard prevents double-application.
 *
 * Lines where physicalQty === live systemQty (difference = 0) are skipped for
 * BranchStock writes but still recorded on the count document.
 */
export async function POST(request: NextRequest, { params }: Ctx) {
  const session = await mongoose.startSession()

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

    let adjustedLines = 0
    let skippedLines  = 0
    const appliedAt   = new Date()

    await session.withTransaction(async () => {
      // Re-fetch inside the transaction with a pessimistic session lock
      const count = await StockCount.findById(id).session(session)
      if (!count) throw new Error('Stock count not found')

      // ── Double-apply guard ─────────────────────────────────────────────
      if (count.status === 'applied') {
        throw new Error('This count has already been applied')
      }
      if (count.status === 'cancelled') {
        throw new Error('A cancelled count cannot be applied')
      }

      const updatedLines: any[] = []

      for (const line of count.lines as any[]) {
        // Only process lines the cashier explicitly counted (isCounted flag set
        // by the PATCH endpoint). Untouched lines with the default physicalQty=0
        // are skipped entirely — we don't want to zero out stock that wasn't counted.
        if (!line.isCounted) {
          updatedLines.push({ ...line.toObject() })
          skippedLines++
          continue
        }

        if (!line.branchStockId) {
          // No BranchStock record — skip silently
          updatedLines.push({ ...line.toObject(), systemQty: 0, difference: line.physicalQty })
          skippedLines++
          continue
        }

        const stockRecord = await BranchStock
          .findById(line.branchStockId)
          .session(session)

        // The BranchStock row might have been deleted since the count started
        if (!stockRecord) {
          updatedLines.push({ ...line.toObject(), systemQty: 0, difference: line.physicalQty })
          skippedLines++
          continue
        }

        const systemQty  = stockRecord.quantity          // live at apply instant
        const physicalQty = Number(line.physicalQty)
        const difference  = physicalQty - systemQty

        if (difference === 0) {
          // No change needed — record the snapshot but skip the BranchStock write
          updatedLines.push({
            ...line.toObject(),
            systemQty,
            difference: 0,
          })
          skippedLines++
          continue
        }

        // ── Override BranchStock ─────────────────────────────────────────
        stockRecord.quantity = physicalQty
        await stockRecord.save({ session })

        // ── Sync aggregate Product.stockQuantity ────────────────────────
        await syncProductStockQuantity(line.productId, session)

        // ── Record movement ──────────────────────────────────────────────
        const eventType = difference > 0 ? 'inventory_adjusted' : 'inventory_adjusted'

        await recordStockMovement(
          eventType,
          'pos',
          Math.abs(difference),
          systemQty,
          physicalQty,
          {
            branchId:       count.branchId,
            branchCode:     count.branchCode,
            branchStockId:  line.branchStockId,
            userId:         user.id,
            userName:       `${user.firstName} ${user.lastName}`,
            productId:      line.productId,
            productName:    line.productName,
            variantImageUrl:line.variantImageUrl,
            size:           line.selectedSize,
            referenceNumber:count.countRef,
            notes:          line.notes
              ? `Stock count: ${line.notes}`
              : `Stock count adjustment — ${difference > 0 ? '+' : ''}${difference}`,
            metadata: {
              stockCountId: count._id,
              difference,
              source: 'stock_count',
            },
            session,
          }
        )

        updatedLines.push({
          ...line.toObject(),
          systemQty,
          physicalQty,
          difference,
        })
        adjustedLines++
      }

      // ── Finalise the count document ─────────────────────────────────────
      count.lines      = updatedLines as any
      count.status     = 'applied'
      count.appliedAt  = appliedAt
      count.appliedBy  = new mongoose.Types.ObjectId(user.id)
      count.appliedByName = `${user.firstName} ${user.lastName}`
      await count.save({ session })
    })

    await session.endSession()

    return NextResponse.json({
      success: true,
      appliedAt,
      adjustedLines,
      skippedLines,
      message: `Stock count applied. ${adjustedLines} line${adjustedLines !== 1 ? 's' : ''} adjusted, ${skippedLines} unchanged.`,
    })
  } catch (error: any) {
    await session.endSession()
    console.error('Error applying stock count:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to apply stock count' },
      { status: 500 }
    )
  }
}
