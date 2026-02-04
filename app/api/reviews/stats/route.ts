import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Review from '@/models/Review'

// GET /api/reviews/stats - Get review statistics
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get rating distribution
    const distribution = await Review.aggregate([
      {
        $match: {
          productId: productId,
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ])

    // Convert to object format
    const distributionObj: { [key: number]: number } = {}
    distribution.forEach(item => {
      distributionObj[item._id] = item.count
    })

    // Get total stats
    const totalReviews = await Review.countDocuments({
      productId,
      status: 'approved'
    })

    const avgRating = await Review.aggregate([
      {
        $match: {
          productId: productId,
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' }
        }
      }
    ])

    return NextResponse.json({
      distribution: distributionObj,
      totalReviews,
      averageRating: avgRating.length > 0 ? avgRating[0].averageRating : 0
    })
  } catch (error: any) {
    console.error('Error fetching review stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review stats' },
      { status: 500 }
    )
  }
}
