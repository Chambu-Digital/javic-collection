import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  trackingNumber: z.string().optional(),
  adminNotes: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    // Check if user has admin permissions
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    await connectDB()
    
    const order = await Order.findById(id).lean()
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ order })
    
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
    const { id } = await params
    const body = await request.json()
    
    // Check if user has admin permissions
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    // Validate input
    const validatedData = updateOrderSchema.parse(body)
    
    await connectDB()
    
    const order = await Order.findById(id)
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // Update order fields
    if (validatedData.status) {
      order.status = validatedData.status
      
      // Set timestamps based on status
      if (validatedData.status === 'shipped' && !order.shippedAt) {
        order.shippedAt = new Date()
      }
      if (validatedData.status === 'delivered' && !order.deliveredAt) {
        order.deliveredAt = new Date()
      }
    }
    
    if (validatedData.paymentStatus) {
      order.paymentStatus = validatedData.paymentStatus
    }
    
    if (validatedData.trackingNumber !== undefined) {
      order.trackingNumber = validatedData.trackingNumber || undefined
    }
    
    if (validatedData.adminNotes !== undefined) {
      order.adminNotes = validatedData.adminNotes || undefined
    }
    
    await order.save()
    
    return NextResponse.json({
      message: 'Order updated successfully',
      order
    })
    
  } catch (error: any) {
    console.error('Error updating order:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
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