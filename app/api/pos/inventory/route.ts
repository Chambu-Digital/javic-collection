import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BranchStock from '@/models/BranchStock'
import Product from '@/models/Product'
import Vendor from '@/models/Vendor'
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
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const vendor = searchParams.get('vendor') || ''
    const stockStatus = searchParams.get('stockStatus') || '' // in_stock, low_stock, out_of_stock
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!branchId) {
      return NextResponse.json(
        { error: 'Branch ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Build match conditions
    const matchConditions: any = {
      branchId: new mongoose.Types.ObjectId(branchId)
    }

    // Apply stock status filter
    if (stockStatus === 'out_of_stock') {
      matchConditions.quantity = 0
    } else if (stockStatus === 'low_stock') {
      matchConditions.quantity = { $gte: 1, $lte: 10 }
    } else if (stockStatus === 'in_stock') {
      matchConditions.quantity = { $gt: 10 }
    }

    // Vendor filter
    if (vendor) {
      matchConditions.vendorId = new mongoose.Types.ObjectId(vendor)
    }

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: matchConditions },
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
      { $unwind: '$vendor' }
    ]

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'product.name': { $regex: search, $options: 'i' } },
            { 'product.sku': { $regex: search, $options: 'i' } },
            { stockIdentifier: { $regex: search, $options: 'i' } }
          ]
        }
      })
    }

    // Category filter
    if (category) {
      pipeline.push({
        $match: {
          'product.categoryId': new mongoose.Types.ObjectId(category)
        }
      })
    }

    // Group by product to combine variants
    pipeline.push(
      {
        $lookup: {
          from: 'categories',
          localField: 'product.categoryId',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      {
        $group: {
          _id: '$productId',
          product: { $first: '$product' },
          categoryData: { $first: '$categoryData' },
          variants: {
            $push: {
              stockId: '$_id',
              imageIndex: '$imageIndex',
              selectedSize: '$selectedSize',
              quantity: '$quantity',
              stockIdentifier: '$stockIdentifier',
              vendor: '$vendor'
            }
          },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      {
        $sort: { 'product.name': 1 }
      }
    )

    // Get total count for pagination
    const countPipeline = [...pipeline, { $count: 'total' }]
    const countResult = await BranchStock.aggregate(countPipeline)
    const total = countResult.length > 0 ? countResult[0].total : 0

    // Apply pagination
    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: limit }
    )

    const items = await BranchStock.aggregate(pipeline)

    // Format response
    const formattedItems = items.map((item) => {
      const product = item.product

      // Determine overall stock status using the product's own low-stock threshold
      const productThreshold = product.lowStockThreshold ?? 10
      let stockStatus = 'out_of_stock'
      if (item.totalQuantity > productThreshold) {
        stockStatus = 'in_stock'
      } else if (item.totalQuantity >= 1) {
        stockStatus = 'low_stock'
      }

      return {
        productId: item._id,
        name: product.name,
        sku: product.sku || 'N/A',
        image: product.images && product.images[0] ? product.images[0].url : null,
        price: product.price,
        buyingPrice: product.buyingPrice || 0,
        wholesalePrice: product.wholesalePrice || null,
        wholesaleThreshold: product.wholesaleThreshold || null,
        category: product.category || 'Uncategorized',
        categoryId: product.categoryId,
        barcode: product.barcode || '',
        lowStockThreshold: product.lowStockThreshold ?? 10,
        isActive: product.isActive !== false,
        totalQuantity: item.totalQuantity,
        stockStatus,
        variants: item.variants.map((v: any) => {
          // Pull the image object for this variant's index into product.images[]
          const img = product.images && product.images[v.imageIndex]
            ? product.images[v.imageIndex]
            : null

          return {
            stockId: v.stockId,
            variantIndex: v.imageIndex,        // imageIndex IS the variant identifier
            size: v.selectedSize || 'One Size',
            quantity: v.quantity,
            stockIdentifier: v.stockIdentifier,
            // Image thumbnail for the variant picker
            variantImageUrl: img?.url || (product.images?.[0]?.url ?? null),
            // Per-variant price overrides (fall back to product-level if not set)
            variantPrice: img?.price ?? null,
            variantWholesalePrice: img?.wholesalePrice ?? null,
            // Per-variant SKU
            variantSku: img?.sku || null,
            vendor: {
              id: v.vendor._id,
              name: v.vendor.name,
              code: v.vendor.vendorCode
            }
          }
        })
      }
    })

    return NextResponse.json({
      items: formattedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}
