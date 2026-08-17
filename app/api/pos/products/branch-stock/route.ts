import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { requirePosAuth, handlePosAuthError } from '@/lib/pos/auth'
import { getProductBranchStocks } from '@/lib/branch-inventory'

// Force dynamic — never cache this route so stock counts are always live
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/pos/products/branch-stock?productId=xxx&imageIndex=xxx&selectedSize=xxx
export async function GET(request: NextRequest) {
  try {
    await requirePosAuth(request)
    await connectDB()

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const imageIndex = searchParams.get('imageIndex')
    const selectedSize = searchParams.get('selectedSize')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const imageIndexNum = imageIndex ? parseInt(imageIndex) : undefined
    
    const branchStocks = await getProductBranchStocks(
      productId,
      imageIndexNum,
      selectedSize || undefined
    )

    // Filter to only active branches and branches with stock
    const availableBranchStocks = branchStocks.filter(
      bs => bs.isActive && bs.quantity > 0
    )

    return NextResponse.json({
      branchStocks: availableBranchStocks,
      totalStock: availableBranchStocks.reduce((sum, bs) => sum + bs.quantity, 0)
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/products/branch-stock]', error)
    return NextResponse.json({ error: 'Failed to fetch branch stock' }, { status: 500 })
  }
}
