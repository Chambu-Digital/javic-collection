# VARIANT ID MIGRATION - IMPLEMENTATION PLAN

## Project Overview

**Goal**: Replace position-based `imageIndex` with stable `variantId` for product variants

**Timeline**: 3 weeks  
**Risk Level**: Medium (manageable with phased approach)  
**Team Required**: 1 Backend Dev, 1 Frontend Dev, 1 QA Engineer

---

## Table of Contents

1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Phase 1: Schema Extension](#phase-1-schema-extension-week-1-days-1-2)
3. [Phase 2: Backend Migration](#phase-2-backend-migration-week-1-2-days-3-7)
4. [Phase 3: Frontend Migration](#phase-3-frontend-migration-week-2-days-8-10)
5. [Phase 4: Testing & Validation](#phase-4-testing--validation-week-2-3-days-11-14)
6. [Phase 5: Production Deployment](#phase-5-production-deployment-week-3-day-15)
7. [Phase 6: Monitoring & Cleanup](#phase-6-monitoring--cleanup-week-3-days-16-21)
8. [Rollback Procedures](#rollback-procedures)

---

## Pre-Migration Checklist

### Environment Setup
- [ ] Create `migration/variant-id` branch
- [ ] Ensure staging environment mirrors production
- [ ] Set up database backup automation (if not already)
- [ ] Install migration dependencies: `nanoid`
  ```bash
  npm install nanoid
  ```
- [ ] Create migration scripts directory
  ```bash
  mkdir -p scripts/migrations/variant-id
  ```

### Team Alignment
- [ ] Review entire plan with team
- [ ] Assign roles (Backend Dev, Frontend Dev, QA)
- [ ] Schedule daily standup during migration
- [ ] Set up monitoring dashboard
- [ ] Prepare rollback checklist

### Documentation
- [ ] Document current imageIndex flow
- [ ] Create test data snapshots
- [ ] List all affected endpoints

---

## PHASE 1: Schema Extension (Week 1, Days 1-2)

### Objective
Add `variantId` field to all products and BranchStock records without breaking existing functionality.

### 1.1 Update Product Model

**File**: `models/Product.ts`

**Changes**:
```typescript
export interface IProductImage {
  variantId: string         // NEW: Add this field
  url: string
  groupId?: string
  price?: number
  wholesalePrice?: number
  wholesaleThreshold?: number
  stock?: number
  sizes?: string[]
  sizeStock?: Record<string, number>
  sku?: string
}

// In ProductSchema:
images: [{
  variantId:         { type: String, required: true, trim: true },  // NEW
  groupId:           { type: String, trim: true },
  url:               { type: String, required: true },
  // ... rest unchanged
}],
```

**Testing**:
- [ ] Compile TypeScript successfully
- [ ] Verify Product model loads without errors

---

### 1.2 Create Variant ID Generator Utility

**File**: `lib/generate-variant-id.ts` (NEW FILE)

```typescript
import { customAlphabet } from 'nanoid'

/**
 * Generate a unique variant identifier
 * Format: var_xxxxxxxxxx (14 characters)
 * Example: var_k3j9d8f7s2
 */
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10)

export function generateVariantId(): string {
  return `var_${nanoid()}`
}

/**
 * Validate variant ID format
 */
export function isValidVariantId(id: string): boolean {
  return /^var_[0-9a-z]{10}$/.test(id)
}

/**
 * Generate variant IDs for all images in a product
 */
export function generateVariantIdsForProduct(imageCount: number): string[] {
  return Array.from({ length: imageCount }, () => generateVariantId())
}
```

**Testing**:
- [ ] Generate 1000 IDs, verify all unique
- [ ] Validate format with `isValidVariantId`

---

### 1.3 Migration Script: Add Variant IDs to Products

**File**: `scripts/migrations/variant-id/01-add-variant-ids-to-products.ts` (NEW FILE)

```typescript
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import { generateVariantId, isValidVariantId } from '@/lib/generate-variant-id'

async function addVariantIdsToProducts() {
  console.log('🚀 Starting: Add variantId to all products...\n')
  
  await connectDB()
  
  // Find all products without variantIds
  const products = await Product.find({
    'images.variantId': { $exists: false }
  })
  
  console.log(`Found ${products.length} products needing migration\n`)
  
  let updated = 0
  let errors = 0
  
  for (const product of products) {
    try {
      let modified = false
      
      // Add variantId to each image that doesn't have one
      for (let i = 0; i < product.images.length; i++) {
        if (!product.images[i].variantId) {
          const variantId = generateVariantId()
          product.images[i].variantId = variantId
          modified = true
        }
      }
      
      if (modified) {
        // Validate all variantIds are unique within product
        const variantIds = product.images.map(img => img.variantId)
        const uniqueIds = new Set(variantIds)
        
        if (variantIds.length !== uniqueIds.size) {
          throw new Error(`Duplicate variantIds detected in product ${product._id}`)
        }
        
        // Validate all variantIds match format
        for (const id of variantIds) {
          if (!isValidVariantId(id)) {
            throw new Error(`Invalid variantId format: ${id}`)
          }
        }
        
        await product.save()
        updated++
        
        if (updated % 100 === 0) {
          console.log(`✅ Updated ${updated} products...`)
        }
      }
    } catch (error: any) {
      console.error(`❌ Error updating product ${product._id}:`, error.message)
      errors++
    }
  }
  
  console.log(`\n✅ Migration complete!`)
  console.log(`   Updated: ${updated} products`)
  console.log(`   Errors: ${errors}`)
  
  // Validation check
  const productsWithoutVariantIds = await Product.countDocuments({
    'images.variantId': { $exists: false }
  })
  
  if (productsWithoutVariantIds > 0) {
    console.log(`\n⚠️  WARNING: ${productsWithoutVariantIds} products still missing variantIds`)
  } else {
    console.log(`\n✅ All products now have variantIds!`)
  }
  
  await mongoose.connection.close()
}

// Run if called directly
if (require.main === module) {
  addVariantIdsToProducts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

export default addVariantIdsToProducts
```

**Execution**:
```bash
npx tsx scripts/migrations/variant-id/01-add-variant-ids-to-products.ts
```

**Testing**:
- [ ] Run on test database first
- [ ] Verify all products have variantIds
- [ ] Verify no duplicate variantIds within products
- [ ] Check format: `var_[a-z0-9]{10}`

---

### 1.4 Update BranchStock Model

**File**: `models/BranchStock.ts`

**Changes**:
```typescript
export interface IBranchStock {
  _id?: string
  productId: mongoose.Types.ObjectId
  branchId: mongoose.Types.ObjectId
  vendorId: mongoose.Types.ObjectId
  imageIndex: number          // KEEP for backward compatibility
  variantId?: string          // NEW: Add as optional (will be required after migration)
  selectedSize?: string
  stockIdentifier: string
  quantity: number
  createdAt?: Date
  updatedAt?: Date
}

// In BranchStockSchema:
const BranchStockSchema = new mongoose.Schema<IBranchStock>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true
    },
    imageIndex: {
      type: Number,
      required: true,
      min: 0
    },
    variantId: {              // NEW
      type: String,
      trim: true,
      index: true
    },
    // ... rest unchanged
  },
  { timestamps: true }
)

// Update compound indexes - add new one with variantId
BranchStockSchema.index({ productId: 1, branchId: 1, vendorId: 1, variantId: 1, selectedSize: 1 })
```

**Testing**:
- [ ] Compile TypeScript successfully
- [ ] Verify BranchStock model loads without errors

---

### 1.5 Migration Script: Populate BranchStock.variantId

**File**: `scripts/migrations/variant-id/02-populate-branch-stock-variant-ids.ts` (NEW FILE)

```typescript
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import BranchStock from '@/models/BranchStock'

async function populateBranchStockVariantIds() {
  console.log('🚀 Starting: Populate BranchStock variantIds...\n')
  
  await connectDB()
  
  // Find all BranchStock records without variantId
  const branchStocks = await BranchStock.find({
    variantId: { $exists: false }
  })
  
  console.log(`Found ${branchStocks.length} BranchStock records needing migration\n`)
  
  let updated = 0
  let errors = 0
  const errorDetails: any[] = []
  
  // Group by productId to minimize Product queries
  const stocksByProduct = new Map<string, any[]>()
  
  for (const stock of branchStocks) {
    const productId = stock.productId.toString()
    if (!stocksByProduct.has(productId)) {
      stocksByProduct.set(productId, [])
    }
    stocksByProduct.get(productId)!.push(stock)
  }
  
  console.log(`Processing ${stocksByProduct.size} unique products...\n`)
  
  for (const [productId, stocks] of stocksByProduct.entries()) {
    try {
      // Load product once
      const product = await Product.findById(productId)
      
      if (!product) {
        console.error(`❌ Product not found: ${productId}`)
        errorDetails.push({ productId, reason: 'Product not found' })
        errors += stocks.length
        continue
      }
      
      // Update all stocks for this product
      for (const stock of stocks) {
        try {
          const imageIndex = stock.imageIndex
          
          // Validate imageIndex
          if (imageIndex < 0 || imageIndex >= product.images.length) {
            throw new Error(`Invalid imageIndex ${imageIndex} (product has ${product.images.length} images)`)
          }
          
          const image = product.images[imageIndex]
          
          if (!image.variantId) {
            throw new Error(`Product ${productId} image at index ${imageIndex} missing variantId`)
          }
          
          // Update BranchStock with variantId
          stock.variantId = image.variantId
          await stock.save()
          
          updated++
          
          if (updated % 100 === 0) {
            console.log(`✅ Updated ${updated} records...`)
          }
        } catch (error: any) {
          console.error(`❌ Error updating stock ${stock._id}:`, error.message)
          errorDetails.push({
            stockId: stock._id,
            productId,
            imageIndex: stock.imageIndex,
            reason: error.message
          })
          errors++
        }
      }
    } catch (error: any) {
      console.error(`❌ Error processing product ${productId}:`, error.message)
      errors += stocks.length
    }
  }
  
  console.log(`\n✅ Migration complete!`)
  console.log(`   Updated: ${updated} records`)
  console.log(`   Errors: ${errors}`)
  
  if (errorDetails.length > 0) {
    console.log(`\n⚠️  Error details:`)
    console.log(JSON.stringify(errorDetails.slice(0, 10), null, 2))
    if (errorDetails.length > 10) {
      console.log(`   ... and ${errorDetails.length - 10} more errors`)
    }
  }
  
  // Validation check
  const stocksWithoutVariantIds = await BranchStock.countDocuments({
    variantId: { $exists: false }
  })
  
  if (stocksWithoutVariantIds > 0) {
    console.log(`\n⚠️  WARNING: ${stocksWithoutVariantIds} BranchStock records still missing variantIds`)
  } else {
    console.log(`\n✅ All BranchStock records now have variantIds!`)
  }
  
  await mongoose.connection.close()
}

// Run if called directly
if (require.main === module) {
  populateBranchStockVariantIds()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

export default populateBranchStockVariantIds
```

**Execution**:
```bash
npx tsx scripts/migrations/variant-id/02-populate-branch-stock-variant-ids.ts
```

**Testing**:
- [ ] Run on test database first
- [ ] Verify all BranchStock records have variantIds
- [ ] Verify variantIds match product.images[imageIndex].variantId
- [ ] Check for orphaned records (imageIndex out of bounds)

---

### 1.6 Validation Script

**File**: `scripts/migrations/variant-id/validate-phase1.ts` (NEW FILE)

```typescript
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import BranchStock from '@/models/BranchStock'
import { isValidVariantId } from '@/lib/generate-variant-id'

async function validatePhase1() {
  console.log('🔍 Validating Phase 1 Migration...\n')
  
  await connectDB()
  
  const issues: any[] = []
  
  // Check 1: All products have variantIds
  console.log('1️⃣  Checking products...')
  const productsWithoutVariantIds = await Product.countDocuments({
    'images.variantId': { $exists: false }
  })
  
  if (productsWithoutVariantIds > 0) {
    issues.push({
      check: 'Products with variantIds',
      status: 'FAIL',
      message: `${productsWithoutVariantIds} products missing variantIds`
    })
  } else {
    console.log('   ✅ All products have variantIds')
  }
  
  // Check 2: All variantIds are valid format
  console.log('2️⃣  Checking variantId formats...')
  const products = await Product.find({})
  let invalidFormatCount = 0
  
  for (const product of products) {
    for (const image of product.images) {
      if (!isValidVariantId(image.variantId)) {
        invalidFormatCount++
        if (invalidFormatCount <= 5) {
          issues.push({
            check: 'VariantId format',
            status: 'FAIL',
            productId: product._id,
            variantId: image.variantId
          })
        }
      }
    }
  }
  
  if (invalidFormatCount > 0) {
    console.log(`   ❌ ${invalidFormatCount} invalid variantId formats`)
  } else {
    console.log('   ✅ All variantIds have valid format')
  }
  
  // Check 3: No duplicate variantIds within products
  console.log('3️⃣  Checking for duplicate variantIds within products...')
  let duplicatesCount = 0
  
  for (const product of products) {
    const variantIds = product.images.map(img => img.variantId)
    const uniqueIds = new Set(variantIds)
    
    if (variantIds.length !== uniqueIds.size) {
      duplicatesCount++
      if (duplicatesCount <= 5) {
        issues.push({
          check: 'Unique variantIds',
          status: 'FAIL',
          productId: product._id,
          message: 'Duplicate variantIds within product'
        })
      }
    }
  }
  
  if (duplicatesCount > 0) {
    console.log(`   ❌ ${duplicatesCount} products with duplicate variantIds`)
  } else {
    console.log('   ✅ All products have unique variantIds')
  }
  
  // Check 4: All BranchStock records have variantIds
  console.log('4️⃣  Checking BranchStock records...')
  const stocksWithoutVariantIds = await BranchStock.countDocuments({
    variantId: { $exists: false }
  })
  
  if (stocksWithoutVariantIds > 0) {
    issues.push({
      check: 'BranchStock variantIds',
      status: 'FAIL',
      message: `${stocksWithoutVariantIds} BranchStock records missing variantIds`
    })
  } else {
    console.log('   ✅ All BranchStock records have variantIds')
  }
  
  // Check 5: BranchStock variantIds reference valid product variants
  console.log('5️⃣  Checking BranchStock reference integrity...')
  const branchStocks = await BranchStock.find({}).limit(1000) // Sample check
  let orphanedCount = 0
  
  for (const stock of branchStocks) {
    const product = await Product.findById(stock.productId)
    
    if (!product) {
      orphanedCount++
      continue
    }
    
    const variant = product.images.find(img => img.variantId === stock.variantId)
    
    if (!variant) {
      orphanedCount++
      if (orphanedCount <= 5) {
        issues.push({
          check: 'BranchStock reference integrity',
          status: 'FAIL',
          stockId: stock._id,
          productId: stock.productId,
          variantId: stock.variantId,
          message: 'VariantId not found in product'
        })
      }
    }
  }
  
  if (orphanedCount > 0) {
    console.log(`   ❌ ${orphanedCount} orphaned BranchStock records (sample of 1000)`)
  } else {
    console.log('   ✅ All BranchStock records reference valid variants')
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`)
  if (issues.length === 0) {
    console.log('✅ VALIDATION PASSED - Phase 1 migration successful!')
  } else {
    console.log(`❌ VALIDATION FAILED - ${issues.length} issues found`)
    console.log('\nFirst 10 issues:')
    console.log(JSON.stringify(issues.slice(0, 10), null, 2))
  }
  console.log('='.repeat(60))
  
  await mongoose.connection.close()
  
  return issues.length === 0
}

// Run if called directly
if (require.main === module) {
  validatePhase1()
    .then((passed) => process.exit(passed ? 0 : 1))
    .catch((error) => {
      console.error('Validation failed:', error)
      process.exit(1)
    })
}

export default validatePhase1
```

**Execution**:
```bash
npx tsx scripts/migrations/variant-id/validate-phase1.ts
```

**Testing**:
- [ ] All validation checks pass
- [ ] No orphaned BranchStock records
- [ ] No invalid variantId formats

---

### Phase 1 Completion Checklist

- [ ] Product model updated with `variantId` field
- [ ] BranchStock model updated with `variantId` field
- [ ] Variant ID generator utility created
- [ ] Migration script 01 executed successfully on staging
- [ ] Migration script 02 executed successfully on staging
- [ ] Validation script passes all checks
- [ ] No products missing variantIds
- [ ] No BranchStock records missing variantIds
- [ ] All variantIds have valid format
- [ ] Code compiles and existing functionality works
- [ ] Database backed up before production run
- [ ] Migration scripts executed on production
- [ ] Validation script passes on production

**Estimated Duration**: 2 days

---

## PHASE 2: Backend Migration (Week 1-2, Days 3-7)

### Objective
Update all backend code to use `variantId` while maintaining backward compatibility with `imageIndex`.

### 2.1 Update Inventory Helper Functions

**File**: `lib/branch-inventory.ts`

**Strategy**: Update all functions to accept `variantId` as primary parameter, with `imageIndex` as optional fallback.

**Changes**:

```typescript
// ADD NEW HELPER: Resolve variantId from imageIndex if needed
async function resolveVariantId(
  productId: mongoose.Types.ObjectId | string,
  variantId?: string,
  imageIndex?: number
): Promise<string | null> {
  // If variantId provided, use it
  if (variantId) return variantId
  
  // Fallback: Look up variantId from imageIndex
  if (imageIndex !== undefined) {
    const product = await Product.findById(productId).select('images').lean()
    if (product && product.images[imageIndex]) {
      return product.images[imageIndex].variantId || null
    }
  }
  
  return null
}

// UPDATE: getTotalProductStock
export async function getTotalProductStock(
  productId: mongoose.Types.ObjectId | string,
  variantId?: string,           // NEW: Primary parameter
  selectedSize?: string,
  imageIndex?: number            // DEPRECATED: Fallback only
): Promise<number> {
  const productObjectId = typeof productId === 'string' 
    ? new mongoose.Types.ObjectId(productId) 
    : productId

  // Resolve variantId if not provided
  const resolvedVariantId = await resolveVariantId(productObjectId, variantId, imageIndex)

  const query: any = { productId: productObjectId }
  if (resolvedVariantId) query.variantId = resolvedVariantId
  else if (imageIndex !== undefined) query.imageIndex = imageIndex // Last resort
  if (selectedSize) query.selectedSize = selectedSize

  const result = await BranchStock.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$quantity' } } }
  ])

  return result.length > 0 ? result[0].total : 0
}

// UPDATE: getProductBranchStocks
export async function getProductBranchStocks(
  productId: mongoose.Types.ObjectId | string,
  variantId?: string,           // NEW: Primary parameter
  selectedSize?: string,
  imageIndex?: number            // DEPRECATED: Fallback only
): Promise<BranchStockInfo[]> {
  const productObjectId = typeof productId === 'string' 
    ? new mongoose.Types.ObjectId(productId) 
    : productId

  // Resolve variantId if not provided
  const resolvedVariantId = await resolveVariantId(productObjectId, variantId, imageIndex)

  const query: any = { productId: productObjectId }
  if (resolvedVariantId) query.variantId = resolvedVariantId
  else if (imageIndex !== undefined) query.imageIndex = imageIndex
  if (selectedSize) query.selectedSize = selectedSize

  const stocks = await BranchStock.find(query)
    .populate('branchId')
    .populate('vendorId')
    .lean()

  return stocks.map((stock: any) => ({
    branchId: stock.branchId._id.toString(),
    branchCode: stock.branchId.branchCode,
    branchName: stock.branchId.name,
    vendorId: stock.vendorId._id.toString(),
    vendorCode: stock.vendorId.vendorCode,
    vendorName: stock.vendorId.name,
    quantity: stock.quantity,
    isActive: stock.branchId.isActive && stock.vendorId.isActive,
    stockIdentifier: stock.stockIdentifier,
    imageIndex: stock.imageIndex,
    selectedSize: stock.selectedSize
  }))
}

// UPDATE: getCompleteProductStock
export async function getCompleteProductStock(
  productId: mongoose.Types.ObjectId | string,
  variantId?: string,           // NEW: Primary parameter
  selectedSize?: string,
  imageIndex?: number            // DEPRECATED: Fallback only
): Promise<ProductBranchStock> {
  const [totalStock, branchStocks] = await Promise.all([
    getTotalProductStock(productId, variantId, selectedSize, imageIndex),
    getProductBranchStocks(productId, variantId, selectedSize, imageIndex)
  ])

  const lowStockThreshold = 10
  const lowStockBranches = branchStocks
    .filter(bs => bs.quantity > 0 && bs.quantity <= lowStockThreshold)
    .map(bs => bs.branchName)

  return {
    productId: productId.toString(),
    imageIndex: imageIndex ?? 0,
    selectedSize,
    totalStock,
    branchStocks,
    lowStockBranches
  }
}

// UPDATE: getBranchStock
export async function getBranchStock(
  branchId: mongoose.Types.ObjectId | string,
  productId: mongoose.Types.ObjectId | string,
  variantId: string,            // NEW: Primary parameter
  selectedSize?: string,
  vendorId?: mongoose.Types.ObjectId | string,
  imageIndex?: number           // DEPRECATED: Fallback only
): Promise<number> {
  // Resolve variantId if not provided
  const resolvedVariantId = await resolveVariantId(
    productId, 
    variantId, 
    imageIndex
  )

  const query: any = { 
    branchId, 
    productId
  }
  
  if (resolvedVariantId) query.variantId = resolvedVariantId
  else if (imageIndex !== undefined) query.imageIndex = imageIndex
  if (selectedSize) query.selectedSize = selectedSize
  if (vendorId) query.vendorId = vendorId

  if (vendorId) {
    const branchStock = await BranchStock.findOne(query)
    return branchStock ? branchStock.quantity : 0
  }

  const stocks = await BranchStock.find(query)
  return stocks.reduce((sum, stock) => sum + stock.quantity, 0)
}

// UPDATE: updateBranchStock
export async function updateBranchStock(
  branchId: mongoose.Types.ObjectId | string,
  productId: mongoose.Types.ObjectId | string,
  vendorId: mongoose.Types.ObjectId | string,
  variantId: string,            // NEW: Primary parameter
  selectedSize: string | undefined,
  quantityChange: number,
  session?: mongoose.ClientSession,
  imageIndex?: number           // DEPRECATED: For migration only
): Promise<{ success: boolean; newQuantity: number }> {
  // Resolve variantId if not provided
  const resolvedVariantId = await resolveVariantId(
    productId, 
    variantId, 
    imageIndex
  )
  
  if (!resolvedVariantId) {
    throw new Error('Cannot update stock: variantId could not be resolved')
  }

  const query: any = { 
    branchId, 
    productId,
    vendorId,
    variantId: resolvedVariantId
  }
  if (selectedSize) query.selectedSize = selectedSize
  else query.selectedSize = { $exists: false }

  const branchStock = await BranchStock.findOne(query).session(session || null)

  if (!branchStock) {
    // Create new branch stock record
    const product = await Product.findById(productId).session(session || null)
    const branch = await Branch.findById(branchId).session(session || null)
    const Vendor = mongoose.model('Vendor')
    const vendor = await Vendor.findById(vendorId).session(session || null)
    
    if (!product || !branch || !vendor) {
      throw new Error('Product, branch, or vendor not found')
    }

    // Find variant by variantId
    const variant = product.images.find(img => img.variantId === resolvedVariantId)
    if (!variant) {
      throw new Error(`Variant ${resolvedVariantId} not found in product`)
    }
    
    const variantIndex = product.images.indexOf(variant)
    const productSku = variant.sku || product.sku || `PROD${productId.toString().slice(-6)}`
    const stockIdentifier = (BranchStock as any).generateStockIdentifier(
      productSku,
      branch.branchCode,
      variantIndex,  // Keep for identifier generation
      selectedSize
    )

    const newBranchStock = new BranchStock({
      productId,
      branchId,
      vendorId,
      variantId: resolvedVariantId,
      imageIndex: variantIndex,  // Keep for backward compat
      selectedSize,
      stockIdentifier,
      quantity: Math.max(0, quantityChange)
    })

    await newBranchStock.save({ session: session || undefined })
    return { success: true, newQuantity: newBranchStock.quantity }
  }

  // Update existing stock
  branchStock.quantity = Math.max(0, branchStock.quantity + quantityChange)
  await branchStock.save({ session: session || undefined })

  return { success: true, newQuantity: branchStock.quantity }
}

// UPDATE: deductBranchStock
export async function deductBranchStock(
  branchId: mongoose.Types.ObjectId | string,
  productId: mongoose.Types.ObjectId | string,
  vendorId: mongoose.Types.ObjectId | string,
  variantId: string,            // NEW: Primary parameter
  selectedSize: string | undefined,
  quantity: number,
  session?: mongoose.ClientSession,
  imageIndex?: number           // DEPRECATED: For migration only
): Promise<{ success: boolean; newQuantity: number; stockIdentifier: string }> {
  if (quantity <= 0) {
    throw new Error('Quantity to deduct must be positive')
  }

  // Resolve variantId if not provided
  const resolvedVariantId = await resolveVariantId(
    productId, 
    variantId, 
    imageIndex
  )
  
  if (!resolvedVariantId) {
    throw new Error('Cannot deduct stock: variantId could not be resolved')
  }

  const query: any = { 
    branchId, 
    productId,
    vendorId,
    variantId: resolvedVariantId
  }
  if (selectedSize) query.selectedSize = selectedSize
  else query.selectedSize = { $exists: false }

  const branchStock = await BranchStock.findOne(query).session(session || null)

  if (!branchStock) {
    throw new Error('Branch stock record not found for this vendor and variant')
  }

  if (branchStock.quantity < quantity) {
    throw new Error(`Insufficient stock. Available: ${branchStock.quantity}, Required: ${quantity}`)
  }

  branchStock.quantity -= quantity
  await branchStock.save({ session: session || undefined })

  return { 
    success: true, 
    newQuantity: branchStock.quantity,
    stockIdentifier: branchStock.stockIdentifier
  }
}

// UPDATE: addBranchStock
export async function addBranchStock(
  branchId: mongoose.Types.ObjectId | string,
  productId: mongoose.Types.ObjectId | string,
  vendorId: mongoose.Types.ObjectId | string,
  variantId: string,            // NEW: Primary parameter
  selectedSize: string | undefined,
  quantity: number,
  session?: mongoose.ClientSession,
  imageIndex?: number           // DEPRECATED: For migration only
): Promise<{ success: boolean; newQuantity: number; stockIdentifier: string }> {
  if (quantity <= 0) {
    throw new Error('Quantity to add must be positive')
  }

  const result = await updateBranchStock(
    branchId,
    productId,
    vendorId,
    variantId,
    selectedSize,
    quantity,
    session,
    imageIndex
  )

  // Resolve variantId if not provided
  const resolvedVariantId = await resolveVariantId(
    productId, 
    variantId, 
    imageIndex
  )

  const query: any = { 
    branchId, 
    productId,
    vendorId,
    variantId: resolvedVariantId
  }
  if (selectedSize) query.selectedSize = selectedSize
  else query.selectedSize = { $exists: false }

  const branchStock = await BranchStock.findOne(query).session(session || null)

  return {
    ...result,
    stockIdentifier: branchStock?.stockIdentifier || ''
  }
}
```

**Testing**:
- [ ] All function signatures compile
- [ ] Functions work with variantId parameter
- [ ] Functions fall back to imageIndex for old code
- [ ] Stock queries return correct results
- [ ] Write unit tests for each function

---

### 2.2 Update BranchStockInfo Interface

**File**: `lib/branch-inventory.ts`

```typescript
export interface BranchStockInfo {
  branchId: string
  branchCode: string
  branchName: string
  vendorId: string
  vendorCode: string
  vendorName: string
  quantity: number
  isActive: boolean
  stockIdentifier: string
  variantId: string          // NEW: Add this
  imageIndex: number         // KEEP for backward compat
  selectedSize?: string
}
```

---

### 2.3 Update Admin Stock Management Page

**File**: `app/admin/products/[id]/stock/page.tsx`

**Changes**:

```typescript
// Replace state:
const [selectedImageIndex, setSelectedImageIndex] = useState(0)

// With:
const [selectedVariantId, setSelectedVariantId] = useState<string>('')

// Update useEffect to auto-select first variant:
useEffect(() => {
  if (product && product.images.length > 0) {
    setSelectedVariantId(product.images[0].variantId)
  }
}, [product])

// Update form submission:
const response = await fetch('/api/admin/products/stock/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: params.id,
    branchId: selectedBranch,
    vendorId: selectedVendor,
    variantId: selectedVariantId,        // NEW: Use variantId
    selectedSize: selectedSize || undefined,
    quantity: quantityToAdd,
  }),
})

