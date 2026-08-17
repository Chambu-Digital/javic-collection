import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'

/**
 * Image Data API
 * Pattern: /api/image-data/{productId}-{imageIndex}
 * Returns product and image metadata for display page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    
    // Parse the code: {productId}-{imageIndex}
    const parts = code.split('-')
    if (parts.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid image code format. Expected: productId-imageIndex' },
        { status: 400 }
      )
    }

    const [productId, imageIndexStr] = parts
    const imageIndex = parseInt(imageIndexStr)

    if (isNaN(imageIndex) || imageIndex < 0) {
      return NextResponse.json(
        { error: 'Invalid image index' },
        { status: 400 }
      )
    }

    // Connect to database and fetch product
    await connectDB()
    const product = await Product.findById(productId).lean()

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get the image at the specified index
    if (!product.images || !product.images[imageIndex]) {
      return NextResponse.json(
        { error: 'Image not found at specified index' },
        { status: 404 }
      )
    }

    const imageUrl = product.images[imageIndex].url

    // Return product and image data
    return NextResponse.json({
      productId: product._id.toString(),
      productName: product.name,
      imageUrl,
      imageIndex,
      totalImages: product.images.length,
    })

  } catch (error) {
    console.error('[Image data API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch image data' },
      { status: 500 }
    )
  }
}
