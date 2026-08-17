/**
 * Migration Script: Add Vendor Support to Inventory
 * 
 * This script:
 * 1. Creates a default "House Stock" vendor for store-owned inventory
 * 2. Migrates existing BranchStock records to include vendorId
 * 3. Validates the migration
 * 
 * IMPORTANT: Run this ONCE after deploying the Vendor model changes
 * 
 * Usage:
 *   npx ts-node scripts/migrate-vendor-inventory.ts
 * 
 * Or via MongoDB connection:
 *   node scripts/migrate-vendor-inventory.js
 */

import mongoose from 'mongoose'
import connectDB from '../lib/mongodb'
import Vendor from '../models/Vendor'
import BranchStock from '../models/BranchStock'
import Branch from '../models/Branch'

interface MigrationResult {
  success: boolean
  houseVendorCreated: boolean
  houseVendorId?: string
  branchStockRecordsMigrated: number
  branchStockRecordsSkipped: number
  errors: string[]
}

async function migrateVendorInventory(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    houseVendorCreated: false,
    branchStockRecordsMigrated: 0,
    branchStockRecordsSkipped: 0,
    errors: []
  }

  try {
    console.log('🚀 Starting Vendor Inventory Migration...\n')
    
    await connectDB()
    
    // Step 1: Check if House Stock vendor already exists
    console.log('Step 1: Checking for House Stock vendor...')
    let houseVendor = await Vendor.findOne({ isHouseStock: true })
    
    if (houseVendor) {
      console.log(`✅ House Stock vendor already exists: ${houseVendor.name} (${houseVendor.vendorCode})`)
      result.houseVendorId = houseVendor._id!.toString()
    } else {
      // Create House Stock vendor
      console.log('Creating House Stock vendor...')
      
      houseVendor = new Vendor({
        name: 'House Stock',
        vendorCode: 'HOUSE',
        isActive: true,
        isHouseStock: true,
        notes: 'Default vendor for store-owned inventory. Created by migration script.'
      })
      
      await houseVendor.save()
      result.houseVendorCreated = true
      result.houseVendorId = houseVendor._id!.toString()
      
      console.log(`✅ Created House Stock vendor: ${houseVendor._id}\n`)
    }
    
    // Step 2: Find BranchStock records without vendorId
    console.log('Step 2: Finding BranchStock records without vendorId...')
    
    // Use native MongoDB to find records without vendorId field
    const db = mongoose.connection.db
    const branchStockCollection = db!.collection('branchstocks')
    
    const recordsWithoutVendor = await branchStockCollection
      .find({ vendorId: { $exists: false } })
      .toArray()
    
    console.log(`Found ${recordsWithoutVendor.length} BranchStock records without vendorId\n`)
    
    if (recordsWithoutVendor.length === 0) {
      console.log('✅ No records to migrate. All BranchStock records already have vendorId.')
      result.success = true
      return result
    }
    
    // Step 3: Migrate records
    console.log('Step 3: Migrating BranchStock records...')
    
    for (const record of recordsWithoutVendor) {
      try {
        // Verify the branch still exists
        const branch = await Branch.findById(record.branchId)
        if (!branch) {
          console.log(`⚠️  Skipping record ${record._id}: Branch ${record.branchId} not found`)
          result.branchStockRecordsSkipped++
          result.errors.push(`Record ${record._id}: Branch not found`)
          continue
        }
        
        // Update the record to add vendorId
        await branchStockCollection.updateOne(
          { _id: record._id },
          { 
            $set: { 
              vendorId: new mongoose.Types.ObjectId(result.houseVendorId!) 
            } 
          }
        )
        
        result.branchStockRecordsMigrated++
        
        if (result.branchStockRecordsMigrated % 100 === 0) {
          console.log(`  Migrated ${result.branchStockRecordsMigrated} records...`)
        }
      } catch (error: any) {
        console.error(`❌ Error migrating record ${record._id}:`, error.message)
        result.errors.push(`Record ${record._id}: ${error.message}`)
        result.branchStockRecordsSkipped++
      }
    }
    
    console.log(`\n✅ Migration complete: ${result.branchStockRecordsMigrated} records migrated`)
    
    if (result.branchStockRecordsSkipped > 0) {
      console.log(`⚠️  ${result.branchStockRecordsSkipped} records skipped (see errors)`)
    }
    
    // Step 4: Validation
    console.log('\nStep 4: Validating migration...')
    
    const remainingWithoutVendor = await branchStockCollection
      .countDocuments({ vendorId: { $exists: false } })
    
    if (remainingWithoutVendor > 0) {
      console.log(`⚠️  Warning: ${remainingWithoutVendor} records still without vendorId`)
      result.errors.push(`${remainingWithoutVendor} records still without vendorId after migration`)
    } else {
      console.log('✅ Validation passed: All BranchStock records have vendorId')
    }
    
    // Check total records
    const totalRecords = await BranchStock.countDocuments()
    console.log(`\nTotal BranchStock records: ${totalRecords}`)
    
    const houseStockCount = await BranchStock.countDocuments({ 
      vendorId: new mongoose.Types.ObjectId(result.houseVendorId!) 
    })
    console.log(`Records assigned to House Stock: ${houseStockCount}`)
    
    result.success = result.errors.length === 0 || remainingWithoutVendor === 0
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    result.errors.push(`Fatal error: ${error.message}`)
    result.success = false
  }
  
  return result
}

// Main execution
async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  VENDOR INVENTORY MIGRATION')
  console.log('═══════════════════════════════════════════════════════\n')
  
  const result = await migrateVendorInventory()
  
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  MIGRATION SUMMARY')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`)
  console.log(`House Vendor Created: ${result.houseVendorCreated ? 'Yes' : 'No'}`)
  console.log(`House Vendor ID: ${result.houseVendorId || 'N/A'}`)
  console.log(`BranchStock Records Migrated: ${result.branchStockRecordsMigrated}`)
  console.log(`BranchStock Records Skipped: ${result.branchStockRecordsSkipped}`)
  
  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`)
    result.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`)
    })
  }
  
  console.log('\n═══════════════════════════════════════════════════════\n')
  
  await mongoose.connection.close()
  
  process.exit(result.success ? 0 : 1)
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
}

export { migrateVendorInventory }