// Update image selector dropdown:
<select
  value={selectedVariantId}
  onChange={(e) => {
    setSelectedVariantId(e.target.value)
    setSelectedSize('') // Reset size when variant changes
  }}
  className="..."
>
  {product.images.map((image, index) => (
    <option key={image.variantId} value={image.variantId}>
      Design {index + 1} ({image.variantId})
    </option>
  ))}
</select>

// Update size availability:
const selectedVariant = product.images?.find(img => img.variantId === selectedVariantId)
const availableSizes = selectedVariant?.sizes || product.sizes || []
```

**Testing**:
- [ ] Admin can select variant by dropdown
- [ ] Stock addition works with variantId
- [ ] Sizes update when variant changes

---

### 2.4 Create Stock Management API Endpoint

**File**: `app/api/admin/products/stock/add/route.ts` (NEW or UPDATE if exists)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { addBranchStock } from '@/lib/branch-inventory'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { 
      productId, 
      branchId, 
      vendorId, 
      variantId,        // NEW: Use variantId
      selectedSize, 
      quantity 
    } = await req.json()

    // Validate inputs
    if (!productId || !branchId || !vendorId || !variantId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be positive' },
        { status: 400 }
      )
    }

    // Add stock using variantId
    const result = await addBranchStock(
      branchId,
      productId,
      vendorId,
      variantId,
      selectedSize || undefined,
      quantity
    )

    return NextResponse.json({
      success: true,
      newQuantity: result.newQuantity,
      stockIdentifier: result.stockIdentifier
    })

  } catch (error: any) {
    console.error('[Admin Stock Add]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add stock' },
      { status: 500 }
    )
  }
}
```

