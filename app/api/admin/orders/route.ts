import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Check if user has admin permissions
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const search = searchParams.get('search')
    const skip = (page - 1) * limit
    
    await connectDB()
    
    // Build query
    const query: any = {}
    
    if (status && status !== 'all') {
      query.status = status
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus
    }
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } }
      ]
    }
    
    // Get orders with pagination
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    // Get total count for pagination
    const total = await Order.countDocuments(query)
    
    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
    
  } catch (error: any) {
    console.error('Error fetching admin orders:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
