import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import PosSyncQueue from '@/models/PosSyncQueue'
import PosSyncConflict from '@/models/PosSyncConflict'
import { requirePosAuth, handlePosAuthError } from '@/lib/pos/auth'

export async function GET(request: NextRequest) {
  try {
    await requirePosAuth(request)
    await connectDB()

    const [pending, synced, failed, conflicts] = await Promise.all([
      PosSyncQueue.find({ status: 'pending' }).sort({ createdAt: 1 }).limit(100).lean(),
      PosSyncQueue.find({ status: 'synced' }).sort({ syncedAt: -1 }).limit(50).lean(),
      PosSyncQueue.find({ status: 'failed' }).sort({ updatedAt: -1 }).limit(50).lean(),
      PosSyncConflict.find({ resolutionStatus: 'pending' }).sort({ createdAt: -1 }).lean(),
    ])

    return NextResponse.json({
      pending,
      synced,
      failed,
      conflicts,
      counts: {
        pending: pending.length,
        synced: synced.length,
        failed: failed.length,
        conflicts: conflicts.length,
      },
    })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    return NextResponse.json({ error: 'Failed to fetch sync status' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePosAuth(request)
    await connectDB()
    const body = await request.json()

    const item = await PosSyncQueue.findOneAndUpdate(
      { clientId: body.clientId },
      {
        clientId: body.clientId,
        recordType: body.recordType,
        payload: body.payload,
        status: 'pending',
        deviceId: body.deviceId,
        outletId: body.outletId,
        userId: body.userId,
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({ item })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    return NextResponse.json({ error: 'Failed to queue sync item' }, { status: 500 })
  }
}