**Testing**:
- [ ] API accepts variantId
- [ ] Stock is added correctly
- [ ] Error handling works

---

### 2.5 Update Order Model (Optional for new orders)

**File**: `models/Order.ts`

**Changes**:
```typescript
export interface IOrderItem {
  _id?: string
  productId: mongoose.Types.ObjectId
  productName: string
  productImage: string
  selectedImage?: string
  selectedImageIndex?: number    // KEEP for backward compat
  variantId?: string             // NEW: Add for new orders
  selectedSize?: string
  sku?: string
  itemCode?: string
  quantity: number
  // ... rest unchanged
}

// In OrderItemSchema:
const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  selectedImage: { type: String },
  selectedImageIndex: { type: Number },      // Keep for old orders
  variantId: { type: String, trim: true },   // NEW
  selectedSize: { type: String },
  // ... rest unchanged
})
```

**Testing**:
- [ ] Model compiles
- [ ] Old orders still load correctly
- [ ] New orders can include variantId

---

### Phase 2 Completion Checklist

- [ ] All inventory helper functions updated
- [ ] Functions accept variantId as primary parameter
- [ ] Backward compatibility with imageIndex maintained
- [ ] Admin stock page updated to use variantId
- [ ] Stock API endpoints updated
- [ ] Order model updated (optional variantId field)
- [ ] Unit tests written for helper functions
- [ ] Integration tests pass
- [ ] Staging deployment successful
- [ ] Manual testing of stock operations

