import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Review from '@/models/Review'
import { requireAuth } from '@/lib/auth'

// GET /api/reviews/[id] - Get a specific review
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const review = await Review.findById(params.id)
      .populate('productId', 'name slug images')
      .populate('userId', 'firstName lastName')
      .populate('moderatedBy', 'firstName lastName')

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json({ review })
  } catch (error: any) {
    console.error('Error fetching review:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    )
  }
}

// PUT /api/reviews/[id] - Update a review (for user edits or admin moderation)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const authUser = await requireAuth(request)

    const body = await request.json()
    const review = await Review.findById(params.id)

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Check if user owns the review or is admin
    const isOwner = review.userId.toString() === authUser.id
    const isAdmin = authUser.role === 'admin' || authUser.role === 'super_admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // If admin is moderating
    if (isAdmin && (body.status || body.moderationNotes)) {
      review.status = body.status || review.status
      review.moderationNotes = body.moderationNotes || review.moderationNotes
      review.moderatedBy = authUser.id
      review.moderatedAt = new Date()
    }

    // If user is editing their own review (only if pending)
    if (isOwner && review.status === 'pending') {
      if (body.rating) review.rating = body.rating
      if (body.title) review.title = body.title.trim()
      if (body.comment) review.comment = body.comment.trim()
      if (body.images) review.images = body.images
    }

    await review.save()

    // If review was approved, update product rating
    if (review.status === 'approved') {
      await updateProductRating(review.productId)
    }

    return NextResponse.json({
      message: 'Review updated successfully',
      review
    })
  } catch (error: any) {
    console.error('Error updating review:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/[id] - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const authUser = await requireAuth(request)

    const review = await Review.findById(params.id)

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Check if user owns the review or is admin
    const isOwner = review.userId.toString() === authUser.id
    const isAdmin = authUser.role === 'admin' || authUser.role === 'super_admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const productId = review.productId
    await Review.findByIdAndDelete(params.id)

    // Update product rating after deletion
    await updateProductRating(productId)

    return NextResponse.json({ message: 'Review deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting review:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}

// Helper function to update product rating
async function updateProductRating(productId: string) {
  try {
    const Product = (await import('@/models/Product')).default
    
    const reviews = await Review.find({ 
      productId, 
      status: 'approved' 
    })

    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        reviews: 0
      })
      return
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / reviews.length

    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      reviews: reviews.length
    })
  } catch (error) {
    console.error('Error updating product rating:', error)
  }
}