/**
 * Migration Script: Assign Existing Product Stock to Main Branch
 * 
 * This script migrates all existing product inventory to branch-based inventory.
 * All existing stock is assigned to the Main Branch.
 * 
 * Run with: npx tsx scripts/migrate-stock-to-branches.ts
 */

import mongoose from 'mongoose'
import connectDB from '../lib/mongodb'
import Product from '../models/Product'
import Branch from '../models/Branch'
import BranchStock from '../models/BranchStock'

interface MigrationStats {
  productsProcessed: number
  stockRecordsCreated: number
  totalStockMigrated: number
  errors: Array<{ productId: string; productName: string; error: string }>
}

async function migrateStockToBranches(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    productsProcessed: 0,
    stockRecordsCreated: 0,
    totalStockMigrated: 0,
    errors: []
  }

  console.log('🚀 Starting stock migration to branch-based inventory...\n')

  // Connect to database
  await connectDB()

  // Find or create Main Branch
  let mainBranch = await Branch.findOne({ isMainBranch: true })
  
  if (!mainBranch) {
    console.log('⚠️  No main branch found. Creating default Main Branch...')
    mainBranch = new Branch({
      name: 'Main Branch',
      branchCode: 'MAIN',
      location: 'Main Location',
      isActive: true,
      isMainBranch: true
    })
    await mainBranch.save()
    console.log(`✅ Created Main Branch: ${mainBranch.name} (${mainBranch.branchCode})\n`)
  } else {
    console.log(`✅ Found Main Branch: ${mainBranch.name} (${mainBranch.branchCode})\n`)
  }

  // Get all products
  const products = await Product.find({})
  console.log(`📦 Found ${products.length} products to migrate\n`)

  // Process each product
  for (const product of products) {
    try {
      stats.productsProcessed++
      
      console.log(`Processing: ${product.name} (${product._id})`)

      if (!product.images || product.images.length === 0) {
        console.log(`  ⚠️  No images found, skipping...`)
        continue
      }

      // Process each image variant
      for (let imageIndex = 0; imageIndex < product.images.length; imageIndex++) {
        const image = product.images[imageIndex]
        
        // Get the SKU for stock identifier generation
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
              const stockIdentifier = BranchStock.generateStockIdentifier(
                productSku,
                mainBranch.branchCode,
                imageIndex,
                size
              )

              // Check if branch stock already exists
              const existing = await BranchStock.findOne({ stockIdentifier })
              
              if (existing) {
                console.log(`  ⏭️  Already migrated: Image ${imageIndex}, Size ${size}`)
                continue
              }

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
              console.log(`  ✅ Created: Image ${imageIndex}, Size ${size}, Qty: ${quantity}`)
            }
          }
        } else if (image.stock !== undefined && image.stock > 0) {
          // Image has stock but no size breakdown
          const stockIdentifier = BranchStock.generateStockIdentifier(
            productSku,
            mainBranch.branchCode,
            imageIndex
          )

          // Check if branch stock already exists
          const existing = await BranchStock.findOne({ stockIdentifier })
          
          if (existing) {
            console.log(`  ⏭️  Already migrated: Image ${imageIndex}`)
            continue
          }

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
          console.log(`  ✅ Created: Image ${imageIndex}, Qty: ${image.stock}`)
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
          const stockIdentifier = BranchStock.generateStockIdentifier(
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
            console.log(`  ✅ Created: Default stock, Qty: ${product.stockQuantity}`)
          }
        }
      }

      console.log('') // Empty line for readability
    } catch (error: any) {
      console.error(`  ❌ Error processing ${product.name}:`, error.message)
      stats.errors.push({
        productId: product._id.toString(),
        productName: product.name,
        error: error.message
      })
    }
  }

  return stats
}

// Main execution
async function main() {
  try {
    const stats = await migrateStockToBranches()

    console.log('\n' + '='.repeat(60))
    console.log('📊 MIGRATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`Products Processed: ${stats.productsProcessed}`)
    console.log(`Stock Records Created: ${stats.stockRecordsCreated}`)
    console.log(`Total Stock Migrated: ${stats.totalStockMigrated} units`)
    console.log(`Errors: ${stats.errors.length}`)

    if (stats.errors.length > 0) {
      console.log('\n⚠️  ERRORS:')
      stats.errors.forEach(err => {
        console.log(`  - ${err.productName} (${err.productId}): ${err.error}`)
      })
    }

    console.log('\n✅ Migration completed successfully!')
    
    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

main()
