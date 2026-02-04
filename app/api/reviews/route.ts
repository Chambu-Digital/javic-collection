import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Review from '@/models/Review'

import Order from '@/models/Order'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'

// GET /api/reviews - Get reviews with filters
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') || 'approved'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const query: any = {}
    
    if (productId) {
      query.productId = productId
    }
    
    if (userId) {
      query.userId = userId
    }
    
    if (status) {
      query.status = status
    }

    const skip = (page - 1) * limit
    const sortOptions: any = {}
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1

    const reviews = await Review.find(query)
      .populate('productId', 'name slug images')
      .populate('userId', 'firstName lastName')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)

    const total = await Review.countDocuments(query)

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const authUser = await requireAuth(request)
    
    const user = await User.findById(authUser.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { productId, orderId, orderItemId, rating, title, comment, images } = body
    
    const numericRating = Number(rating)
    
    if (!productId || !orderId || !orderItemId || !rating || isNaN(numericRating) || numericRating < 1 || numericRating > 5 || !title?.trim() || !comment?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid rating (must be 1-5)' },
        { status: 400 }
      )
    }

    // Verify the order belongs to the user and contains the product
    const order = await Order.findOne({
      _id: orderId,
      userId: authUser.id,
      status: 'delivered' // Only allow reviews for delivered orders
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or not eligible for review' },
        { status: 404 }
      )
    }

    // Check if the product is in the order
    const orderItem = order.items.find(item => 
      item.productId.toString() === productId && 
      item._id?.toString() === orderItemId
    )

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Product not found in order' },
        { status: 404 }
      )
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      productId,
      userId: authUser.id,
      orderId,
      orderItemId
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already exists for this product' },
        { status: 409 }
      )
    }

    // Create the review
    const review = new Review({
      productId,
      userId: authUser.id,
      orderId,
      orderItemId,
      rating: numericRating,
      title: title.trim(),
      comment: comment.trim(),
      images: images || [],
      customerName: `${user.firstName} ${user.lastName}`,
      customerEmail: user.email,
      isVerifiedPurchase: true,
      status: 'pending' // Reviews need admin approval
    })

    await review.save()

    return NextResponse.json({
      message: 'Review submitted successfully and is pending approval',
      review
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating review:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
