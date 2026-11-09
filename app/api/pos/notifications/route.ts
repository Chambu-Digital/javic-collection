import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()

    // Fetch online orders (not from POS channel) — last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const orders = await Order.find({
      channel: { $ne: 'pos' },
      createdAt: { $gte: sevenDaysAgo }
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('orderNumber customerEmail userId totalAmount status posSeenAt createdAt')
      .lean()

    // Lookup customer names from User model
    const userIds = orders
      .filter(o => o.userId)
      .map(o => o.userId)

    const users = await User.find({ _id: { $in: userIds } })
      .select('_id firstName lastName email')
      .lean()

    const userMap = new Map(users.map(u => [u._id.toString(), u]))

    // Format notifications
    const notifications = orders.map(order => {
      const customer = order.userId ? userMap.get(order.userId.toString()) : null
      const customerName = customer
        ? `${customer.firstName} ${customer.lastName}`.trim()
        : order.customerEmail.split('@')[0]

      return {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerName,
        customerEmail: order.customerEmail,
        customerId: order.userId?.toString() || null,
        totalAmount: order.totalAmount,
        status: order.status,
        seen: !!order.posSeenAt,
        createdAt: order.createdAt,
      }
    })

    const unseenCount = notifications.filter(n => !n.seen).length

    return NextResponse.json({
      notifications,
      unseenCount
    })

  } catch (error: any) {
    console.error('Error fetching POS notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
