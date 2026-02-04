import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Order from '@/models/Order'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    
    // Only admins and super admins can view customer details
    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const { id } = await params
    
    await connectDB()
    
    // Validate customer ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      )
    }
    
    // Find the customer
    const customer = await User.findById(id)
      .select('-password -passwordResetToken -emailVerificationToken')
      .lean()
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Ensure it's a customer (not admin)
    if (customer.role !== 'customer') {
      return NextResponse.json(
        { error: 'User is not a customer' },
        { status: 400 }
      )
    }
    
    // Get customer orders
    const orders = await Order.find({ userId: new mongoose.Types.ObjectId(id) })
      .sort({ createdAt: -1 })
      .limit(20) // Latest 20 orders
      .lean()
    
    // Calculate customer statistics
    const totalOrders = await Order.countDocuments({ userId: new mongoose.Types.ObjectId(id) })
    
    const orderStats = await Order.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
            }
          },
          pendingOrders: {
            $sum: {
              $cond: [{ $in: ['$status', ['pending', 'confirmed', 'processing']] }, 1, 0]
            }
          }
        }
      }
    ])
    
    const stats = orderStats[0] || {
      totalSpent: 0,
      averageOrderValue: 0,
      completedOrders: 0,
      pendingOrders: 0
    }
    
    return NextResponse.json({
      customer,
      orders,
      stats: {
        ...stats,
        totalOrders
      }
    })
    
  } catch (error: any) {
    console.error('Error fetching customer details:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch customer details' },
      { status: 500 }
    )
  }
}