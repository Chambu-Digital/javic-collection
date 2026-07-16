import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import PosHeldOrder from '@/models/PosHeldOrder'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'
import { createLedgerEntry } from '@/lib/pos/ledger-service'
import { fromMinorUnits } from '@/lib/pos/money'

export async function GET(request: NextRequest) {
  try {
    await requirePosPermission(request, POS_PERMISSIONS.HOLD_ORDERS)
    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'held'
    const cashierId = searchParams.get('cashierId')
    const customerId = searchParams.get('customerId')
    const search = searchParams.get('search')

    const query: Record<string, unknown> = { status }
    if (cashierId) query.cashierId = cashierId
    if (customerId) query.customerId = customerId
    if (search) {
      query.$or = [
        { holdNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ]
    }

    const orders = await PosHeldOrder.find(query).sort({ createdAt: -1 }).limit(100).lean()
    return NextResponse.json({ heldOrders: orders })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    return NextResponse.json({ error: 'Failed to fetch held orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, checker } = await requirePosPermission(request, POS_PERMISSIONS.HOLD_ORDERS)
    await connectDB()
    const body = await request.json()

    const held = new PosHeldOrder({
      ...body,
      cashierId: user.id,
      cashierName: `${user.firstName} ${user.lastName}`,
      status: 'held',
    })
    await held.save()

    await createLedgerEntry({
      eventType: 'held_order_created',
      source: 'pos',
      channel: 'pos',
      outletId: body.outletId,
      outletName: body.outletName,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      customerId: body.customerId,
      customerName: body.customerName,
      totalMinor: body.totalMinor,
      referenceNumber: held.holdNumber,
      deviceId: body.deviceId,
      wasOffline: body.wasOffline,
    })

    return NextResponse.json({ heldOrder: held }, { status: 201 })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    return NextResponse.json({ error: 'Failed to hold order' }, { status: 500 })
  }
}
