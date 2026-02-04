import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Area from '@/models/Area'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id } = await params
    
    const areas = await Area.find({ 
      countyId: new mongoose.Types.ObjectId(id),
      isActive: true 
    })
      .select('_id name shippingFee estimatedDeliveryDays')
      .sort({ name: 1 })
      .lean()
    
    return NextResponse.json({
      areas
    })
    
  } catch (error) {
    console.error('Error fetching areas:', error)
    return NextResponse.json(
      { error: 'Failed to fetch areas' },
      { status: 500 }
    )
  }
}