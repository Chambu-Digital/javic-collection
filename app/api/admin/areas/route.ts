import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Area from '@/models/Area'
import County from '@/models/County'
import { requireAdmin } from '@/lib/auth'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const countyId = searchParams.get('countyId')
    
    let query = {}
    if (countyId && mongoose.Types.ObjectId.isValid(countyId)) {
      query = { countyId: new mongoose.Types.ObjectId(countyId) }
    }
    
    const areas = await Area.find(query)
      .populate('countyId', 'name code')
      .sort({ countyName: 1, name: 1 })
      .lean()
    
    return NextResponse.json({ areas })
    
  } catch (error: any) {
    console.error('Error fetching areas:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch areas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)

    await connectDB()
    
    const body = await request.json()
    const { name, countyId, shippingFee, estimatedDeliveryDays, isActive } = body

    // Validate required fields (shippingFee is now optional)
    if (!name || !countyId || !estimatedDeliveryDays) {
      return NextResponse.json(
        { error: 'Missing required fields: name, countyId, estimatedDeliveryDays' },
        { status: 400 }
      )
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(countyId)) {
      return NextResponse.json({ error: 'Invalid county ID' }, { status: 400 })
    }

    // Get county info
    const county = await County.findById(countyId)
    if (!county) {
      return NextResponse.json({ error: 'County not found' }, { status: 404 })
    }

    const areaData: any = {
      name: name.trim(),
      countyId: new mongoose.Types.ObjectId(countyId),
      countyName: county.name,
      estimatedDeliveryDays: Number(estimatedDeliveryDays),
      isActive: isActive !== false
    }
    
    // Only set shippingFee if provided (undefined means use county default, 0 means free)
    if (shippingFee !== undefined && shippingFee !== null) {
      areaData.shippingFee = Number(shippingFee)
    }

    const area = new Area(areaData)

    await area.save()
    
    return NextResponse.json({ 
      message: 'Area created successfully',
      area 
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Error creating area:', error)
    
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
      { error: 'Failed to create area' },
      { status: 500 }
    )
  }
}