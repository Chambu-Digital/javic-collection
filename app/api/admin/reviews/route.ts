import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Review from '@/models/Review'
import { verifyToken } from '@/lib/auth'

// GET /api/admin/reviews - Get all reviews for admin management
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const productId = searchParams.get('productId')
    const rating = searchParams.get('rating')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const search = searchParams.get('search')

    const query: any = {}
    
    if (status) {
      query.status = status
    }
    
    if (productId) {
      query.productId = productId
    }
    
    if (rating) {
      query.rating = parseInt(rating)
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (page - 1) * limit
    const sortOptions: any = {}
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1

    const reviews = await Review.find(query)
      .populate('productId', 'name slug images')
      .populate('userId', 'firstName lastName email')
      .populate('moderatedBy', 'firstName lastName')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)

    const total = await Review.countDocuments(query)

    // Get review stats
    const stats = await Review.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const reviewStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    }

    stats.forEach(stat => {
      reviewStats[stat._id as keyof typeof reviewStats] = stat.count
      reviewStats.total += stat.count
    })

    return NextResponse.json({
      reviews,
      stats: reviewStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching admin reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/reviews - Bulk update reviews
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { reviewIds, action, moderationNotes } = body

    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return NextResponse.json(
        { error: 'Review IDs are required' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    const status = action === 'approve' ? 'approved' : 'rejected'
    
    const updateData: any = {
      status,
      moderatedBy: decoded.userId,
      moderatedAt: new Date()
    }

    if (moderationNotes) {
      updateData.moderationNotes = moderationNotes
    }

    await Review.updateMany(
      { _id: { $in: reviewIds } },
      updateData
    )

    // If approving reviews, update product ratings
    if (action === 'approve') {
      const reviews = await Review.find({ _id: { $in: reviewIds } })
      const productIds = [...new Set(reviews.map(r => r.productId.toString()))]
      
      for (const productId of productIds) {
        await updateProductRating(productId)
      }
    }

    return NextResponse.json({
      message: `Successfully ${action}d ${reviewIds.length} review(s)`
    })
  } catch (error: any) {
    console.error('Error bulk updating reviews:', error)
    return NextResponse.json(
      { error: 'Failed to update reviews' },
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
