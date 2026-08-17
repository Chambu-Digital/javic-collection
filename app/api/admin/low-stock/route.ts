import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth'
import { getLowStockProductsByBranch } from '@/lib/branch-inventory'

// GET /api/admin/low-stock?branchId=xxx&threshold=10
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
    const branchId = searchParams.get('branchId')
    const threshold = parseInt(searchParams.get('threshold') || '10')

    // Get low-stock products by branch
    const lowStockProducts = await getLowStockProductsByBranch(
      branchId && branchId !== 'all' ? branchId : undefined,
      threshold
    )

    // Group by product for summary
    const productSummary = lowStockProducts.reduce((acc, item) => {
      const productId = item.productId
      if (!acc[productId]) {
        acc[productId] = {
          productId,
          productName: item.productName,
          branches: []
        }
      }
      acc[productId].branches.push({
        branchCode: item.branchCode,
        branchName: item.branchName,
        quantity: item.quantity
      })
      return acc
    }, {} as Record<string, any>)

    const summary = Object.values(productSummary)

    return NextResponse.json({
      lowStockProducts,
      summary,
      threshold,
      totalItems: lowStockProducts.length,
      totalProducts: summary.length
    })
  } catch (error: any) {
    console.error('Error fetching low stock:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch low stock data' },
      { status: 500 }
    )
  }
}
