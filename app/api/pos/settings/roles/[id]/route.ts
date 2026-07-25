import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Role from '@/models/Role'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePosPermission(request, POS_PERMISSIONS.SETTINGS)
    await connectDB()

    const role = await Role.findById(params.id).lean()
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({ role })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/settings/roles/[id]]', error)
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requirePosPermission(request, POS_PERMISSIONS.SETTINGS)
    await connectDB()
    const body = await request.json()

    // Prevent modifying system roles
    const existingRole = await Role.findById(params.id)
    if (existingRole?.isSystem) {
      return NextResponse.json({ error: 'Cannot modify system roles' }, { status: 403 })
    }

    const role = await Role.findByIdAndUpdate(
      params.id,
      { ...body, updatedBy: user.id },
      { new: true, runValidators: true }
    ).lean()

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({ role })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/settings/roles/[id]]', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requirePosPermission(request, POS_PERMISSIONS.SETTINGS)
    await connectDB()

    // Prevent deleting system roles
    const existingRole = await Role.findById(params.id)
    if (existingRole?.isSystem) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 403 })
    }

    const role = await Role.findByIdAndUpdate(
      params.id,
      { isActive: false, deletedBy: user.id },
      { new: true }
    ).lean()

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({ role })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/settings/roles/[id]]', error)
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 })
  }
}
