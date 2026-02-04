import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import County from '@/models/County'
import Area from '@/models/Area'
import { requireAdmin } from '@/lib/auth'
import mongoose from 'mongoose'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)

    await connectDB()
    
    const { id } = await params
    const body = await request.json()
    const { name, code, defaultShippingFee, estimatedDeliveryDays, isActive } = body

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid county ID' }, { status: 400 })
    }

    const county = await County.findByIdAndUpdate(
      id,
      {
        name: name?.trim(),
        code: code?.trim().toUpperCase(),
        defaultShippingFee: defaultShippingFee !== undefined ? Number(defaultShippingFee) : undefined,
        estimatedDeliveryDays: estimatedDeliveryDays !== undefined ? Number(estimatedDeliveryDays) : undefined,
        isActive
      },
      { new: true, runValidators: true }
    )

    if (!county) {
      return NextResponse.json({ error: 'County not found' }, { status: 404 })
    }

    // Update countyName in all related areas if name changed
    if (name && name.trim() !== county.name) {
      await Area.updateMany(
        { countyId: county._id },
        { countyName: name.trim() }
      )
    }
    
    return NextResponse.json({ 
      message: 'County updated successfully',
      county 
    })
    
  } catch (error: any) {
    console.error('Error updating county:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'County name or code already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update county' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)

    await connectDB()
    
    const { id } = await params

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid county ID' }, { status: 400 })
    }

    // Check if county has areas
    const areasCount = await Area.countDocuments({ countyId: id })
    if (areasCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete county with existing areas. Delete areas first.' },
        { status: 400 }
      )
    }

    const county = await County.findByIdAndDelete(id)
    
    if (!county) {
      return NextResponse.json({ error: 'County not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      message: 'County deleted successfully' 
    })
    
  } catch (error: any) {
    console.error('Error deleting county:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to delete county' },
      { status: 500 }
    )
  }
}