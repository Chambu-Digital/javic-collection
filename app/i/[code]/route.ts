import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'

/**
 * Short Image URL Redirect
 * Pattern: /i/{productId}-{imageIndex}
 * Example: /i/507f1f77bcf86cd799439011-2
 * Redirects to the image display page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    
    // Parse the code to validate format: {productId}-{imageIndex}
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

    // Validate product exists (lightweight check)
    await connectDB()
    const product = await Product.findById(productId).select('images').lean()

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Validate image exists at index
    if (!product.images || !product.images[imageIndex]) {
      return NextResponse.json(
        { error: 'Image not found at specified index' },
        { status: 404 }
      )
    }

    // Build the absolute URL for the image display page
    const baseUrl = request.nextUrl.origin
    const displayPageUrl = `${baseUrl}/image/${code}`

    // Redirect to the image display page
    return NextResponse.redirect(displayPageUrl, 302)

  } catch (error) {
    console.error('[Short image redirect] Error:', error)
    return NextResponse.json(
      { error: 'Failed to redirect to image' },
      { status: 500 }
    )
  }
}
