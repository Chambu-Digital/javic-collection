import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import { requireAuth } from '@/lib/auth'

/**
 * Replace Image API
 * 
 * Updates ONLY the image URL for a specific variant without changing:
 * - Array position (imageIndex)
 * - Price, SKU, groupId, or any other properties
 * - BranchStock references (they remain valid)
 * - Cart items (they still point to correct variant)
 * 
 * This is a surgical operation that solves the "image replacement breaks everything" problem.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imageIndex: string }> }
) {
  try {
    // 1. Authentication check
    const user = await requireAuth(req)
    
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    // 2. Parse and validate parameters
    const { id, imageIndex } = await params
    const imageIdx = parseInt(imageIndex)

    if (isNaN(imageIdx) || imageIdx < 0) {
      return NextResponse.json(
        { error: 'Invalid image index. Must be a non-negative integer.' },
        { status: 400 }
      )
    }

    // 3. Parse request body
    const { newImageUrl } = await req.json()

    if (!newImageUrl || typeof newImageUrl !== 'string') {
      return NextResponse.json(
        { error: 'New image URL is required and must be a string.' },
        { status: 400 }
      )
    }

    // Basic URL validation
    try {
      new URL(newImageUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid image URL format.' },
        { status: 400 }
      )
    }

    // 4. Connect to database
    await connectDB()

    // 5. Find product
    const product = await Product.findById(id)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found.' },
        { status: 404 }
      )
    }

    // 6. Validate image index exists
    if (imageIdx >= product.images.length) {
      return NextResponse.json(
        { 
          error: `Image index ${imageIdx} out of bounds. Product has ${product.images.length} images.` 
        },
        { status: 400 }
      )
    }

    // 7. Store old URL for logging and response
    const oldUrl = product.images[imageIdx].url

    // Check if URL is actually different
    if (oldUrl === newImageUrl) {
      return NextResponse.json(
        {
          success: true,
          message: 'Image URL unchanged (already matches).',
          imageIndex: imageIdx,
          url: newImageUrl
        }
      )
    }

    // 8. UPDATE ONLY THE URL - This is the key operation!
    // All other properties (price, sku, groupId, etc.) remain unchanged
    // Array position remains unchanged
    // BranchStock records still reference imageIndex correctly
    product.images[imageIdx].url = newImageUrl

    // 9. Save product
    await product.save()

    // 10. Log the operation for audit trail
    console.log(`[Image Replace] Success:`, {
      productId: id,
      productName: product.name,
      imageIndex: imageIdx,
      oldUrl: oldUrl.substring(0, 50) + '...',
      newUrl: newImageUrl.substring(0, 50) + '...',
      adminUser: user.email,
      timestamp: new Date().toISOString()
    })

    // 11. Return success response
    return NextResponse.json({
      success: true,
      message: 'Image replaced successfully.',
      imageIndex: imageIdx,
      oldUrl,
      newUrl: newImageUrl,
      // Include product name for confirmation
      productName: product.name
    })

  } catch (error: any) {
    console.error('[Replace Image] Error:', error)
    
    // Handle specific error types
    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid product ID format.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to replace image. Please try again.' },
      { status: 500 }
    )
  }
}
