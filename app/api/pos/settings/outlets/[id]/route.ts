import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Outlet from '@/models/Outlet'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePosPermission(request, POS_PERMISSIONS.SETTINGS)
    await connectDB()
    const { id } = await params
    const outlet = await Outlet.findById(id).lean()
    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })
    }

    return NextResponse.json({ outlet })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/settings/outlets/[id]]', error)
    return NextResponse.json({ error: 'Failed to fetch outlet' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requirePosPermission(request, POS_PERMISSIONS.SETTINGS)
    await connectDB()
    const { id } = await params
    const body = await request.json()

    const outlet = await Outlet.findByIdAndUpdate(
      id,
      { ...body, updatedBy: user.id },
      { new: true, runValidators: true }
    ).lean()

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })
    }

    return NextResponse.json({ outlet })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/settings/outlets/[id]]', error)
    return NextResponse.json({ error: 'Failed to update outlet' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requirePosPermission(request, POS_PERMISSIONS.SETTINGS)
    await connectDB()
    const { id } = await params

    const outlet = await Outlet.findByIdAndUpdate(
      id,
      { isActive: false, deletedBy: user.id },
      { new: true }
    ).lean()

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })
    }

    return NextResponse.json({ outlet })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/settings/outlets/[id]]', error)
    return NextResponse.json({ error: 'Failed to delete outlet' }, { status: 500 })
  }
}
