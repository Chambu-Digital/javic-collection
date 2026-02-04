import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    await connectDB()
    
    // Find order by ID and ensure it belongs to the current user
    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(user.id)
    }).lean()
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(order)
    
  } catch (error: any) {
    console.error('Error fetching order:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { id } = await params
    
    await connectDB()
    
    // Find order and ensure it belongs to the current user
    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(user.id)
    })
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // Only allow certain status changes by customers
    const allowedUpdates = ['cancelled']
    const { status } = body
    
    if (status && !allowedUpdates.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status update' },
        { status: 400 }
      )
    }
    
    // Only allow cancellation if order is in pending or confirmed status
    if (status === 'cancelled' && !['pending', 'confirmed'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Order cannot be cancelled at this stage' },
        { status: 400 }
      )
    }
    
    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean()
    
    return NextResponse.json(updatedOrder)
    
  } catch (error: any) {
    console.error('Error updating order:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}