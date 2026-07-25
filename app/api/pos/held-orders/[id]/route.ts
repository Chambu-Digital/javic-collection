import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import PosHeldOrder from '@/models/PosHeldOrder'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'
import { createLedgerEntry } from '@/lib/pos/ledger-service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requirePosPermission(request, POS_PERMISSIONS.HOLD_ORDERS)
    await connectDB()

    const { id } = await params
    const { action } = await request.json() as { action: 'resume' | 'cancel' }

    const held = await PosHeldOrder.findById(id)
    if (!held) {
      return NextResponse.json({ error: 'Held order not found' }, { status: 404 })
    }
    if (held.status !== 'held') {
      return NextResponse.json(
        { error: `Order is already ${held.status}` },
        { status: 400 }
      )
    }

    if (action === 'resume') {
      held.status = 'resumed'
      held.resumedAt = new Date()
      await held.save()

      await createLedgerEntry({
        eventType: 'held_order_resumed',
        source: 'pos',
        channel: 'pos',
        outletId: held.outletId as any,
        outletName: held.outletName,
        userId: user.id as any,
        userName: `${user.firstName} ${user.lastName}`,
        customerId: held.customerId as any,
        customerName: held.customerName,
        totalMinor: held.totalMinor,
        referenceNumber: held.holdNumber,
        wasOffline: false,
      })

      return NextResponse.json({ heldOrder: held.toObject() })
    }

    if (action === 'cancel') {
      held.status = 'cancelled'
      held.cancelledAt = new Date()
      held.cancelledBy = user.id as any
      await held.save()

      await createLedgerEntry({
        eventType: 'held_order_cancelled',
        source: 'pos',
        channel: 'pos',
        outletId: held.outletId as any,
        outletName: held.outletName,
        userId: user.id as any,
        userName: `${user.firstName} ${user.lastName}`,
        customerId: held.customerId as any,
        customerName: held.customerName,
        totalMinor: held.totalMinor,
        referenceNumber: held.holdNumber,
        wasOffline: false,
      })

      return NextResponse.json({ heldOrder: held.toObject() })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[held-orders/[id]]', error)
    return NextResponse.json({ error: 'Failed to update held order' }, { status: 500 })
  }
}
