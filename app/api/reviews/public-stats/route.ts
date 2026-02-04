import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Review from '@/models/Review'
import User from '@/models/User'

export async function GET() {
  try {
    await connectDB()
    
    // Get total approved reviews count
    const totalReviews = await Review.countDocuments({ status: 'approved' })
    
    // Get average rating
    const ratingStats = await Review.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ])
    
    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ])
    
    // Get recent reviews (last 10 approved reviews)
    const recentReviews = await Review.find({ status: 'approved' })
      .populate('productId', 'name images')
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('rating title comment createdAt productId userId')
    
    const stats = {
      totalReviews,
      averageRating: ratingStats.length > 0 ? ratingStats[0].averageRating : 0,
      ratingDistribution: ratingDistribution.reduce((acc, item) => {
        acc[item._id] = item.count
        return acc
      }, {}),
      recentReviews
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching public review stats:', error)
    return NextResponse.json({ error: 'Failed to fetch review statistics' }, { status: 500 })
  }
}
