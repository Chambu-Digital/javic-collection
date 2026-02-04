import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    await connectDB()
    
    // Get order statistics for the current user
    const stats = await Order.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(user.id) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          confirmed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0]
            }
          },
          processing: {
            $sum: {
              $cond: [{ $eq: ['$status', 'processing'] }, 1, 0]
            }
          },
          shipped: {
            $sum: {
              $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0]
            }
          },
          delivered: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
            }
          },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
            }
          },
          returned: {
            $sum: {
              $cond: [{ $eq: ['$status', 'returned'] }, 1, 0]
            }
          }
        }
      }
    ])
    
    const result = stats[0] || {
      total: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0
    }
    
    return NextResponse.json(result)
    
  } catch (error: any) {
    console.error('Error fetching order stats:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch order statistics' },
      { status: 500 }
    )
  }
}