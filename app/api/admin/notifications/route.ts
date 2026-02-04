import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import AdminRequest from '@/models/AdminRequest'
import Order from '@/models/Order'
import Review from '@/models/Review'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Only admins and super admins can access notifications
    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    await connectDB()
    
    const notifications: any = {
      requests: 0,
      orders: 0,
      products: 0,
      // customers: 0, // Commented out - not using customers
      reports: 0,
      // reviews: 0 // Commented out - not using reviews
    }

    // Admin Requests (Super Admin only)
    if (user.role === 'super_admin') {
      const pendingRequests = await AdminRequest.countDocuments({ status: 'pending' })
      notifications.requests = pendingRequests
    }

    // New Orders (last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const newOrders = await Order.countDocuments({
      createdAt: { $gte: yesterday },
      status: 'pending'
    })
    notifications.orders = newOrders

    // Low Stock Products (if you have inventory tracking)
    // This would require adding stock fields to Product model
    // For now, we'll set it to 0
    notifications.products = 0

    // New Customers (last 7 days) - COMMENTED OUT - not using customers
    // notifications.customers = 0

    // Reports that need attention - placeholder
    notifications.reports = 0

    // Pending Reviews - COMMENTED OUT - not using reviews
    // const pendingReviews = await Review.countDocuments({ status: 'pending' })
    // notifications.reviews = pendingReviews

    return NextResponse.json({ notifications })
    
  } catch (error: any) {
    // Don't log authentication errors as they're expected for non-admin users
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
