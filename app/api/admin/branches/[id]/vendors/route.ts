import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BranchVendor from '@/models/BranchVendor'
import Branch from '@/models/Branch'
import Vendor from '@/models/Vendor'
import { requireAdmin } from '@/lib/auth'
import mongoose from 'mongoose'

// GET /api/admin/branches/[branchId]/vendors - Get vendors assigned to a branch
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    await connectDB()

    const { id: branchId } = await params
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') !== 'false' // Default to true

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return NextResponse.json(
        { error: 'Invalid branch ID' },
        { status: 400 }
      )
    }

    // Verify branch exists
    const branch = await Branch.findById(branchId)
    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    // Get vendors for this branch
    const vendors = await BranchVendor.getVendorsForBranch(branchId, activeOnly)

    return NextResponse.json({
      success: true,
      vendors,
      total: vendors.length,
      branch: {
        _id: branch._id,
        name: branch.name,
        branchCode: branch.branchCode
      }
    })
  } catch (error: any) {
    console.error('Error fetching branch vendors:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}

// POST /api/admin/branches/[branchId]/vendors - Assign vendor to branch
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    await connectDB()

    const { id: branchId } = await params
    const body = await request.json()
    const { vendorId } = body

    // Validation
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return NextResponse.json(
        { error: 'Invalid branch ID' },
        { status: 400 }
      )
    }

    if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId)) {
      return NextResponse.json(
        { error: 'Valid vendor ID is required' },
        { status: 400 }
      )
    }

    // Verify branch and vendor exist
    const [branch, vendor] = await Promise.all([
      Branch.findById(branchId),
      Vendor.findById(vendorId)
    ])

    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Check if already assigned
    const existing = await BranchVendor.findOne({ branchId, vendorId })
    if (existing) {
      return NextResponse.json(
        { error: 'Vendor is already assigned to this branch' },
        { status: 400 }
      )
    }

    // Create assignment
    const assignment = new BranchVendor({
      branchId,
      vendorId,
      isActive: true,
      assignedAt: new Date()
    })

    await assignment.save()

    // Return full vendor details
    const assignedVendor = await BranchVendor.findById(assignment._id)
      .populate('vendorId')
      .lean()

    return NextResponse.json({
      success: true,
      message: `${vendor.name} assigned to ${branch.name}`,
      assignment: assignedVendor
    })
  } catch (error: any) {
    console.error('Error assigning vendor to branch:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    if (error.message.includes('Cannot assign')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to assign vendor' },
      { status: 500 }
    )
  }
}
