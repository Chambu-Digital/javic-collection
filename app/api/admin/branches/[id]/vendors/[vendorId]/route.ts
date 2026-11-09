import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BranchVendor from '@/models/BranchVendor'
import { requireAdmin } from '@/lib/auth'
import mongoose from 'mongoose'

// PUT /api/admin/branches/[branchId]/vendors/[vendorId] - Update vendor assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vendorId: string }> }
) {
  try {
    await requireAdmin(request)
    await connectDB()

    const { id: branchId, vendorId } = await params
    const body = await request.json()
    const { isActive } = body

    if (!mongoose.Types.ObjectId.isValid(branchId) || !mongoose.Types.ObjectId.isValid(vendorId)) {
      return NextResponse.json(
        { error: 'Invalid branch or vendor ID' },
        { status: 400 }
      )
    }

    const assignment = await BranchVendor.findOne({ branchId, vendorId })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Vendor assignment not found' },
        { status: 404 }
      )
    }

    // Update isActive status
    if (typeof isActive === 'boolean') {
      assignment.isActive = isActive
    }

    await assignment.save()

    const updated = await BranchVendor.findById(assignment._id)
      .populate('branchId')
      .populate('vendorId')
      .lean()

    return NextResponse.json({
      success: true,
      message: `Vendor assignment ${isActive ? 'activated' : 'deactivated'}`,
      assignment: updated
    })
  } catch (error: any) {
    console.error('Error updating vendor assignment:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/branches/[branchId]/vendors/[vendorId] - Unassign vendor from branch
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vendorId: string }> }
) {
  try {
    await requireAdmin(request)
    await connectDB()

    const { id: branchId, vendorId } = await params

    if (!mongoose.Types.ObjectId.isValid(branchId) || !mongoose.Types.ObjectId.isValid(vendorId)) {
      return NextResponse.json(
        { error: 'Invalid branch or vendor ID' },
        { status: 400 }
      )
    }

    const assignment = await BranchVendor.findOne({ branchId, vendorId })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Vendor assignment not found' },
        { status: 404 }
      )
    }

    // Use deleteOne to trigger pre-delete hooks
    await assignment.deleteOne()

    return NextResponse.json({
      success: true,
      message: 'Vendor unassigned from branch'
    })
  } catch (error: any) {
    console.error('Error unassigning vendor:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    if (error.message.includes('Cannot unassign')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to unassign vendor' },
      { status: 500 }
    )
  }
}
