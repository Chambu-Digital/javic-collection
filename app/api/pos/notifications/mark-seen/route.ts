import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { orderId, markAll } = body

    if (markAll) {
      // Mark all unseen online orders as seen
      await Order.updateMany(
        {
          channel: { $ne: 'pos' },
          posSeenAt: null
        },
        { $set: { posSeenAt: new Date() } }
      )

      return NextResponse.json({ success: true, message: 'All notifications marked as seen' })
    }

    if (orderId) {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
      }

      await Order.findByIdAndUpdate(orderId, {
        $set: { posSeenAt: new Date() }
      })

      return NextResponse.json({ success: true, message: 'Notification marked as seen' })
    }

    return NextResponse.json({ error: 'orderId or markAll required' }, { status: 400 })

  } catch (error: any) {
    console.error('Error marking notification as seen:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as seen' },
      { status: 500 }
    )
  }
}
