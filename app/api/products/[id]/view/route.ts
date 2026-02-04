import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'

// Product View Schema for tracking
const ProductViewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Allow anonymous views
  },
  sessionId: {
    type: String,
    required: true // For tracking anonymous users
  },
  userAgent: String,
  ipAddress: String,
  referrer: String,
  viewedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Index for better performance
ProductViewSchema.index({ productId: 1, viewedAt: -1 })
ProductViewSchema.index({ sessionId: 1, productId: 1 })

// Prevent duplicate views from same session within 1 hour
ProductViewSchema.index(
  { sessionId: 1, productId: 1, viewedAt: 1 },
  { 
    unique: true,
    partialFilterExpression: {
      viewedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    }
  }
)

let ProductView: mongoose.Model<any>
try {
  ProductView = mongoose.model('ProductView')
} catch {
  ProductView = mongoose.model('ProductView', ProductViewSchema)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const { id } = params
    const body = await request.json()
    const { sessionId, userId } = body
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    // Get request metadata
    const userAgent = request.headers.get('user-agent') || ''
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    const referrer = request.headers.get('referer') || ''
    
    // Try to create a new view record
    // This will fail silently if duplicate within 1 hour due to unique index
    try {
      await ProductView.create({
        productId: id,
        userId: userId || null,
        sessionId,
        userAgent,
        ipAddress,
        referrer
      })
    } catch (error: any) {
      // Ignore duplicate key errors (user already viewed this product recently)
      if (error.code !== 11000) {
        throw error
      }
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error('Error tracking product view:', error)
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve view statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const { id } = params
    const { searchParams } = new URL(request.url)
    const period = parseInt(searchParams.get('period') || '30') // days
    
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - period)
    
    const [
      totalViews,
      uniqueViews,
      dailyViews,
      topReferrers
    ] = await Promise.all([
      // Total views in period
      ProductView.countDocuments({
        productId: id,
        viewedAt: { $gte: fromDate }
      }),
      
      // Unique views (by session) in period
      ProductView.distinct('sessionId', {
        productId: id,
        viewedAt: { $gte: fromDate }
      }).then(sessions => sessions.length),
      
      // Daily view breakdown
      ProductView.aggregate([
        {
          $match: {
            productId: new mongoose.Types.ObjectId(id),
            viewedAt: { $gte: fromDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$viewedAt' },
              month: { $month: '$viewedAt' },
              day: { $dayOfMonth: '$viewedAt' }
            },
            views: { $sum: 1 },
            uniqueViews: { $addToSet: '$sessionId' }
          }
        },
        {
          $project: {
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day'
              }
            },
            views: 1,
            uniqueViews: { $size: '$uniqueViews' }
          }
        },
        { $sort: { date: 1 } }
      ]),
      
      // Top referrers
      ProductView.aggregate([
        {
          $match: {
            productId: new mongoose.Types.ObjectId(id),
            viewedAt: { $gte: fromDate },
            referrer: { $ne: '' }
          }
        },
        {
          $group: {
            _id: '$referrer',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ])
    
    return NextResponse.json({
      totalViews,
      uniqueViews,
      dailyViews,
      topReferrers
    })
    
  } catch (error: any) {
    console.error('Error fetching view stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch view statistics' },
      { status: 500 }
    )
  }
}