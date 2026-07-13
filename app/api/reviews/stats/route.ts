import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Review from '@/models/Review'
import Product from '@/models/Product'
import mongoose from 'mongoose'

// GET /api/reviews/stats - Get review statistics (accepts ?productId= or ?slug=)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    let productId = searchParams.get('productId')
    const slug = searchParams.get('slug')

    // Resolve slug → productId if needed
    if (!productId && slug) {
      const product = await Product.findOne({ slug }).select('_id')
      if (!product) {
        return NextResponse.json({ distribution: {}, totalReviews: 0, averageRating: 0 })
      }
      productId = product._id.toString()
    }

    if (!productId) {
      return NextResponse.json({ error: 'productId or slug is required' }, { status: 400 })
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
