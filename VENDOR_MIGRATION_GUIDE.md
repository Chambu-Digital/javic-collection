# Vendor Inventory Migration Guide

## Overview

This guide covers the migration from branch-only inventory to vendor-owned inventory system.

**Critical:** Run this migration **BEFORE** using any vendor-aware features in the application.

---

## What Changed

### 1. Vendor Model (NEW)
- Created `models/Vendor.ts`
- Vendors represent stock owners
- Special "House Stock" vendor for store-owned inventory

### 2. BranchStock Model (UPDATED)
- Added `vendorId` field (required)
- Updated indexes to include `vendorId`
- Updated helper methods for vendor-aware queries

### 3. Stock Identity
**Before:**
```
Product + Image + Size + Branch = Stock Record
```

**After:**
```
Product + Image + Size + Branch + Vendor = Stock Record
```

---

## Migration Process

### Prerequisites

1. **Backup your database** before running migration
   ```bash
   mongodump --uri="your_mongodb_uri" --out=backup_before_vendor_migration
   ```

2. **Deploy updated models** to your environment
   - `models/Vendor.ts` (new)
   - `models/BranchStock.ts` (updated)

3. **Verify MongoDB connection** in `.env.local`

### Step 1: Run Migration Script

**Option A: Using Node.js (Recommended)**
```bash
node scripts/migrate-vendor-inventory.js
```

**Option B: Using TypeScript**
```bash
npx ts-node scripts/migrate-vendor-inventory.ts
```

### Step 2: Verify Migration

The script will output:
```
═══════════════════════════════════════════════════════
  MIGRATION SUMMARY
═══════════════════════════════════════════════════════
Status: ✅ SUCCESS
House Vendor Created: Yes
House Vendor ID: 507f1f77bcf86cd799439011
BranchStock Records Migrated: 150
BranchStock Records Skipped: 0
```

### Step 3: Validate in Database

**Check House Stock vendor exists:**
```javascript
db.vendors.findOne({ isHouseStock: true })
```

Should return:
```json
{
  "_id": "...",
  "name": "House Stock",
  "vendorCode": "HOUSE",
  "isActive": true,
  "isHouseStock": true,
  "notes": "Default vendor for store-owned inventory. Created by migration script."
}
```

**Check all BranchStock records have vendorId:**
```javascript
db.branchstocks.countDocuments({ vendorId: { $exists: false } })
```

Should return: `0`

**Check vendor assignment:**
```javascript
db.branchstocks.aggregate([
  {
    $group: {
      _id: "$vendorId",
      count: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: "vendors",
      localField: "_id",
      foreignField: "_id",
      as: "vendor"
    }
  }
])
```

---

## What the Migration Does

### 1. Creates House Stock Vendor

```javascript
{
  name: "House Stock",
  vendorCode: "HOUSE",
  isActive: true,
  isHouseStock: true,
  notes: "Default vendor for store-owned inventory. Created by migration script."
}
```

**Purpose:**
- Represents store-owned inventory
- Distinguishes from independent vendor inventory
- Cannot be deleted (only deactivated)

### 2. Updates Existing BranchStock Records

**Before:**
```javascript
{
  _id: "...",
  productId: "...",
  branchId: "...",
  imageIndex: 0,
  selectedSize: "M",
  stockIdentifier: "DRESS-001-MAIN-IMG0-M",
  quantity: 10
  // No vendorId
}
```

**After:**
```javascript
{
  _id: "...",
  productId: "...",
  branchId: "...",
  vendorId: "507f1f77bcf86cd799439011", // NEW: House Stock vendor
  imageIndex: 0,
  selectedSize: "M",
  stockIdentifier: "DRESS-001-MAIN-IMG0-M",
  quantity: 10
}
```

### 3. Preserves All Data

- ✅ No stock quantities changed
- ✅ No stock identifiers changed
- ✅ No branch assignments changed
- ✅ All existing inventory preserved
- ✅ Historical orders unchanged

---

## Post-Migration Verification

### Test 1: View Stock by Vendor

```javascript
// In MongoDB
db.branchstocks.aggregate([
  {
    $lookup: {
      from: "vendors",
      localField: "vendorId",
      foreignField: "_id",
      as: "vendor"
    }
  },
  {
    $lookup: {
      from: "branches",
      localField: "branchId",
      foreignField: "_id",
      as: "branch"
    }
  },
  {
    $project: {
      stockIdentifier: 1,
      quantity: 1,
      vendorName: { $arrayElemAt: ["$vendor.name", 0] },
      branchName: { $arrayElemAt: ["$branch.name", 0] }
    }
  },
  { $limit: 10 }
])
```

### Test 2: Check Index Creation

```javascript
db.branchstocks.getIndexes()
```

Should include:
```json
{
  "v": 2,
  "key": {
    "productId": 1,
    "branchId": 1,
    "vendorId": 1,
    "imageIndex": 1,
    "selectedSize": 1
  },
  "name": "productId_1_branchId_1_vendorId_1_imageIndex_1_selectedSize_1"
}
```

