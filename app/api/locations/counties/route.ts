import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import County from '@/models/County'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const counties = await County.find({ isActive: true })
      .select('_id name code defaultShippingFee estimatedDeliveryDays')
      .sort({ name: 1 })
      .lean()
    
    return NextResponse.json({
      counties
    })
    
  } catch (error) {
    console.error('Error fetching counties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch counties' },
      { status: 500 }
    )
  }
}
