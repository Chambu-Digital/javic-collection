import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePosPermission(request, POS_PERMISSIONS.SETTINGS)
    await connectDB()

    const { id } = await params
    const body = await request.json() as {
      posRole?: string
      posOutletId?: string
      permissions?: string[]
      isActive?: boolean
      phone?: string
    }

    const updates: Record<string, unknown> = {}
    if (body.posRole      !== undefined) updates.posRole      = body.posRole
    if (body.posOutletId  !== undefined) updates.posOutletId  = body.posOutletId || undefined
    if (body.permissions  !== undefined) updates.permissions  = body.permissions
    if (body.isActive     !== undefined) updates.isActive     = body.isActive
    if (body.phone        !== undefined) updates.phone        = body.phone

    const user = await User.findByIdAndUpdate(id, updates, { new: true })
      .select('firstName lastName email phone posRole posOutletId role permissions isActive')

    if (!user) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })

    return NextResponse.json({ staff: user.toObject() })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePosPermission(request, POS_PERMISSIONS.SETTINGS)
    await connectDB()

    const { id } = await params
    // Soft-delete: just revoke posRole so they lose POS access but account stays
    const user = await User.findByIdAndUpdate(
      id,
      { $unset: { posRole: '' }, isActive: false },
      { new: true }
    ).select('firstName lastName email')

    if (!user) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    return NextResponse.json({ message: 'Staff access revoked' })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    return NextResponse.json({ error: 'Failed to remove staff member' }, { status: 500 })
  }
}
