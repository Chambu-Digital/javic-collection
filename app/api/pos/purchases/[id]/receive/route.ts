import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Purchase from '@/models/Purchase'
import { requireAuth } from '@/lib/auth'
import { validatePurchaseForReceiving, receivePurchaseIntoStock } from '@/lib/purchases'
import mongoose from 'mongoose'

/**
 * POST /api/pos/purchases/[id]/receive — receive a draft purchase into stock.
 * Increases BranchStock for every line, updates current buying prices, records
 * the movement history, and flips the purchase to 'received'.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession()

  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()
    await connectDB()
    const { id } = await params

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid purchase ID' }, { status: 400 })
    }

    await session.withTransaction(async () => {
      const purchase = await Purchase.findById(id).session(session)
      if (!purchase) throw new Error('Purchase not found')
      if (purchase.status !== 'draft') {
        throw new Error('Only draft purchases can be received')
      }
      await validatePurchaseForReceiving(purchase, session)
      await receivePurchaseIntoStock(purchase, user, session)
    })

    await session.endSession()

    return NextResponse.json({
      success: true,
      message: 'Purchase received and stock updated',
    })
  } catch (error: any) {
    await session.endSession()
    console.error('Error receiving purchase:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to receive purchase' },
      { status: 500 }
    )
  }
}
