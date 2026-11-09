/**
 * Migration Script: Create Branch-Vendor Assignments
 * 
 * This script creates BranchVendor junction records based on existing BranchStock data.
 * It assigns vendors to branches wherever they have inventory records.
 * 
 * Usage:
 *   npx ts-node scripts/migrate-branch-vendor-assignments.ts
 *   npx ts-node scripts/migrate-branch-vendor-assignments.ts --dry-run
 */

import mongoose from 'mongoose'
import connectDB from '../lib/mongodb'
import BranchVendor from '../models/BranchVendor'
import BranchStock from '../models/BranchStock'
import Branch from '../models/Branch'
import Vendor from '../models/Vendor'

interface MigrationResult {
  success: boolean
  dryRun: boolean
  assignmentsCreated: number
  assignmentsSkipped: number
  errors: string[]
  assignments: Array<{
    branchName: string
    branchCode: string
    vendorName: string
    vendorCode: string
    status: 'created' | 'existed' | 'error'
  }>
}

async function migrateBranchVendorAssignments(dryRun: boolean = false): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    dryRun,
    assignmentsCreated: 0,
    assignmentsSkipped: 0,
    errors: [],
    assignments: []
  }

  try {
    console.log('🚀 Starting Branch-Vendor Assignment Migration...')
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be saved)' : 'LIVE'}\n`)
    
    await connectDB()
    
    // Step 1: Get all unique branch-vendor pairs from BranchStock
    console.log('Step 1: Analyzing existing stock records...')
    
    const branchVendorPairs = await BranchStock.aggregate([
      {
        $group: {
          _id: {
            branchId: '$branchId',
            vendorId: '$vendorId'
          }
        }
      }
    ])
    
    console.log(`Found ${branchVendorPairs.length} unique branch-vendor combinations\n`)
    
    if (branchVendorPairs.length === 0) {
      console.log('✅ No stock records found. Nothing to migrate.')
      result.success = true
      return result
    }
    
    // Step 2: Create BranchVendor assignments
    console.log('Step 2: Creating branch-vendor assignments...\n')
    
    for (const pair of branchVendorPairs) {
      const { branchId, vendorId } = pair._id
      
      try {
        // Fetch branch and vendor details
        const [branch, vendor] = await Promise.all([
          Branch.findById(branchId),
          Vendor.findById(vendorId)
        ])
        
        if (!branch) {
          console.log(`⚠️  Skipping: Branch ${branchId} not found`)
          result.assignmentsSkipped++
          result.errors.push(`Branch ${branchId} not found`)
          continue
        }
        
        if (!vendor) {
          console.log(`⚠️  Skipping: Vendor ${vendorId} not found`)
          result.assignmentsSkipped++
          result.errors.push(`Vendor ${vendorId} not found`)
          continue
        }
        
        // Check if assignment already exists
        const existingAssignment = await BranchVendor.findOne({ branchId, vendorId })
        
        if (existingAssignment) {
          console.log(`   Already exists: ${branch.name} (${branch.branchCode}) ↔ ${vendor.name} (${vendor.vendorCode})`)
          result.assignmentsSkipped++
          result.assignments.push({
            branchName: branch.name,
            branchCode: branch.branchCode,
            vendorName: vendor.name,
            vendorCode: vendor.vendorCode,
            status: 'existed'
          })
          continue
        }
        
        // Create new assignment (unless dry run)
        if (!dryRun) {
          const assignment = new BranchVendor({
            branchId,
            vendorId,
            isActive: branch.isActive && vendor.isActive,
            assignedAt: new Date()
          })
          
          await assignment.save()
        }
        
        console.log(`${dryRun ? '[DRY RUN] Would create' : '✅ Created'}: ${branch.name} (${branch.branchCode}) ↔ ${vendor.name} (${vendor.vendorCode})`)
        result.assignmentsCreated++
        result.assignments.push({
          branchName: branch.name,
          branchCode: branch.branchCode,
          vendorName: vendor.name,
          vendorCode: vendor.vendorCode,
          status: 'created'
        })
        
      } catch (error: any) {
        console.error(`❌ Error processing pair ${branchId}-${vendorId}:`, error.message)
        result.errors.push(`Pair ${branchId}-${vendorId}: ${error.message}`)
        result.assignmentsSkipped++
      }
    }
    
    console.log(`\n${dryRun ? '[DRY RUN] Would have created' : 'Created'} ${result.assignmentsCreated} assignments`)
    
    if (result.assignmentsSkipped > 0) {
      console.log(`⚠️  ${result.assignmentsSkipped} assignments skipped (see details above)`)
    }
    
    // Step 3: Validation
    if (!dryRun) {
      console.log('\nStep 3: Validating migration...')
      
      const totalAssignments = await BranchVendor.countDocuments()
      console.log(`Total BranchVendor records: ${totalAssignments}`)
      
      // Verify each BranchStock record has a corresponding BranchVendor assignment
      const stockRecords = await BranchStock.find().select('branchId vendorId')
      let missingAssignments = 0
      
      for (const stock of stockRecords) {
        const hasAssignment = await BranchVendor.findOne({
          branchId: stock.branchId,
          vendorId: stock.vendorId
        })
        
        if (!hasAssignment) {
          missingAssignments++
        }
      }
      
      if (missingAssignments > 0) {
        console.log(`⚠️  Warning: ${missingAssignments} stock records still without vendor assignment`)
        result.errors.push(`${missingAssignments} stock records without assignment`)
      } else {
        console.log('✅ Validation passed: All stock records have vendor assignments')
      }
    }
    
    result.success = result.errors.length === 0 || result.assignmentsCreated > 0
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    result.errors.push(`Fatal error: ${error.message}`)
    result.success = false
  }
  
  return result
}

// Main execution
async function main() {
  const dryRun = process.argv.includes('--dry-run')
  
  console.log('═══════════════════════════════════════════════════════')
  console.log('  BRANCH-VENDOR ASSIGNMENT MIGRATION')
  console.log('═══════════════════════════════════════════════════════\n')
  
  const result = await migrateBranchVendorAssignments(dryRun)
  
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  MIGRATION SUMMARY')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`Mode: ${result.dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`)
  console.log(`Assignments Created: ${result.assignmentsCreated}`)
  console.log(`Assignments Skipped: ${result.assignmentsSkipped}`)
  
  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`)
    result.errors.slice(0, 10).forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`)
    })
    if (result.errors.length > 10) {
      console.log(`  ... and ${result.errors.length - 10} more`)
    }
  }
  
  if (result.dryRun && result.assignmentsCreated > 0) {
    console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.')
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

export { migrateBranchVendorAssignments }