**Estimated Duration**: 5 days

---

## PHASE 3: Frontend Migration (Week 2, Days 8-10)

### Objective
Update cart stores and product pages to use `variantId` while maintaining backward compatibility.

### 3.1 Update Online Cart Store

**File**: `lib/cart-store.ts`

**Changes**:

```typescript
export interface CartItem {
  id: string
  slug: string
  name: string
  price: number
  wholesalePrice?: number
  wholesaleThreshold?: number
  image: string
  quantity: number
  selectedSize?: string
  selectedImage?: string
  imageIndex: number       // KEEP for backward compat
  variantId?: string       // NEW: Add this
  sku?: string
  groupId?: string
  branchId?: string
  addedAt: string
}

// UPDATE: addItem function
addItem: (newItem, maxStock?) => {
  const items = get().items
  
  // Primary match: same product + same variantId + same size
  let existingItemIndex = items.findIndex(
    (item) =>
      item.id === newItem.id &&
      (
        // Prefer variantId matching (both must have variantId)
        (item.variantId && newItem.variantId && item.variantId === newItem.variantId) ||
        // Fallback to imageIndex matching (for old cart items)
        (!item.variantId && !newItem.variantId && item.imageIndex === newItem.imageIndex)
      ) &&
      item.selectedSize === newItem.selectedSize
  )

  // Secondary match: same product + same groupId + same size (if no variantId match)
  if (existingItemIndex === -1 && newItem.groupId && !newItem.variantId) {
    existingItemIndex = items.findIndex(
      (item) =>
        item.id === newItem.id &&
        item.groupId === newItem.groupId &&
        item.selectedSize === newItem.selectedSize &&
        !item.variantId  // Only match old items without variantId
    )
  }

  if (existingItemIndex > -1) {
    // Update quantity if item exists
    const existingItem = items[existingItemIndex]
    const newTotalQuantity = existingItem.quantity + newItem.quantity
    
    if (maxStock !== undefined && newTotalQuantity > maxStock) {
      throw new Error(`Only ${maxStock} items available in stock`)
    }
    
    set((state) => ({
      items: state.items.map((item, index) =>
        index === existingItemIndex
          ? { 
              ...item, 
              quantity: newTotalQuantity,
              // Upgrade old items: add variantId if new item has it
              variantId: newItem.variantId || item.variantId
            }
          : item
      ),
    }))
  } else {
    // Validate new item quantity
    if (maxStock !== undefined && newItem.quantity > maxStock) {
      throw new Error(`Only ${maxStock} items available in stock`)
    }
    
    // Add new item
    set((state) => ({
      items: [
        ...state.items,
        {
          ...newItem,
          addedAt: new Date().toISOString(),
        },
      ],
    }))
  }
},

// UPDATE: validateCartStock
validateCartStock: async () => {
  const items = get().items
  const updates: { index: number; maxStock: number }[] = []
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    try {
      const response = await fetch(`/api/products/${item.slug}`)
      if (!response.ok) continue
      
      const { product } = await response.json()
      
      // Calculate available stock based on variant
      let availableStock = product.stockQuantity || 0
      
      // If product has variants, check specific variant stock
      if (product.images && product.images.length > 0) {
        let variantImage
        
        // Prefer variantId lookup
        if (item.variantId) {
          variantImage = product.images.find(img => img.variantId === item.variantId)
        }
        // Fallback to imageIndex
        else if (item.imageIndex !== undefined) {
          variantImage = product.images[item.imageIndex]
        }
        
        if (variantImage?.stock !== undefined) {
          availableStock = variantImage.stock
        }
      }
      
      if (item.quantity > availableStock) {
        updates.push({ index: i, maxStock: availableStock })
      }
    } catch (error) {
      console.error(`Failed to validate stock for ${item.name}:`, error)
    }
  }
  
  // Auto-adjust quantities
  updates.forEach(({ index, maxStock }) => {
    if (maxStock === 0) {
      get().removeItem(index)
    } else {
      get().updateQuantity(index, maxStock)
    }
  })
  
  return updates.length
},
```

