import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Outlet from '@/models/Outlet'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    await requirePosPermission(request, POS_PERMISSIONS.SETTINGS)
    await connectDB()

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const query: Record<string, unknown> = {}
    if (isActive === 'true') query.isActive = true
    if (isActive === 'false') query.isActive = false

    const outlets = await Outlet.find(query).sort({ name: 1 }).lean()
    return NextResponse.json({ outlets })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/settings/outlets]', error)
    return NextResponse.json({ error: 'Failed to fetch outlets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requirePosPermission(request, POS_PERMISSIONS.SETTINGS)
    await connectDB()
    const body = await request.json()

    const outlet = new Outlet({
      ...body,
      createdBy: user.id,
    })
    await outlet.save()

    return NextResponse.json({ outlet }, { status: 201 })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/settings/outlets]', error)
    return NextResponse.json({ error: 'Failed to create outlet' }, { status: 500 })
  }
}
