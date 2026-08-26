import { notFound } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import Review from '@/models/Review'
import ProductPageClient from './product-page-client'

// Fetch review stats directly from database (server-side)
async function getReviewStats(productId: string) {
  try {
    await connectDB()
    
    const reviews = await Review.find({ 
      productId, 
      status: 'approved' 
    }).select('rating').lean()
    
    if (reviews.length === 0) {
      return { averageRating: 0, totalReviews: 0 }
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / reviews.length
    
    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length
    }
  } catch (error) {
    console.error('[Product Page] Error fetching review stats:', error)
    return { averageRating: 0, totalReviews: 0 }
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    
    // Connect to database
    await connectDB()
    
    // Fetch product from database
    const productDoc = await Product.findOne({ slug: slug.toLowerCase() })
      .lean()
    
    if (!productDoc) {
      notFound()
    }

    // Fetch review stats directly from database
    const reviewStats = await getReviewStats(productDoc._id.toString())
    
    // Convert Mongoose document to plain object and serialize
    const product = JSON.parse(JSON.stringify(productDoc))
    
    return (
      <ProductPageClient 
        product={product}
        initialRating={reviewStats.averageRating}
        initialReviewCount={reviewStats.totalReviews}
      />
    )
  } catch (error) {
    console.error('[Product Page] Server error:', error)
    notFound()
  }
}
