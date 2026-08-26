import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth'
import { getCompleteProductStock, getProductBranchStocks } from '@/lib/branch-inventory'

// GET /api/admin/products/branch-stock?productId=xxx&branchId=xxx
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')
    const branchId = searchParams.get('branchId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    if (branchId && branchId !== 'all') {
      // Get stock for specific branch (all image variants)
      const allBranchStocks = await getProductBranchStocks(productId)
      const specificBranchStocks = allBranchStocks.filter(bs => bs.branchId === branchId)
      
      // Calculate total stock for this branch (sum across all image variants and vendors)
      const totalStock = specificBranchStocks.reduce((sum, bs) => sum + bs.quantity, 0)
      
      return NextResponse.json({
        productId,
        branchId,
        totalStock,
        branchStocks: specificBranchStocks
      })
    }

    // Get complete stock information with all branches
    const stockInfo = await getCompleteProductStock(productId)

    return NextResponse.json(stockInfo)
  } catch (error: any) {
    console.error('Error fetching branch stock:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch branch stock' },
      { status: 500 }
    )
  }
}
