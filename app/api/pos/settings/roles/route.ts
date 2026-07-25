import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Role from '@/models/Role'
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

    const roles = await Role.find(query).sort({ name: 1 }).lean()
    return NextResponse.json({ roles })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/settings/roles]', error)
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requirePosPermission(request, POS_PERMISSIONS.SETTINGS)
    await connectDB()
    const body = await request.json()

    const role = new Role({
      ...body,
      createdBy: user.id,
    })
    await role.save()

    return NextResponse.json({ role }, { status: 201 })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/settings/roles]', error)
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 })
  }
}
