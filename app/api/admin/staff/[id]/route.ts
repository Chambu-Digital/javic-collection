import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requireAdmin } from '@/lib/auth'
import mongoose from 'mongoose'

// PATCH — update role, permissions, or active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super_admin can update staff' }, { status: 403 })
    }

    const { id } = params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    await connectDB()

    const target = await User.findById(id)
    if (!target) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    if (target._id.toString() === admin.id && request.body) {
      const body = await request.json()
      if (body.isActive === false) {
        return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 })
      }
    }

    const body = await request.json()
    const allowed = ['role', 'permissions', 'isActive']
    const updates: Record<string, any> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    const updated = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .select('-password -passwordResetToken -emailVerificationToken')

    return NextResponse.json({ message: 'Staff member updated', user: updated })
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 })
  }
}

// DELETE — remove a staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super_admin can delete staff' }, { status: 403 })
    }

    const { id } = params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    if (id === admin.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    await connectDB()

    const target = await User.findById(id)
    if (!target) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    await User.findByIdAndDelete(id)

    console.log(`[admin/staff DELETE] ${admin.email} deleted staff: ${target.email}`)

    return NextResponse.json({ success: true, message: 'Staff member deleted' })
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 })
  }
}
