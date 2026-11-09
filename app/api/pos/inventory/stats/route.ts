import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BranchStock from '@/models/BranchStock'
import Product from '@/models/Product'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Check POS access
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json(
        { error: 'POS access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')

    if (!branchId) {
      return NextResponse.json(
        { error: 'Branch ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Get all stock records for the branch with product details
    const stockRecords = await BranchStock.aggregate([
      {
        $match: {
          branchId: new mongoose.Types.ObjectId(branchId),
          quantity: { $gt: 0 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $group: {
          _id: null,
          totalItems: { $addToSet: '$productId' },
          totalStock: { $sum: '$quantity' },
          stockValueAtCost: {
            $sum: {
              $multiply: ['$quantity', { $ifNull: ['$product.buyingPrice', 0] }]
            }
          },
          stockValueAtRetail: {
            $sum: {
              $multiply: ['$quantity', '$product.price']
            }
          }
        }
      }
    ])

    const stats = stockRecords.length > 0 ? {
      totalItems: stockRecords[0].totalItems.length,
      totalStock: stockRecords[0].totalStock,
      stockValue: Math.round(stockRecords[0].stockValueAtCost),
      estimatedProfit: Math.round(stockRecords[0].stockValueAtRetail - stockRecords[0].stockValueAtCost)
    } : {
      totalItems: 0,
      totalStock: 0,
      stockValue: 0,
      estimatedProfit: 0
    }

    return NextResponse.json(stats)

  } catch (error: any) {
    console.error('Error fetching inventory stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory stats' },
      { status: 500 }
    )
  }
}
