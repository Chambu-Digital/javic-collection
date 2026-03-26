import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Review from '@/models/Review'
import mongoose from 'mongoose'

// GET /api/reviews/stats - Get review statistics
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const productObjectId = new mongoose.Types.ObjectId(productId)
    const matchQuery = { productId: productObjectId, status: { $in: ['approved', 'auto_approved'] } }

    const distribution = await Review.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ])

    const distributionObj: { [key: number]: number } = {}
    distribution.forEach(item => { distributionObj[item._id] = item.count })

    const totalReviews = await Review.countDocuments(matchQuery)

    const avgResult = await Review.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } }
    ])

    return NextResponse.json({
      distribution: distributionObj,
      totalReviews,
      averageRating: avgResult.length > 0 ? Math.round(avgResult[0].averageRating * 10) / 10 : 0
    })
  } catch (error: any) {
    console.error('Error fetching review stats:', error)
    return NextResponse.json({ error: 'Failed to fetch review stats' }, { status: 500 })
  }
}
