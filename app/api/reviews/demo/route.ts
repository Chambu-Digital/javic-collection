import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Review from '@/models/Review'
import Product from '@/models/Product'
import mongoose from 'mongoose'

// POST /api/reviews/demo - Create a demo review without authentication
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { productId, rating, title, comment, customerName, isDemo } = body
    
    const numericRating = Number(rating)
    
    if (!productId || !rating || isNaN(numericRating) || numericRating < 1 || numericRating > 5 || !title?.trim() || !comment?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid rating (must be 1-5)' },
        { status: 400 }
      )
    }

    // Verify product exists
    const product = await Product.findById(productId)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Create a demo user ID for anonymous reviews
    const demoUserId = new mongoose.Types.ObjectId()
    const demoOrderId = new mongoose.Types.ObjectId()
    const demoOrderItemId = new mongoose.Types.ObjectId().toString()

    // Create the demo review
    const review = new Review({
      productId,
      userId: demoUserId,
      orderId: demoOrderId,
      orderItemId: demoOrderItemId,
      rating: numericRating,
      title: title.trim(),
      comment: comment.trim(),
      images: [],
      customerName: customerName || 'Anonymous Customer',
      customerEmail: 'demo@javiccollection.co.ke',
      isVerifiedPurchase: false, // Demo reviews are not verified purchases
      status: 'approved' // Auto-approve demo reviews for immediate visibility
    })

    await review.save()

    // Update product rating and review count
    await updateProductRating(productId)

    return NextResponse.json({
      message: 'Demo review submitted successfully',
      review
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating demo review:', error)
    return NextResponse.json(
      { error: 'Failed to create demo review' },
      { status: 500 }
    )
  }
}

// Helper function to update product rating
async function updateProductRating(productId: string) {
  try {
    const stats = await Review.aggregate([
      {
        $match: {
          productId: productId,
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ])

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal place
        reviews: stats[0].totalReviews
      })
    }
  } catch (error) {
    console.error('Error updating product rating:', error)
  }
}
