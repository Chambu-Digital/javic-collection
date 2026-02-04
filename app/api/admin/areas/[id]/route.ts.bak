import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Area from '@/models/Area'
import County from '@/models/County'
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
    const { name, countyId, shippingFee, estimatedDeliveryDays, isActive } = body

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid area ID' }, { status: 400 })
    }

    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name.trim()
    if (shippingFee !== undefined) updateData.shippingFee = Number(shippingFee)
    if (estimatedDeliveryDays !== undefined) updateData.estimatedDeliveryDays = Number(estimatedDeliveryDays)
    if (isActive !== undefined) updateData.isActive = isActive

    // Handle county change
    if (countyId && mongoose.Types.ObjectId.isValid(countyId)) {
      const county = await County.findById(countyId)
      if (!county) {
        return NextResponse.json({ error: 'County not found' }, { status: 404 })
      }
      updateData.countyId = new mongoose.Types.ObjectId(countyId)
      updateData.countyName = county.name
    }

    const area = await Area.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!area) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      message: 'Area updated successfully',
      area 
    })
    
  } catch (error: any) {
    console.error('Error updating area:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Area name already exists in this county' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update area' },
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
      return NextResponse.json({ error: 'Invalid area ID' }, { status: 400 })
    }

    const area = await Area.findByIdAndDelete(id)
    
    if (!area) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      message: 'Area deleted successfully' 
    })
    
  } catch (error: any) {
    console.error('Error deleting area:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to delete area' },
      { status: 500 }
    )
  }
}