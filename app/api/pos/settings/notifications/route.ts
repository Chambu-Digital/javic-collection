import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import NotificationSettings from '@/models/NotificationSettings'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { user } = await requirePosPermission(request, POS_PERMISSIONS.SETTINGS)
    await connectDB()

    const { searchParams } = new URL(request.url)
    const outletId = searchParams.get('outletId')

    const query: Record<string, unknown> = {}
    if (outletId) query.outletId = outletId
    else query.userId = user.id

    let settings = await NotificationSettings.findOne(query).lean()
    
    // Create default settings if none exist
    if (!settings) {
      settings = new NotificationSettings({
        userId: user.id,
        outletId: outletId || undefined,
      })
      await settings.save()
    }

    return NextResponse.json({ settings })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/settings/notifications]', error)
    return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await requirePosPermission(request, POS_PERMISSIONS.SETTINGS)
    await connectDB()
    const body = await request.json()

    const { searchParams } = new URL(request.url)
    const outletId = searchParams.get('outletId')

    const query: Record<string, unknown> = {}
    if (outletId) query.outletId = outletId
    else query.userId = user.id

    const settings = await NotificationSettings.findOneAndUpdate(
      query,
      { ...body, updatedBy: user.id },
      { new: true, upsert: true, runValidators: true }
    ).lean()

    return NextResponse.json({ settings })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/settings/notifications]', error)
    return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 })
  }
}
