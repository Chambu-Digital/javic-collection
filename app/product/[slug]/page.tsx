import { notFound } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import ProductPageClient from './product-page-client'

// Fetch review stats server-side
async function getReviewStats(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/reviews/stats?slug=${slug}`, {
      cache: 'no-store'
    })
    if (res.ok) {
      const data = await res.json()
      return {
        averageRating: data.averageRating || 0,
        totalReviews: data.totalReviews || 0
      }
    }
  } catch (error) {
    console.error('Error fetching review stats:', error)
  }
  return { averageRating: 0, totalReviews: 0 }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // Connect to database
  await connectDB()
  
  // Fetch product from database
  const productDoc = await Product.findOne({ slug: slug.toLowerCase() })
    .populate('branchId')
    .lean()
  
  if (!productDoc) {
    notFound()
  }

  // Fetch review stats
  const reviewStats = await getReviewStats(slug)
  
  // Convert Mongoose document to plain object and serialize
  const product = JSON.parse(JSON.stringify(productDoc))
  
  return (
    <ProductPageClient 
      product={product}
      initialRating={reviewStats.averageRating}
      initialReviewCount={reviewStats.totalReviews}
    />
  )
}
