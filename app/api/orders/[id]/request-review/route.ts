import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import { requireAdmin } from '@/lib/auth'
import crypto from 'crypto'

const BUSINESS_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '254723277306'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    await connectDB()

    const { id } = await params
    const order = await Order.findById(id)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'completed' && order.status !== 'delivered') {
      return NextResponse.json({ error: 'Order must be completed before requesting a review' }, { status: 400 })
    }

    if (order.review_request_status === 'requested') {
      return NextResponse.json({ error: 'Review already requested for this order' }, { status: 400 })
    }

    const phone = order.whatsapp_phone || order.customerPhone || order.shippingAddress?.phone
    if (!phone) {
      return NextResponse.json({ error: 'No WhatsApp phone number on this order' }, { status: 400 })
    }

    // Generate unique review token
    const token = crypto.randomBytes(24).toString('hex')
    const reviewLink = `${BASE_URL}/review/${token}`

    // Update order
    order.review_token = token
    order.review_token_created_at = new Date()
    order.review_request_status = 'requested'
    await order.save()

    // Build WhatsApp message
    const productNames = order.items.map(i => i.productName).join(', ')
    const message = `Hi 👋, thanks for your order of ${productNames}! How was the product? We'd really appreciate a quick review: ${reviewLink}`
    const encoded = encodeURIComponent(message)

    // Format phone for WhatsApp (remove leading 0, add 254 if needed)
    let waPhone = phone.replace(/\s+/g, '').replace(/^\+/, '')
    if (waPhone.startsWith('0')) waPhone = '254' + waPhone.slice(1)

    const whatsappUrl = `https://wa.me/${waPhone}?text=${encoded}`

    return NextResponse.json({ success: true, whatsappUrl, reviewLink, token })
  } catch (error: any) {
    console.error('Error requesting review:', error)
    if (error.message === 'Admin access required' || error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to request review' }, { status: 500 })
  }
}