**Testing**:
- [ ] Cart stores items with variantId
- [ ] Old cart items without variantId still work
- [ ] Matching logic prefers variantId
- [ ] Stock validation works with both variantId and imageIndex

---

### 3.2 Update POS Cart Store

**File**: `lib/pos/cart-store.ts`

**Changes**:

```typescript
export interface PosCartItem {
  id: string
  productId: string
  productName: string
  itemCode?: string
  sku?: string
  selectedImageIndex: number    // KEEP for backward compat
  variantId?: string            // NEW: Add this
  selectedImageUrl: string
  selectedSize?: string
  quantity: number
  retailUnitPrice: number
  wholesaleUnitPrice?: number
  originalUnitPrice: number
  actualUnitPrice: number
  lineDiscountType?: 'percent' | 'fixed'
  lineDiscountValue?: number
  lineDiscountMinor: number
  lineSubtotalMinor: number
  lineTotalMinor: number
  pricingMode: 'retail' | 'wholesale'
  priceOverride?: number
  priceOverrideReason?: string
  addedBy?: string
  addedAt: string
  branchId: string
  branchCode: string
  branchStockId: string
  vendorId: string
  vendorCode: string
}

// UPDATE: addItem function
addItem: (newItem) => {
  const totals = calcLineTotals(newItem)
  const item: PosCartItem = { ...newItem, ...totals, addedAt: new Date().toISOString() }
  const items = get().items
  
  // Match by variantId (preferred) or selectedImageIndex (fallback)
  const idx = items.findIndex(
    i =>
      i.productId === item.productId &&
      (
        // Prefer variantId matching
        (i.variantId && item.variantId && i.variantId === item.variantId) ||
        // Fallback to imageIndex matching
        (!i.variantId && !item.variantId && i.selectedImageIndex === item.selectedImageIndex)
      ) &&
      i.selectedSize === item.selectedSize &&
      i.branchId === item.branchId &&
      i.vendorId === item.vendorId
  )
  
  if (idx >= 0) {
    const updated = { ...items[idx], quantity: items[idx].quantity + item.quantity }
    const newTotals = calcLineTotals(updated)
    set({
      items: items.map((it, i) => (i === idx ? { ...updated, ...newTotals } : it)),
    })
  } else {
    set({ items: [...items, item] })
  }
},

// UPDATE: loadHeldOrder
loadHeldOrder: (data) =>
  set({
    items: data.items.map(item => ({
      ...item,
      // Ensure backward compatibility
      branchId: item.branchId || '',
      branchCode: item.branchCode || '',
      branchStockId: item.branchStockId || '',
      variantId: item.variantId || undefined,  // NEW: Preserve variantId
    })),
    pricingMode: data.pricingMode,
    cartDiscountType: data.cartDiscountType,
    cartDiscountValue: data.cartDiscountValue,
    cartDiscountReason: data.cartDiscountReason,
    customer: data.customer || null,
    notes: data.notes || '',
  }),
```

**Testing**:
- [ ] POS cart stores items with variantId
- [ ] Item matching works with variantId
- [ ] Held orders preserve variantId
- [ ] Backward compatibility maintained

---

### 3.3 Update Product Page Client

**File**: `app/product/[slug]/product-page-client.tsx`

**Changes**:

```typescript
// In handleAddToCart function:
const handleAddToCart = () => {
  const images = product.images || []

  // ... validation logic (unchanged)

  const selectedImage = images[selectedImageIndex]
  const selectedImageUrl = selectedImage?.url ?? '/placeholder.svg'
  const selectedVariantId = selectedImage?.variantId  // NEW: Extract variantId

  setAddingToCart(true)

  const wsPrice = activeImage()?.wholesalePrice ?? product.wholesalePrice
  const wsThreshold = activeImage()?.wholesaleThreshold ?? product.wholesaleThreshold

  try {
    addItem({
      id: product._id || '',
      slug: product.slug,
      name: product.name,
      price: unitPrice(),
      wholesalePrice: wsPrice,
      wholesaleThreshold: wsThreshold,
      image: selectedImageUrl,
      quantity,
      selectedSize: selectedSize || undefined,
      selectedImage: images.length > 1 ? selectedImageUrl : undefined,
      imageIndex: selectedImageIndex,              // Keep for backward compat
      variantId: selectedVariantId || undefined,   // NEW: Add variantId
      sku: selectedImage?.sku,
      groupId: selectedImage?.groupId,
      branchId: (product as any).branchId?.toString() || undefined,
    }, stock > 0 ? stock : undefined)

    setTimeout(() => {
      setAddingToCart(false)
      const detail = [
        images.length > 1 ? `Design ${selectedImageIndex + 1}` : '',
        selectedSize,
      ].filter(Boolean).join(' · ')
      toast.success(`${product.name}${detail ? ` (${detail})` : ''} added to cart!`)
    }, 400)
  } catch (error: any) {
    setAddingToCart(false)
    toast.error(error.message || 'Failed to add to cart')
  }
}
```

**Testing**:
- [ ] Product page adds variantId to cart
- [ ] Cart stores both imageIndex and variantId
- [ ] Add to cart functionality works

---

### 3.4 Update POS Stock Selection Page

**File**: `app/pos/stock/page.tsx` (or wherever POS adds items)

**Changes**:

```typescript
// When adding item to POS cart, include variantId:
const selectedVariant = product.images[selectedImageIndex]

usePosCartStore.getState().addItem({
  // ... existing fields
  selectedImageIndex: selectedImageIndex,   // Keep
  variantId: selectedVariant.variantId,     // NEW: Add this
  // ... rest of fields
})
```

**Testing**:
- [ ] POS adds variantId when selecting variant
- [ ] Cart operations work correctly

---

### Phase 3 Completion Checklist

- [ ] Online cart store updated
- [ ] POS cart store updated
- [ ] Product page client updated
- [ ] Cart matching logic uses variantId
- [ ] Backward compatibility maintained
- [ ] TypeScript compiles without errors
- [ ] Cart operations tested manually
- [ ] Old cart items still work
- [ ] New cart items include variantId
- [ ] Staging deployment successful

**Estimated Duration**: 3 days

---

## PHASE 4: Testing & Validation (Week 2-3, Days 11-14)

### Objective
Comprehensive testing to ensure all functionality works correctly with variantId.

### 4.1 Unit Tests

**File**: `tests/unit/variant-id.test.ts` (NEW FILE)

```typescript
import { describe, test, expect } from '@jest/globals'
import { generateVariantId, isValidVariantId } from '@/lib/generate-variant-id'

describe('Variant ID Generator', () => {
  test('generates valid format', () => {
    const id = generateVariantId()
    expect(isValidVariantId(id)).toBe(true)
  })

  test('generates unique IDs', () => {
    const ids = new Set()
    for (let i = 0; i < 1000; i++) {
      const id = generateVariantId()
      expect(ids.has(id)).toBe(false)
      ids.add(id)
    }
  })

  test('validates correct format', () => {
    expect(isValidVariantId('var_abc1234567')).toBe(true)
    expect(isValidVariantId('var_0000000000')).toBe(true)
  })

  test('rejects invalid format', () => {
    expect(isValidVariantId('invalid')).toBe(false)
    expect(isValidVariantId('var_')).toBe(false)
    expect(isValidVariantId('var_ABC123')).toBe(false) // uppercase not allowed
    expect(isValidVariantId('var_123')).toBe(false) // too short
  })
})
```

**File**: `tests/unit/branch-inventory.test.ts` (NEW FILE)

