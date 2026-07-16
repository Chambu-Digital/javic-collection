import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import PosHeldOrder from '@/models/PosHeldOrder'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'
import { createLedgerEntry } from '@/lib/pos/ledger-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePosPermission(request, POS_PERMISSIONS.HOLD_ORDERS)
    await connectDB()
    const { id } = await params
    const order = await PosHeldOrder.findById(id).lean()
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ heldOrder: order })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    return NextResponse.json({ error: 'Failed to fetch held order' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requirePosPermission(request, POS_PERMISSIONS.HOLD_ORDERS)
    await connectDB()
    const { id } = await params
    const body = await request.json()
    const action = body.action as 'resume' | 'cancel'

    const order = await PosHeldOrder.findById(id)
    if (!order || order.status !== 'held') {
      return NextResponse.json({ error: 'Held order not found' }, { status: 404 })
    }

    if (action === 'resume') {
      order.status = 'resumed'
      order.resumedAt = new Date()
      await order.save()
      await createLedgerEntry({
        eventType: 'held_order_resumed',
        source: 'pos',
        channel: 'pos',
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        referenceNumber: order.holdNumber,
        totalMinor: order.totalMinor,
      })
      return NextResponse.json({ heldOrder: order })
    }

    if (action === 'cancel') {
      const perm = body.force
        ? POS_PERMISSIONS.CANCEL_HELD
        : POS_PERMISSIONS.HOLD_ORDERS
      await requirePosPermission(request, perm)
      order.status = 'cancelled'
      order.cancelledAt = new Date()
      order.cancelledBy = user.id as any
      await order.save()
      await createLedgerEntry({
        eventType: 'held_order_cancelled',
        source: 'pos',
        channel: 'pos',
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        referenceNumber: order.holdNumber,
        totalMinor: order.totalMinor,
      })
      return NextResponse.json({ heldOrder: order })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    return NextResponse.json({ error: 'Failed to update held order' }, { status: 500 })
  }
}