### Test 3: Query Vendor-Specific Stock

```javascript
// Get all stock for House Stock vendor
db.branchstocks.find({ 
  vendorId: ObjectId("your_house_vendor_id") 
}).count()
```

---

## Rollback Procedure

**If migration fails or needs to be rolled back:**

### Option 1: Restore from Backup
```bash
mongorestore --uri="your_mongodb_uri" --drop backup_before_vendor_migration
```

### Option 2: Manual Rollback
```javascript
// Remove vendorId from all BranchStock records
db.branchstocks.updateMany(
  {},
  { $unset: { vendorId: "" } }
)

// Delete House Stock vendor
db.vendors.deleteOne({ vendorCode: "HOUSE" })

// Drop new indexes (optional)
db.branchstocks.dropIndex("productId_1_branchId_1_vendorId_1_imageIndex_1_selectedSize_1")
```

**Warning:** Only rollback if no new vendor-aware operations have occurred.

---

## Troubleshooting

### Error: "Duplicate key error"

**Cause:** Stock identifier conflicts

**Solution:**
```javascript
// Find duplicates
db.branchstocks.aggregate([
  {
    $group: {
      _id: "$stockIdentifier",
      count: { $sum: 1 },
      ids: { $push: "$_id" }
    }
  },
  { $match: { count: { $gt: 1 } } }
])

// Resolve manually before re-running migration
```

### Error: "Branch not found"

**Cause:** BranchStock references deleted branch

**Solution:**
- Delete orphaned records, or
- Recreate missing branch, or
- Script skips automatically (logged as warning)

### Error: "Cannot connect to MongoDB"

**Cause:** Connection string incorrect

**Solution:**
```bash
# Check .env.local
MONGODB_URI=mongodb://...

# Test connection
mongosh "your_mongodb_uri"
```

---

## Next Steps After Migration

1. ✅ **Create additional vendors** (if needed)
   - Via admin panel (once implemented)
   - Or manually via MongoDB

2. ✅ **Test vendor-aware features**
   - Add stock with vendor selection
   - POS with vendor selection
   - Reports by vendor

3. ✅ **Monitor for issues**
   - Check logs for vendor-related errors
   - Verify stock deductions use correct vendor
   - Ensure reports aggregate correctly

4. ✅ **Document vendor workflows**
   - Train staff on vendor selection
   - Establish vendor management procedures
   - Define stock ownership policies

---

## Creating Additional Vendors

**After migration, create vendors for independent stock owners:**

### Via MongoDB:
```javascript
db.vendors.insertOne({
  name: "Vendor John",
  vendorCode: "JOHN",
  phone: "+254712345678",
  email: "john@example.com",
  isActive: true,
  isHouseStock: false,
  notes: "Independent vendor",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Via Admin API (once implemented):
```bash
POST /api/admin/vendors
{
  "name": "Vendor Mary",
  "vendorCode": "MARY",
  "phone": "+254798765432",
  "isActive": true
}
```

---

## Important Notes

### Stock Identifier Format

**NOT CHANGED by migration**

Current format remains: `SKU-BRANCHCODE-IMGn-SIZE`

Example: `DRESS-001-MAIN-IMG0-M`

**Why:** 
- Vendor is stored in database `vendorId` field
- Stock identifier doesn't need to encode everything
- Keeps identifiers shorter and more readable

### Multi-Vendor Same Product

**After migration, you can have:**

```
Blue Dress (Image 0, Size M) at Branch A:
├─ House Stock: 20 units
├─ Vendor John: 10 units
└─ Vendor Mary: 5 units

Total available at Branch A: 35 units
```

These are **separate stock pools** with different owners.

### House Stock vs Independent Vendors

**House Stock (`isHouseStock: true`):**
- Store-owned inventory
- Cannot be deleted
- Used for existing inventory
- Can be used for future store purchases

**Independent Vendors (`isHouseStock: false`):**
- Consignment or vendor-owned stock
- Can be deactivated/deleted (if no history)
- Tracked separately for vendor accounting

---

## Migration Script Details

**Location:** `scripts/migrate-vendor-inventory.js`

**What it does:**
1. Connects to MongoDB
2. Checks for existing House Stock vendor
3. Creates vendor if not exists
4. Finds all BranchStock without `vendorId`
5. Assigns House Stock vendor to each record
6. Validates migration success
7. Reports summary

**Safe to run multiple times:**
- Idempotent operation
- Skips already-migrated records
- Won't create duplicate vendors

**Logging:**
- Progress updates every 100 records
- Final summary with counts
- Error details if any failures

---

## Support

**Issues after migration?**

1. Check migration summary for errors
2. Verify MongoDB connection
3. Review application logs
4. Check BranchStock indexes created
5. Validate vendor queries working

**For rollback or critical issues:**
1. Stop application
2. Restore from backup
3. Contact development team

---

**Migration Prepared:** 2026-08-16  
**Script Version:** 1.0.0  
**Minimum MongoDB:** 4.0+