```typescript
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import BranchStock from '@/models/BranchStock'
import Branch from '@/models/Branch'
import { 
  getTotalProductStock, 
  getBranchStock,
  addBranchStock,
  deductBranchStock
} from '@/lib/branch-inventory'
import { generateVariantId } from '@/lib/generate-variant-id'

describe('Branch Inventory with VariantId', () => {
  let testProduct: any
  let testBranch: any
  let testVendor: any
  let testVariantId: string

  beforeAll(async () => {
    await connectDB()
    
    // Create test data
    testVariantId = generateVariantId()
    
    testProduct = await Product.create({
      name: 'Test Product',
      slug: 'test-product-' + Date.now(),
      description: 'Test',
      sku: 'TEST-001',
      price: 1000,
      images: [{
        variantId: testVariantId,
        url: 'https://example.com/test.jpg'
      }],
      sizes: [],
      category: 'Test',
      categoryId: new mongoose.Types.ObjectId(),
      stockQuantity: 0,
      isActive: true
    })

    testBranch = await Branch.create({
      name: 'Test Branch',
      branchCode: 'TEST',
      isActive: true
    })

    const Vendor = mongoose.model('Vendor')
    testVendor = await Vendor.create({
      name: 'Test Vendor',
      vendorCode: 'VENDOR-TEST',
      isActive: true
    })
  })

  afterAll(async () => {
    // Cleanup
    await Product.deleteOne({ _id: testProduct._id })
    await Branch.deleteOne({ _id: testBranch._id })
    await BranchStock.deleteMany({ productId: testProduct._id })
    const Vendor = mongoose.model('Vendor')
    await Vendor.deleteOne({ _id: testVendor._id })
    await mongoose.connection.close()
  })

  test('addBranchStock with variantId', async () => {
    const result = await addBranchStock(
      testBranch._id,
      testProduct._id,
      testVendor._id,
      testVariantId,
      undefined,
      10
    )

    expect(result.success).toBe(true)
    expect(result.newQuantity).toBe(10)
  })

  test('getTotalProductStock with variantId', async () => {
    const stock = await getTotalProductStock(
      testProduct._id,
      testVariantId
    )

    expect(stock).toBe(10)
  })

  test('getBranchStock with variantId', async () => {
    const stock = await getBranchStock(
      testBranch._id,
      testProduct._id,
      testVariantId
    )

    expect(stock).toBe(10)
  })

  test('deductBranchStock with variantId', async () => {
    const result = await deductBranchStock(
      testBranch._id,
      testProduct._id,
      testVendor._id,
      testVariantId,
      undefined,
      5
    )

    expect(result.success).toBe(true)
    expect(result.newQuantity).toBe(5)
  })

  test('handles insufficient stock error', async () => {
    await expect(
      deductBranchStock(
        testBranch._id,
        testProduct._id,
        testVendor._id,
        testVariantId,
        undefined,
        10 // More than available (5)
      )
    ).rejects.toThrow('Insufficient stock')
  })
})
```

**Run tests**:
```bash
npm test -- variant-id
npm test -- branch-inventory
```

---

### 4.2 Integration Test Scenarios

**File**: `tests/integration/variant-id-migration.test.ts` (NEW FILE)

```typescript
import { describe, test, expect } from '@jest/globals'

describe('Variant ID Migration Integration Tests', () => {
  
  test('SCENARIO 1: Admin adds stock to variant', async () => {
    // 1. Admin selects product
    // 2. Admin selects variant by variantId (not index)
    // 3. Admin adds stock
    // 4. Stock is stored with variantId
    // 5. Stock query by variantId returns correct quantity
  })

  test('SCENARIO 2: Customer adds item to cart', async () => {
    // 1. Customer views product page
    // 2. Customer selects variant (image carousel)
    // 3. Customer adds to cart
    // 4. Cart stores item with variantId
    // 5. Cart matching uses variantId (not imageIndex)
  })

  test('SCENARIO 3: Checkout deducts stock', async () => {
    // 1. Customer has item with variantId in cart
    // 2. Customer proceeds to checkout
    // 3. System deducts stock using variantId
    // 4. Stock is deducted from correct variant
    // 5. Order stores variantId for historical reference
  })

  test('SCENARIO 4: Admin replaces variant image', async () => {
    // 1. Admin selects variant by variantId
    // 2. Admin uploads new image
    // 3. System updates imageUrl only (variantId unchanged)
    // 4. Existing BranchStock records unaffected
    // 5. Existing cart items still reference correct variant
  })

  test('SCENARIO 5: Admin reorders images', async () => {
    // 1. Admin drags images to reorder
    // 2. Array positions change
    // 3. variantIds remain unchanged
    // 4. BranchStock queries still work (use variantId not index)
    // 5. Cart items still reference correct variants
  })

  test('SCENARIO 6: Backward compatibility - old cart items', async () => {
    // 1. Cart has old item with imageIndex (no variantId)
    // 2. System looks up variantId from product.images[imageIndex]
    // 3. Cart matching works correctly
    // 4. Checkout succeeds
    // 5. Order created with variantId
  })

  test('SCENARIO 7: POS sale with variant', async () => {
    // 1. Cashier selects product
    // 2. Cashier selects variant
    // 3. Item added to POS cart with variantId
    // 4. Sale completed
    // 5. Stock deducted using variantId
    // 6. Order stores variantId
  })

  test('SCENARIO 8: Multi-branch stock query', async () => {
    // 1. Product has variants in multiple branches
    // 2. Query total stock for specific variantId
    // 3. System aggregates across all branches
    // 4. Returns correct total
  })
})
```

---

### 4.3 Manual Testing Checklist

#### Cart Operations
- [ ] Add product with variant to cart (online)
- [ ] Add same variant again (quantity increases)
- [ ] Add different variant (separate line item)
- [ ] Remove item from cart
- [ ] Update quantity in cart
- [ ] Cart persists after page refresh
- [ ] Old cart items (pre-migration) still work

#### POS Operations
- [ ] Add product variant to POS cart
- [ ] Complete sale with variant
- [ ] Stock deducted correctly
- [ ] Receipt shows correct variant info
- [ ] Held order with variants saved/restored

#### Stock Management
- [ ] Admin adds stock to specific variant
- [ ] Admin views stock by variant
- [ ] Stock query shows correct quantities
- [ ] Low-stock alerts work by variant
- [ ] Stock reports accurate

#### Admin Product Editing
- [ ] Replace variant image (URL updated, variantId unchanged)
- [ ] Reorder variant images (positions change, variantIds unchanged)
- [ ] Delete variant (BranchStock records cleaned up)
- [ ] Add new variant (new variantId generated)

#### Order Processing
- [ ] Create order with variants
- [ ] Order stores variantId
- [ ] Stock deducted from correct variant
- [ ] Order history displays correct variant
- [ ] Old orders (pre-migration) still display

---

### 4.4 Data Consistency Validation Script

**File**: `scripts/migrations/variant-id/validate-consistency.ts` (NEW FILE)

```typescript
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import BranchStock from '@/models/BranchStock'
import { isValidVariantId } from '@/lib/generate-variant-id'

async function validateConsistency() {
  console.log('🔍 Validating data consistency...\n')
  
  await connectDB()
  
  const issues: any[] = []
  
  // Check 1: BranchStock variantIds exist in products
  console.log('1️⃣  Checking BranchStock → Product references...')
  
  const branchStocks = await BranchStock.find({})
  const productCache = new Map()
  
  for (const stock of branchStocks) {
    if (!stock.variantId) continue
    
    // Load product (with caching)
    if (!productCache.has(stock.productId.toString())) {
      const product = await Product.findById(stock.productId).select('images').lean()
      productCache.set(stock.productId.toString(), product)
    }
    
    const product = productCache.get(stock.productId.toString())
    
    if (!product) {
      issues.push({
        type: 'ORPHANED_STOCK',
        stockId: stock._id,
        productId: stock.productId,
        message: 'BranchStock references non-existent product'
      })
      continue
    }
    
    const variant = product.images.find((img: any) => img.variantId === stock.variantId)
    
    if (!variant) {
      issues.push({
        type: 'INVALID_VARIANT_REF',
        stockId: stock._id,
        productId: stock.productId,
        variantId: stock.variantId,
        message: 'BranchStock variantId not found in product'
      })
    }
  }
  
  console.log(`   Checked ${branchStocks.length} BranchStock records`)
  
  // Check 2: No duplicate variantIds across different products
  console.log('2️⃣  Checking for duplicate variantIds across products...')
  
  const allVariantIds = new Map()
  const products = await Product.find({}).select('images').lean()
  
  for (const product of products) {
    for (const image of product.images) {
      if (!image.variantId) continue
      
      if (allVariantIds.has(image.variantId)) {
        issues.push({
          type: 'DUPLICATE_VARIANT_ID',
          variantId: image.variantId,
          productId1: allVariantIds.get(image.variantId),
          productId2: product._id,
          message: 'VariantId used in multiple products'
        })
      } else {
        allVariantIds.set(image.variantId, product._id)
      }
    }
  }
  
  console.log(`   Checked ${allVariantIds.size} unique variantIds`)
  
  // Check 3: All variantIds valid format
  console.log('3️⃣  Checking variantId formats...')
  
  let invalidFormatCount = 0
  for (const [variantId] of allVariantIds) {
    if (!isValidVariantId(variantId)) {
      invalidFormatCount++
      if (invalidFormatCount <= 10) {
        issues.push({
          type: 'INVALID_FORMAT',
          variantId,
          message: 'VariantId does not match expected format'
        })
      }
    }
  }
  
  if (invalidFormatCount > 0) {
    console.log(`   ❌ ${invalidFormatCount} invalid formats`)
  } else {
    console.log('   ✅ All formats valid')
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`)
  if (issues.length === 0) {
    console.log('✅ DATA CONSISTENCY VALIDATED - No issues found!')
  } else {
    console.log(`❌ FOUND ${issues.length} ISSUES`)
    console.log('\nFirst 20 issues:')
    console.log(JSON.stringify(issues.slice(0, 20), null, 2))
  }
  console.log('='.repeat(60))
  
  await mongoose.connection.close()
  
  return issues
}

// Run if called directly
if (require.main === module) {
  validateConsistency()
    .then((issues) => process.exit(issues.length === 0 ? 0 : 1))
    .catch((error) => {
      console.error('Validation failed:', error)
      process.exit(1)
    })
}

