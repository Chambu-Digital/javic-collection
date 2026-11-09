import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BranchStock from '@/models/BranchStock'
import { requireAdmin } from '@/lib/auth'
import mongoose from 'mongoose'

// GET /api/admin/stock/branch/[branchId] - Get all stock for a specific branch
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    await connectDB()

    const { id: branchId } = await params

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return NextResponse.json(
        { error: 'Invalid branch ID' },
        { status: 400 }
      )
    }

    // Get all stock for this branch with populated product and vendor info
    const stock = await BranchStock.find({ branchId })
      .populate('productId', 'name images sku')
      .populate('vendorId', 'name vendorCode isHouseStock')
      .sort({ quantity: -1, 'productId.name': 1 })
      .lean()

    // Calculate summary stats
    const totalQuantity = stock.reduce((sum, item: any) => sum + item.quantity, 0)
    const uniqueProducts = new Set(stock.map((item: any) => item.productId._id.toString())).size
    const uniqueVendors = new Set(stock.map((item: any) => item.vendorId._id.toString())).size
    const lowStockCount = stock.filter((item: any) => item.quantity > 0 && item.quantity <= 10).length

    return NextResponse.json({
      success: true,
      stock,
      summary: {
        totalQuantity,
        uniqueProducts,
        uniqueVendors,
        lowStockCount,
        totalRecords: stock.length
      }
    })
  } catch (error: any) {
    console.error('Error fetching branch stock:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch stock' },
      { status: 500 }
    )
  }
}
