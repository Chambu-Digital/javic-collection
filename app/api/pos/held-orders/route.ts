import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import PosHeldOrder from '@/models/PosHeldOrder'
import Outlet from '@/models/Outlet'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'
import { createLedgerEntry } from '@/lib/pos/ledger-service'

// Generate hold number in application code so it works without a DB query in
// a pre('save') hook (same pattern used for LedgerEntry entryNumber).
async function generateHoldNumber(): Promise<string> {
  const date = new Date()
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, '')
  const unique = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `HLD${stamp}-${unique}`
}

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
    const { user } = await requirePosPermission(request, POS_PERMISSIONS.HOLD_ORDERS)
    await connectDB()
    const body = await request.json()

    // Look up outlet name so we don't rely on the client sending it
    const outlet = await Outlet.findById(body.outletId).lean()

    // Generate holdNumber here — avoids a DB query inside a pre('save') hook
    const holdNumber = await generateHoldNumber()

    const held = new PosHeldOrder({
      ...body,
      holdNumber,
      cashierId: user.id,
      cashierName: `${user.firstName} ${user.lastName}`.trim(),
      outletId: body.outletId,
      outletName: (outlet as any)?.name || 'Main Shop',
      status: 'held',
      wasOffline: body.wasOffline ?? false,
    })
    await held.save()

    await createLedgerEntry({
      eventType: 'held_order_created',
      source: 'pos',
      channel: 'pos',
      outletId: body.outletId,
      outletName: (outlet as any)?.name || 'Main Shop',
      userId: user.id as any,
      userName: `${user.firstName} ${user.lastName}`.trim(),
      customerId: body.customerId,
      customerName: body.customerName,
      totalMinor: body.totalMinor ?? 0,
      referenceNumber: holdNumber,
      deviceId: body.deviceId,
      wasOffline: body.wasOffline ?? false,
    })

    return NextResponse.json({ heldOrder: held.toObject() }, { status: 201 })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/held-orders POST]', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to hold order'
    }, { status: 500 })
  }
}