export default validateConsistency
```

**Run validation**:
```bash
npx tsx scripts/migrations/variant-id/validate-consistency.ts
```

---

### Phase 4 Completion Checklist

- [ ] Unit tests written and passing
- [ ] Integration tests written
- [ ] Manual testing checklist completed
- [ ] Data consistency validation passes
- [ ] No orphaned BranchStock records
- [ ] No duplicate variantIds
- [ ] All variantIds have valid format
- [ ] Cart operations work correctly
- [ ] Stock operations work correctly
- [ ] Admin operations work correctly
- [ ] POS operations work correctly
- [ ] Backward compatibility verified
- [ ] Performance benchmarks acceptable
- [ ] Test report documented

**Estimated Duration**: 4 days

---

## PHASE 5: Production Deployment (Week 3, Day 15)

### Objective
Deploy variantId migration to production environment safely.

### 5.1 Pre-Deployment Checklist

**Database**:
- [ ] Production database backed up
- [ ] Backup restoration tested
- [ ] Staging database matches production structure
- [ ] All validation scripts pass on staging

**Code**:
- [ ] All tests pass on CI/CD
- [ ] Code reviewed by team
- [ ] Merge `migration/variant-id` → `main`
- [ ] Tag release: `v1.x.x-variant-id`

**Team**:
- [ ] Deployment schedule communicated
- [ ] Team available for monitoring
- [ ] Rollback procedure reviewed
- [ ] On-call engineer assigned

**Monitoring**:
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Performance monitoring ready
- [ ] Log aggregation working
- [ ] Alerts configured

---

### 5.2 Deployment Steps

**Step 1: Database Migration** (Maintenance window recommended)

```bash
# 1. Create production backup
mongodump --uri="mongodb://..." --out=./backup-pre-variant-id

# 2. Run migration scripts on production
npx tsx scripts/migrations/variant-id/01-add-variant-ids-to-products.ts
npx tsx scripts/migrations/variant-id/02-populate-branch-stock-variant-ids.ts

# 3. Validate migration
npx tsx scripts/migrations/variant-id/validate-phase1.ts

# If validation fails, restore backup:
# mongorestore --uri="mongodb://..." ./backup-pre-variant-id
```

**Step 2: Application Deployment**

```bash
# 1. Deploy backend code
git pull origin main
npm install
npm run build

# 2. Restart application servers
# (Use your deployment process: PM2, Docker, Kubernetes, etc.)

# 3. Run health checks
curl https://your-api.com/health

# 4. Smoke tests
# - Load homepage
# - Add item to cart
# - View admin stock page
```

**Step 3: Verification**

```bash
# Run consistency validation in production
npx tsx scripts/migrations/variant-id/validate-consistency.ts

# Check logs for errors
tail -f /var/log/app/error.log

# Monitor error rates
# (Check your monitoring dashboard)
```

---

### 5.3 Post-Deployment Monitoring (First 24 Hours)

**Metrics to Watch**:
- [ ] Error rate (should not spike)
- [ ] Cart operations success rate
- [ ] Checkout completion rate
- [ ] Stock query performance
- [ ] Database query latency
- [ ] Server CPU/memory usage

**Critical Endpoints**:
- [ ] `/api/products/*` - Product pages loading
- [ ] `/api/cart` - Cart operations working
- [ ] `/api/checkout` - Checkout succeeding
- [ ] `/api/admin/products/stock/*` - Stock management working

**User Reports**:
- [ ] Monitor support channels for issues
- [ ] Check for cart-related complaints
- [ ] Watch for checkout failures

---

### 5.4 Rollback Procedure (If Needed)

**Trigger Rollback If**:
- Error rate > 5% increase
- Checkout failure rate > 2% increase
- Critical functionality broken
- Data corruption detected

**Rollback Steps**:

```bash
# 1. Revert application code
git revert <commit-hash>
git push origin main

# 2. Redeploy previous version
npm run build
# Restart servers

# 3. Restore database if needed (ONLY if data corrupted)
mongorestore --uri="mongodb://..." ./backup-pre-variant-id --drop

# 4. Verify rollback
# - Run smoke tests
# - Check error rates
# - Verify cart operations

# 5. Post-mortem
# - Document what went wrong
# - Identify fixes needed
# - Plan retry
```

**Note**: Database rollback should be **last resort** only. Code rollback should be sufficient since:
- Old code still supports `imageIndex`
- `variantId` fields are just unused (not harmful)
- No destructive operations performed

---

### Phase 5 Completion Checklist

- [ ] Production backup created
- [ ] Migration scripts executed on production
- [ ] Validation passes in production
- [ ] Application deployed successfully
- [ ] Health checks pass
- [ ] Smoke tests pass
- [ ] No critical errors in logs
- [ ] Error rate normal
- [ ] Checkout rate normal
- [ ] Stock operations working
- [ ] Team monitoring for 24 hours
- [ ] Rollback procedure ready if needed

**Estimated Duration**: 1 day (deployment) + 1 day (monitoring)

---

## PHASE 6: Monitoring & Cleanup (Week 3, Days 16-21)

### Objective
Monitor production stability and optionally clean up deprecated code.

### 6.1 Week 1 Post-Deployment (Days 16-21)

**Daily Monitoring**:
- [ ] Check error logs for variantId-related issues
- [ ] Review cart operation metrics
- [ ] Monitor stock query performance
- [ ] Track checkout completion rate
- [ ] Review customer support tickets

**Logging Additions** (Temporary):

**File**: `lib/branch-inventory.ts`

```typescript
// Add logging to track imageIndex fallback usage
async function resolveVariantId(
  productId: mongoose.Types.ObjectId | string,
  variantId?: string,
  imageIndex?: number
): Promise<string | null> {
  if (variantId) return variantId
  
  if (imageIndex !== undefined) {
    // LOG: Track fallback usage
    console.warn('[MIGRATION] Fallback to imageIndex:', {
      productId: productId.toString(),
      imageIndex,
      timestamp: new Date().toISOString()
    })
    
    const product = await Product.findById(productId).select('images').lean()
    if (product && product.images[imageIndex]) {
      return product.images[imageIndex].variantId || null
    }
  }
  
  return null
}
```

**Metrics Dashboard**:
- Create dashboard tracking:
  - % of operations using variantId vs imageIndex
  - Stock query latency (before/after migration)
  - Cart operation success rate
  - Checkout completion rate

---

### 6.2 Optional Cleanup (After 2-3 Weeks Stable)

**⚠️ ONLY proceed with cleanup if**:
- Migration stable for 2-3 weeks
- Error rate normal
- < 1% operations using imageIndex fallback
- Team confident in migration success

#### 6.2.1 Update BranchStock to Require variantId

**File**: `models/BranchStock.ts`

```typescript
// Make variantId required (remove imageIndex dependency)
variantId: {
  type: String,
  required: true,    // Change from optional to required
  trim: true,
  index: true
}
```

#### 6.2.2 Remove imageIndex Fallback Logic

**File**: `lib/branch-inventory.ts`

```typescript
// Remove resolveVariantId function
// Remove imageIndex parameters from all functions
// Simplify queries to only use variantId

// Example: getBranchStock simplified
export async function getBranchStock(
  branchId: mongoose.Types.ObjectId | string,
  productId: mongoose.Types.ObjectId | string,
  variantId: string,            // Now required, no fallback
  selectedSize?: string,
  vendorId?: mongoose.Types.ObjectId | string
): Promise<number> {
  const query: any = { 
    branchId, 
    productId,
    variantId              // Direct usage, no fallback
  }
  
  if (selectedSize) query.selectedSize = selectedSize
  if (vendorId) query.vendorId = vendorId

  // ... rest unchanged
}
```

#### 6.2.3 Drop Old Database Index

```typescript
// Script: scripts/migrations/variant-id/cleanup-indexes.ts
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import BranchStock from '@/models/BranchStock'

async function cleanupIndexes() {
  await connectDB()
  
  // Drop old index with imageIndex
  await BranchStock.collection.dropIndex(
    'productId_1_branchId_1_vendorId_1_imageIndex_1_selectedSize_1'
  )
  
  console.log('✅ Old index dropped')
  
  await mongoose.connection.close()
}

cleanupIndexes().catch(console.error)
```

#### 6.2.4 Remove Logging

Remove temporary logging added in Phase 6.1.

---

### 6.3 Final Validation

**File**: `scripts/migrations/variant-id/final-validation.ts` (NEW FILE)

```typescript
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import BranchStock from '@/models/BranchStock'

async function finalValidation() {
  console.log('🎯 Final Validation - Variant ID Migration Complete\n')
  
  await connectDB()
  
  // Check 1: All BranchStock have variantId
  const stocksWithoutVariantId = await BranchStock.countDocuments({
    $or: [
      { variantId: { $exists: false } },
      { variantId: null },
      { variantId: '' }
    ]
  })
  
  console.log(`BranchStock without variantId: ${stocksWithoutVariantId}`)
  
  // Check 2: All Products have variantIds
  const productsWithoutVariantId = await Product.countDocuments({
    'images.variantId': { $exists: false }
  })
  
  console.log(`Products without variantId: ${productsWithoutVariantId}`)
  
  // Check 3: No orphaned records
  const branchStocks = await BranchStock.find({}).limit(1000)
  let orphaned = 0
  
  for (const stock of branchStocks) {
    const product = await Product.findById(stock.productId)
    if (!product) {
      orphaned++
      continue
    }
    
    const variant = product.images.find(img => img.variantId === stock.variantId)
    if (!variant) orphaned++
  }
  
  console.log(`Orphaned BranchStock records (sample): ${orphaned}`)
  
  // Summary
  if (stocksWithoutVariantId === 0 && productsWithoutVariantId === 0 && orphaned === 0) {
    console.log('\n✅ MIGRATION COMPLETE AND VALIDATED!')
    console.log('   All systems using variantId successfully.')
  } else {
    console.log('\n⚠️  Issues found - review before cleanup')
  }
  
  await mongoose.connection.close()
}

finalValidation().catch(console.error)
```

---

### Phase 6 Completion Checklist

- [ ] Production monitored for 1-2 weeks
- [ ] Error rates normal
- [ ] No customer complaints
- [ ] Fallback usage < 1%
- [ ] Team confident in migration
- [ ] Optional cleanup completed (if decided)
- [ ] Final validation passes
- [ ] Documentation updated
- [ ] Migration marked complete

**Estimated Duration**: 5 days (monitoring) + 1 day (optional cleanup)

---

## ROLLBACK PROCEDURES

### When to Rollback

**Immediate Rollback** (within 1 hour of deployment):
- Critical functionality broken
- Error rate > 10% increase
- Checkout completely failing
- Data corruption detected

**Planned Rollback** (within 24 hours):
- Error rate > 5% sustained increase
- Cart operations degraded
- Performance significantly worse
- Multiple customer complaints

### Rollback Steps

#### Level 1: Code Rollback ONLY (Recommended)

```bash
# 1. Revert to previous code version
git revert <commit-hash>
# OR
git reset --hard <previous-commit>
git push origin main --force

# 2. Redeploy
npm install
npm run build
# Restart servers

# 3. Verify
# - Test cart operations
# - Test checkout
# - Test stock management
# - Check error logs
```

**Result**:
- Application uses imageIndex again
- variantId fields in database unused (harmless)
- No data loss
- Can retry migration later after fixes

#### Level 2: Partial Database Rollback (If Level 1 insufficient)

```bash
# Remove variantId from BranchStock (keep in Product)
mongosh "mongodb://..."

use your_database
db.branchStocks.updateMany(
  {},
  { $unset: { variantId: "" } }
)
```

**Result**:
- BranchStock clean of variantId
- Products still have variantId (for future retry)
- Old code works fully

#### Level 3: Full Database Rollback (Last resort)

```bash
# Only if data corruption detected
mongorestore --uri="mongodb://..." ./backup-pre-variant-id --drop
```

**⚠️ WARNING**: Full database rollback loses:
- All data created after backup
- All orders placed after migration
- All stock changes after migration

**Use only if**: Data integrity compromised, no other option

---

### Post-Rollback Actions

- [ ] Document root cause of failure
- [ ] Identify specific bug or issue
- [ ] Create fix in development
- [ ] Test fix thoroughly in staging
- [ ] Plan retry timeline
- [ ] Communicate with stakeholders

---

## SUCCESS METRICS

### Technical Metrics

**Pre-Migration Baseline**:
- Average stock query time
- Cart operation success rate
- Checkout completion rate
- Error rate

**Post-Migration Targets**:
- Stock query time: ≤ baseline ± 10%
- Cart operation success rate: ≥ baseline
- Checkout completion rate: ≥ baseline
- Error rate: ≤ baseline + 1%

### Business Metrics

- No increase in customer complaints
- No decrease in conversion rate
- No increase in cart abandonment rate

### Code Quality Metrics

- Reduced complexity in image replacement logic
- Fewer workarounds needed for variant operations
- Cleaner codebase (measured by lines of code in admin)

---

## TEAM RESPONSIBILITIES

### Backend Developer
- Schema updates (Product, BranchStock)
- Migration scripts (01, 02)
- Inventory helper functions update
- API endpoint updates
- Unit tests for backend

### Frontend Developer
- Cart store updates (online + POS)
- Product page client update
- Admin UI updates
- Integration with new backend APIs
- Frontend testing

### QA Engineer
- Test plan creation
- Manual testing execution
- Integration test scenarios
- Validation script execution
- Bug reporting

### DevOps Engineer
- Staging environment setup
- Deployment automation
- Monitoring dashboard setup
- Database backup procedures
- Rollback procedure testing

---

## COMMUNICATION PLAN

### Pre-Migration
- **Team meeting**: Review entire plan
- **Stakeholder update**: Timeline and impact
- **User notification**: None needed (transparent migration)

### During Migration
- **Daily standups**: Progress updates
- **Slack channel**: Real-time communication
- **Issue tracking**: Jira/GitHub issues

### Post-Migration
- **Team retrospective**: What went well, what to improve
- **Stakeholder report**: Success metrics
- **Documentation**: Update wiki/docs

---

## DOCUMENTATION UPDATES

### Files to Update

1. **README.md**: Add note about variant ID system
2. **API docs**: Update endpoint parameters (imageIndex → variantId)
3. **Admin guide**: Update stock management instructions
4. **Developer onboarding**: Explain variant ID architecture
5. **Database schema docs**: Document new fields

### Code Comments

Add comments in key files:
```typescript
/**
 * IMPORTANT: Variants are identified by stable `variantId` (not array position)
 * - variantId format: var_xxxxxxxxxx (11 chars)
 * - Persists across image replacements and reordering
 * - Used for stock tracking, cart items, and orders
 */
