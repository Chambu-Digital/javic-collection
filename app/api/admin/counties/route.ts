import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import County from '@/models/County'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    await connectDB()
    
    const counties = await County.find({})
      .sort({ name: 1 })
      .lean()
    
    return NextResponse.json({ counties })
    
  } catch (error: any) {
    console.error('Error fetching counties:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch counties' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)

    await connectDB()
    
    const body = await request.json()
    const { name, code, defaultShippingFee, estimatedDeliveryDays, isActive } = body

    // Validate required fields
    if (!name || !code || defaultShippingFee === undefined || !estimatedDeliveryDays) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const county = new County({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      defaultShippingFee: Number(defaultShippingFee),
      estimatedDeliveryDays: Number(estimatedDeliveryDays),
      isActive: isActive !== false
    })

    await county.save()
    
    return NextResponse.json({ 
      message: 'County created successfully',
      county 
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Error creating county:', error)
    
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
      { error: 'Failed to create county' },
      { status: 500 }
    )
  }
}
