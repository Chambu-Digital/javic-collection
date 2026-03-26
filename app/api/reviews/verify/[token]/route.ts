import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import Review from '@/models/Review'

// GET — validate token and return order/product info
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB()
    const { token } = await params

    const order = await Order.findOne({ review_token: token })

    if (!order) {
      return NextResponse.json({ valid: false, error: 'This review link is no longer valid.' }, { status: 404 })
    }

    if (order.status !== 'completed' && order.status !== 'delivered') {
      return NextResponse.json({ valid: false, error: 'This order is not yet completed.' }, { status: 400 })
    }

    // Check which items haven't been reviewed yet
    const existingReviews = await Review.find({ orderId: order._id })
    const reviewedItemIds = new Set(existingReviews.map(r => r.orderItemId))

    const unreviewedItems = order.items.filter(item => !reviewedItemIds.has(item._id?.toString() || ''))

    if (unreviewedItems.length === 0) {
      return NextResponse.json({ valid: false, error: 'All products in this order have already been reviewed. Thank you!' }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      items: unreviewedItems.map(item => ({
        orderItemId: item._id?.toString(),
        productId: item.productId?.toString(),
        productName: item.productName,
        productImage: item.productImage,
        quantity: item.quantity
      }))
    })
  } catch (error) {
    console.error('Error validating review token:', error)
    return NextResponse.json({ valid: false, error: 'Failed to validate link.' }, { status: 500 })
  }
}

// POST — submit review via token
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB()
    const { token } = await params
    const body = await request.json()
    const { productId, orderItemId, rating, comment, customerName } = body

    if (!productId || !orderItemId || !rating || !customerName?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const numRating = Number(rating)
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const order = await Order.findOne({ review_token: token })

    if (!order) {
      return NextResponse.json({ error: 'This review link is no longer valid.' }, { status: 404 })
    }

    if (order.status !== 'completed' && order.status !== 'delivered') {
      return NextResponse.json({ error: 'Order is not completed.' }, { status: 400 })
    }

    // Verify product belongs to this order
    const orderItem = order.items.find(
      item => item.productId?.toString() === productId && item._id?.toString() === orderItemId
    )

    if (!orderItem) {
      return NextResponse.json({ error: 'Product not found in this order.' }, { status: 404 })
    }

    // Check for duplicate
    const existing = await Review.findOne({ orderId: order._id, orderItemId })
    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this product.' }, { status: 409 })
    }

    const review = new Review({
      productId,
      orderId: order._id,
      orderItemId,
      rating: numRating,
      comment: comment?.trim() || '',
      customerName: customerName.trim(),
      customerPhone: order.whatsapp_phone || order.customerPhone,
      isVerifiedPurchase: true,
      source: 'whatsapp_link',
      review_token: token,
      status: 'pending'
    })

    await review.save()

    // Mark item as reviewed on the order
    const itemIndex = order.items.findIndex(i => i._id?.toString() === orderItemId)
    if (itemIndex !== -1) {
      order.items[itemIndex].reviewed = true
      await order.save()
    }

    return NextResponse.json({ success: true, message: 'Thank you for your review!' }, { status: 201 })
  } catch (error: any) {
    console.error('Error submitting review:', error)
    if (error.code === 11000) {
      return NextResponse.json({ error: 'You have already reviewed this product.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to submit review.' }, { status: 500 })
  }
}