```

---

## ESTIMATED TOTAL EFFORT

| Phase | Duration | Team Required |
|-------|----------|---------------|
| Phase 1: Schema Extension | 2 days | Backend Dev |
| Phase 2: Backend Migration | 5 days | Backend Dev |
| Phase 3: Frontend Migration | 3 days | Frontend Dev |
| Phase 4: Testing & Validation | 4 days | QA Engineer + Team |
| Phase 5: Production Deployment | 2 days | Full Team |
| Phase 6: Monitoring & Cleanup | 5 days | Full Team |
| **TOTAL** | **21 days (3 weeks)** | 1 Backend, 1 Frontend, 1 QA |

---

## CONCLUSION

This implementation plan provides a **safe, phased approach** to migrating from `imageIndex` to `variantId`. Key principles:

1. **Backward compatibility**: Old code works during transition
2. **Gradual rollout**: Test each phase before proceeding
3. **Safe rollback**: Can revert at any point without data loss
4. **Comprehensive testing**: Validate every step
5. **Clear responsibilities**: Each team member knows their tasks

**Next Steps**:
1. Review this plan with team
2. Get stakeholder approval
3. Create tickets for each phase
4. Set start date
5. Begin Phase 1!

---

## APPENDIX: Quick Reference

### Key Files Modified

**Models**:
- `models/Product.ts` - Add variantId to IProductImage
- `models/BranchStock.ts` - Add variantId field
- `models/Order.ts` - Add optional variantId to order items

**Libraries**:
- `lib/generate-variant-id.ts` - NEW: Variant ID generator
- `lib/branch-inventory.ts` - Update all functions for variantId
- `lib/cart-store.ts` - Update cart matching logic
- `lib/pos/cart-store.ts` - Update POS cart matching

**Pages**:
- `app/product/[slug]/product-page-client.tsx` - Pass variantId to cart
- `app/admin/products/[id]/stock/page.tsx` - Select by variantId

**Scripts**:
- `scripts/migrations/variant-id/01-add-variant-ids-to-products.ts`
- `scripts/migrations/variant-id/02-populate-branch-stock-variant-ids.ts`
- `scripts/migrations/variant-id/validate-phase1.ts`
- `scripts/migrations/variant-id/validate-consistency.ts`
- `scripts/migrations/variant-id/final-validation.ts`

### Commands

```bash
# Install dependencies
npm install nanoid

# Run migrations (staging first!)
npx tsx scripts/migrations/variant-id/01-add-variant-ids-to-products.ts
npx tsx scripts/migrations/variant-id/02-populate-branch-stock-variant-ids.ts

# Validate
npx tsx scripts/migrations/variant-id/validate-phase1.ts
npx tsx scripts/migrations/variant-id/validate-consistency.ts

# Run tests
npm test -- variant-id
npm test -- branch-inventory

# Final validation
npx tsx scripts/migrations/variant-id/final-validation.ts
```

### Emergency Contacts

- **Tech Lead**: [Name] - [Contact]
- **Backend Lead**: [Name] - [Contact]
- **DevOps**: [Name] - [Contact]
- **On-call**: [Rotation schedule]

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Status**: Ready for Review
