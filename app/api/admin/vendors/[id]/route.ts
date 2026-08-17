import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Vendor from '@/models/Vendor'
import { requireAdmin } from '@/lib/auth'

// GET /api/admin/vendors/[id] - Get vendor by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    await connectDB()

    const { id } = await params
    const vendor = await Vendor.findById(id)

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(vendor)
  } catch (error: any) {
    console.error('Error fetching vendor:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch vendor' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/vendors/[id] - Update vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    await connectDB()

    const { id } = await params
    const body = await request.json()

    const vendor = await Vendor.findById(id)
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Prevent changing isHouseStock if vendor has inventory
    // (You may want to add this check later if needed)
    
    // Check if new vendor code conflicts
    if (body.vendorCode && body.vendorCode !== vendor.vendorCode) {
      const existing = await Vendor.findOne({ 
        vendorCode: body.vendorCode.toUpperCase(),
        _id: { $ne: id }
      })
      
      if (existing) {
        return NextResponse.json(
          { error: 'Vendor code already exists' },
          { status: 400 }
        )
      }
    }

    // Update allowed fields
    if (body.name) vendor.name = body.name
    if (body.vendorCode) vendor.vendorCode = body.vendorCode.toUpperCase()
    if (body.phone !== undefined) vendor.phone = body.phone
    if (body.email !== undefined) vendor.email = body.email
    if (body.notes !== undefined) vendor.notes = body.notes
    if (body.isActive !== undefined) vendor.isActive = body.isActive
    if (body.isHouseStock !== undefined) vendor.isHouseStock = body.isHouseStock

    await vendor.save()

    return NextResponse.json({
      success: true,
      vendor
    })
  } catch (error: any) {
    console.error('Error updating vendor:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/vendors/[id] - Delete vendor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    await connectDB()

    const { id } = await params
    const vendor = await Vendor.findById(id)

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // The pre-delete hook in the model will check for inventory and sales history
    await vendor.deleteOne()

    return NextResponse.json({
      success: true,
      message: 'Vendor deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting vendor:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    // Deletion protection errors from model hooks
    if (error.message.includes('Cannot delete')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    )
  }
}
