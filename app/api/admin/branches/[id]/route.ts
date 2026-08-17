import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Branch from '@/models/Branch'
import BranchStock from '@/models/BranchStock'
import Order from '@/models/Order'
import { requireAuth } from '@/lib/auth'

// GET /api/admin/branches/[id] - Get single branch
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await connectDB()

    const branch = await Branch.findById(params.id)
    
    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ branch })
  } catch (error: any) {
    console.error('Error fetching branch:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch branch' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/branches/[id] - Update branch
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await connectDB()

    const body = await request.json()
    const { name, branchCode, location, address, isActive, isMainBranch } = body

    const branch = await Branch.findById(params.id)
    
    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    // If changing branch code, check uniqueness
    if (branchCode && branchCode.toUpperCase() !== branch.branchCode) {
      const existing = await Branch.findOne({ 
        branchCode: branchCode.toUpperCase(),
        _id: { $ne: params.id }
      })
      
      if (existing) {
        return NextResponse.json(
          { error: 'Branch code already exists' },
          { status: 400 }
        )
      }
    }

    // If setting as main branch, ensure only one main branch exists
    if (isMainBranch && !branch.isMainBranch) {
      const existingMain = await Branch.findOne({ 
        isMainBranch: true,
        _id: { $ne: params.id }
      })
      
      if (existingMain) {
        return NextResponse.json(
          { error: 'A main branch already exists. Unset the current main branch first.' },
          { status: 400 }
        )
      }
    }

    // Ensure at least one active main branch always exists
    if (!isActive && branch.isMainBranch) {
      return NextResponse.json(
        { error: 'Cannot deactivate the main branch' },
        { status: 400 }
      )
    }

    // Update fields
    if (name) branch.name = name.trim()
    if (branchCode) branch.branchCode = branchCode.toUpperCase().trim()
    if (location !== undefined) branch.location = location?.trim()
    if (address !== undefined) branch.address = address?.trim()
    if (isActive !== undefined) branch.isActive = isActive
    if (isMainBranch !== undefined) branch.isMainBranch = isMainBranch

    await branch.save()

    return NextResponse.json({ 
      success: true, 
      branch 
    })
  } catch (error: any) {
    console.error('Error updating branch:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update branch' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/branches/[id] - Delete/Deactivate branch
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await connectDB()

    const branch = await Branch.findById(params.id)
    
    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    // Cannot delete main branch
    if (branch.isMainBranch) {
      return NextResponse.json(
        { error: 'Cannot delete the main branch' },
        { status: 400 }
      )
    }

    // Check for historical records
    const hasStock = await BranchStock.findOne({ branchId: params.id })
    const hasOrders = await Order.findOne({ 'items.branchId': params.id })

    if (hasStock || hasOrders) {
      // Deactivate instead of delete
      branch.isActive = false
      await branch.save()
      
      return NextResponse.json({ 
        success: true, 
        message: 'Branch has historical records and has been deactivated instead of deleted',
        branch 
      })
    }

    // Safe to delete
    await branch.deleteOne()

    return NextResponse.json({ 
      success: true, 
      message: 'Branch deleted successfully' 
    })
  } catch (error: any) {
    console.error('Error deleting branch:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete branch' },
      { status: 500 }
    )
  }
}
