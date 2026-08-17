import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import Branch from '@/models/Branch'
import BranchStock from '@/models/BranchStock'
import { requireAuth } from '@/lib/auth'

interface MigrationStats {
  productsProcessed: number
  stockRecordsCreated: number
  totalStockMigrated: number
  errors: Array<{ productId: string; productName: string; error: string }>
}

// POST /api/admin/migrate-stock - Migrate existing stock to Main Branch
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Only super_admin can run migration
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can run stock migration' },
        { status: 403 }
      )
    }

    await connectDB()

    const stats: MigrationStats = {
      productsProcessed: 0,
      stockRecordsCreated: 0,
      totalStockMigrated: 0,
      errors: []
    }

    // Find or create Main Branch
    let mainBranch = await Branch.findOne({ isMainBranch: true })
    
    if (!mainBranch) {
      mainBranch = new Branch({
        name: 'Main Branch',
        branchCode: 'MAIN',
        location: 'Main Location',
        isActive: true,
        isMainBranch: true
      })
      await mainBranch.save()
    }

    // Get all products
    const products = await Product.find({})

    // Process each product
    for (const product of products) {
      try {
        stats.productsProcessed++

        if (!product.images || product.images.length === 0) {
          continue
        }

        // Process each image variant
        for (let imageIndex = 0; imageIndex < product.images.length; imageIndex++) {
          const image = product.images[imageIndex]
          const productSku = image.sku || product.sku || `PROD${product._id.toString().slice(-6)}`

          // Check if this image has size-specific stock
          if (image.sizeStock && typeof image.sizeStock === 'object') {
            const sizeStockMap = image.sizeStock as Map<string, number> | Record<string, number>
            const sizeEntries = sizeStockMap instanceof Map 
              ? Array.from(sizeStockMap.entries())
              : Object.entries(sizeStockMap)

            // Create branch stock for each size
            for (const [size, quantity] of sizeEntries) {
              if (quantity > 0) {
                const stockIdentifier = (BranchStock as any).generateStockIdentifier(
                  productSku,
                  mainBranch.branchCode,
                  imageIndex,
                  size
                )

                // Check if branch stock already exists
                const existing = await BranchStock.findOne({ stockIdentifier })
                
                if (!existing) {
                  const branchStock = new BranchStock({
                    productId: product._id,
                    branchId: mainBranch._id,
                    imageIndex,
                    selectedSize: size,
                    stockIdentifier,
                    quantity
                  })

                  await branchStock.save()
                  stats.stockRecordsCreated++
                  stats.totalStockMigrated += quantity
                }
              }
            }
          } else if (image.stock !== undefined && image.stock > 0) {
            // Image has stock but no size breakdown
            const stockIdentifier = (BranchStock as any).generateStockIdentifier(
              productSku,
              mainBranch.branchCode,
              imageIndex
            )

            // Check if branch stock already exists
            const existing = await BranchStock.findOne({ stockIdentifier })
            
            if (!existing) {
              const branchStock = new BranchStock({
                productId: product._id,
                branchId: mainBranch._id,
                imageIndex,
                stockIdentifier,
                quantity: image.stock
              })

              await branchStock.save()
              stats.stockRecordsCreated++
              stats.totalStockMigrated += image.stock
            }
          }
        }

        // If product has overall stockQuantity but no image-level stock, create a default record
        if (product.stockQuantity > 0) {
          const hasImageStock = product.images.some(img => 
            (img.stock && img.stock > 0) || 
            (img.sizeStock && Object.keys(img.sizeStock).length > 0)
          )

          if (!hasImageStock) {
            const productSku = product.sku || `PROD${product._id.toString().slice(-6)}`
            const stockIdentifier = (BranchStock as any).generateStockIdentifier(
              productSku,
              mainBranch.branchCode,
              0
            )

            // Check if branch stock already exists
            const existing = await BranchStock.findOne({ stockIdentifier })
            
            if (!existing) {
              const branchStock = new BranchStock({
                productId: product._id,
                branchId: mainBranch._id,
                imageIndex: 0,
                stockIdentifier,
                quantity: product.stockQuantity
              })

              await branchStock.save()
              stats.stockRecordsCreated++
              stats.totalStockMigrated += product.stockQuantity
            }
          }
        }
      } catch (error: any) {
        stats.errors.push({
          productId: product._id.toString(),
          productName: product.name,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Stock migration completed',
      stats
    })
  } catch (error: any) {
    console.error('Stock migration error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to migrate stock' },
      { status: 500 }
    )
  }
}

// GET /api/admin/migrate-stock - Check migration status
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

    // Check if Main Branch exists
    const mainBranch = await Branch.findOne({ isMainBranch: true })
    
    // Count total products and branch stock records
    const totalProducts = await Product.countDocuments({})
    const totalBranchStocks = await BranchStock.countDocuments({})
    const totalStockQuantity = await BranchStock.aggregate([
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ])

    return NextResponse.json({
      mainBranchExists: !!mainBranch,
      mainBranch: mainBranch ? {
        name: mainBranch.name,
        branchCode: mainBranch.branchCode
      } : null,
      totalProducts,
      totalBranchStocks,
      totalStockQuantity: totalStockQuantity.length > 0 ? totalStockQuantity[0].total : 0,
      migrationNeeded: totalProducts > 0 && totalBranchStocks === 0
    })
  } catch (error: any) {
    console.error('Migration status check error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check migration status' },
      { status: 500 }
    )
  }
}
