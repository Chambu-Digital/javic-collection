import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('order')
    const phone = searchParams.get('phone')

    if (!orderNumber && !phone) {
      return NextResponse.json({ error: 'Provide an order number or phone number' }, { status: 400 })
    }

    const query: any = {}
    if (orderNumber) query.orderNumber = orderNumber.trim().toUpperCase()
    if (phone) {
      const cleaned = phone.trim().replace(/\s+/g, '')
      query.$or = [
        { whatsapp_phone: cleaned },
        { customerPhone: cleaned },
        { 'shippingAddress.phone': cleaned }
      ]
    }

    const order = await Order.findOne(query).lean()

    if (!order) {
      return NextResponse.json({ order: null }, { status: 404 })
    }

    // Return only what the customer needs — no sensitive internal fields
    return NextResponse.json({
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        items: order.items.map(i => ({
          productName: i.productName,
          productImage: i.productImage,
          quantity: i.quantity,
          price: i.price,
          totalPrice: i.totalPrice
        })),
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    })
  } catch (error) {
    console.error('Error tracking order:', error)
    return NextResponse.json({ error: 'Failed to track order' }, { status: 500 })
  }
}
