import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BranchStock from '@/models/BranchStock'
import Branch from '@/models/Branch'
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

    // Get branch details
    const branch = await Branch.findById(branchId)
    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    // Get all stock records for the branch
    const stockRecords = await BranchStock.aggregate([
      {
        $match: {
          branchId: new mongoose.Types.ObjectId(branchId)
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
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'vendors',
          localField: 'vendorId',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      { $unwind: '$vendor' },
      {
        $sort: { 'product.name': 1 }
      }
    ])

    // Generate CSV content
    const headers = [
      'Product Name',
      'SKU',
      'Stock Identifier',
      'Variant Index',
      'Size',
      'Quantity',
      'Vendor Name',
      'Vendor Code',
      'Branch',
      'Retail Price',
      'Stock Value'
    ]

    const rows = stockRecords.map((record) => {
      const stockValue = record.quantity * record.product.price
      return [
        record.product.name,
        record.product.sku || 'N/A',
        record.stockIdentifier,
        record.imageIndex,
        record.selectedSize || 'One Size',
        record.quantity,
        record.vendor.name,
        record.vendor.vendorCode,
        branch.name,
        `KSh ${record.product.price.toLocaleString()}`,
        `KSh ${stockValue.toLocaleString()}`
      ]
    })

    // Build CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // Escape cells containing commas or quotes
          const cellStr = String(cell)
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        }).join(',')
      )
    ].join('\n')

    // Return CSV file
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `inventory-${branch.branchCode}-${timestamp}.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error: any) {
    console.error('Error exporting inventory:', error)
    return NextResponse.json(
      { error: 'Failed to export inventory' },
      { status: 500 }
    )
  }
}
