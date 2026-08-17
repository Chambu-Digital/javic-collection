/**
 * Migration Script: Add Vendor Support to Inventory
 * 
 * JavaScript version for direct execution with Node.js
 * 
 * Usage:
 *   node scripts/migrate-vendor-inventory.js
 */

const mongoose = require('mongoose')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/javic'

// Simple schema definitions for migration
const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  vendorCode: { type: String, required: true, unique: true },
  phone: String,
  email: String,
  isActive: { type: Boolean, default: true },
  isHouseStock: { type: Boolean, default: false },
  notes: String
}, { timestamps: true })

const BranchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  branchCode: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }
})

const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema)
const Branch = mongoose.models.Branch || mongoose.model('Branch', BranchSchema)

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return
  
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  
  console.log('✅ Connected to MongoDB\n')
}

async function migrateVendorInventory() {
  const result = {
    success: false,
    houseVendorCreated: false,
    houseVendorId: null,
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
      result.houseVendorId = houseVendor._id.toString()
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
      result.houseVendorId = houseVendor._id.toString()
      
      console.log(`✅ Created House Stock vendor: ${houseVendor._id}\n`)
    }
    
    // Step 2: Find BranchStock records without vendorId
    console.log('Step 2: Finding BranchStock records without vendorId...')
    
    const db = mongoose.connection.db
    const branchStockCollection = db.collection('branchstocks')
    
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
              vendorId: new mongoose.Types.ObjectId(result.houseVendorId) 
            } 
          }
        )
        
        result.branchStockRecordsMigrated++
        
        if (result.branchStockRecordsMigrated % 100 === 0) {
          console.log(`  Migrated ${result.branchStockRecordsMigrated} records...`)
        }
      } catch (error) {
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
    const totalRecords = await branchStockCollection.countDocuments()
    console.log(`\nTotal BranchStock records: ${totalRecords}`)
    
    const houseStockCount = await branchStockCollection.countDocuments({ 
      vendorId: new mongoose.Types.ObjectId(result.houseVendorId) 
    })
    console.log(`Records assigned to House Stock: ${houseStockCount}`)
    
    result.success = result.errors.length === 0 || remainingWithoutVendor === 0
    
  } catch (error) {
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

// Run
main().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
