# Phase 2 Progress: Admin Interfaces

## ✅ Completed Items

### 1. ✅ Updated Branch Inventory Helpers (`lib/branch-inventory.ts`)

**Changes:**
- Added `vendorId` parameter to all stock operations
- Updated `BranchStockInfo` interface to include vendor details
- Added new helper functions for vendor operations

**New Functions:**
```typescript
getActiveVendors()  // Get all active vendors
getHouseVendor()    // Get the House Stock vendor
```

**Updated Functions:**
```typescript
// Now requires vendorId
addBranchStock(branchId, productId, vendorId, imageIndex, selectedSize, quantity, session)

// Now supports optional vendorId for specific vendor stock
getBranchStock(branchId, productId, imageIndex, selectedSize, vendorId?)

// Now vendor-specific
deductBranchStock(branchId, productId, vendorId, imageIndex, selectedSize, quantity, session)

// Now requires vendorId
updateBranchStock(branchId, productId, vendorId, imageIndex, selectedSize, quantityChange, session)

// Now returns vendor information
getProductBranchStocks(productId, imageIndex?, selectedSize?)
// Returns: { branchId, branchCode, branchName, vendorId, vendorCode, vendorName, quantity, ... }
```

---

### 2. ✅ Updated Add Stock API (`app/api/admin/products/add-stock/route.ts`)

**Changes:**
- Added `vendorId` to request interface (required)
- Added vendor existence and active status validation
- Updated ledger entries to include vendor information
- Passes vendor ID to `addBranchStock()`

**Request Format:**
```json
{
  "productId": "...",
  "branchId": "...",
  "vendorId": "...",  // NEW: Required
  "imageIndex": 0,
  "selectedSize": "M",
  "quantity": 10,
  "notes": "Adding stock"
}
```

**Validation:**
- ✅ Vendor exists
- ✅ Vendor is active
- ✅ Branch exists and active
- ✅ Product exists and active

**Ledger Entry:**
- Includes `vendorId`, `vendorCode`, `vendorName` in metadata

---

### 3. ✅ Updated Product Creation API (`app/api/products/route.ts`)

**Changes:**
- Added `vendorId` validation (required)
- Added vendor existence and active status check
- Updated BranchStock creation to include `vendorId`

**Request Body Changes:**
```typescript
{
  // ... existing fields
  branchId: string,    // Required
  vendorId: string,    // NEW: Required
  initialStock: number // Stock for selected branch + vendor
}
```

**Validation:**
- ✅ Vendor must be selected
- ✅ Vendor must exist and be active
- ✅ Branch must be selected
- ✅ Branch must exist and be active

**BranchStock Creation:**
- All initial stock assigned to selected branch + vendor
- Handles image-level stock
- Handles size-level stock
- Falls back to product-level initial stock

---

### 4. ✅ Updated Add Product UI (`app/admin/products/new/page.tsx`)

**Changes:**
- Added vendor state management
- Added `fetchVendors()` function
- Auto-selects House Stock vendor if available
- Updated form data to include `vendorId`
- Updated validation to require vendor
- Updated UI section title and descriptions

**UI Changes:**
```tsx
<h2>Branch & Vendor Selection</h2>

<div>Branch *</div>
<Select value={branchId} onChange={...}>
  // Branch options
</Select>
<p>Physical location where initial stock will be stored.</p>

<div>Vendor (Stock Owner) *</div>
<Select value={vendorId} onChange={...}>
  // Vendor options (House Stock shown first)
</Select>
<p>Who owns this inventory. Initial stock will belong to this vendor.</p>
```

**Vendor Auto-Selection:**
- House Stock vendor auto-selected if available
- Prevents needing to manually select for most products

**Stock Label Updated:**
```
"Initial Stock * (for selected branch + vendor)"
```

---

### 5. ✅ Created Vendor Management APIs

**Files Created:**
- `app/api/admin/vendors/route.ts` - List & Create
- `app/api/admin/vendors/[id]/route.ts` - Get, Update, Delete

#### GET /api/admin/vendors
```typescript
// Query params
?activeOnly=true  // Optional: filter to active vendors only

// Response
{
  vendors: [
    {
      _id, name, vendorCode, phone, email,
      isActive, isHouseStock, notes,
      createdAt, updatedAt
    }
  ],
  total: number
}
```

**Sorting:**
- House Stock vendor first
- Then alphabetically by name

#### POST /api/admin/vendors
```typescript
// Request
{
  name: string,         // Required
  vendorCode: string,   // Required (will be uppercased)
  phone?: string,
  email?: string,
  notes?: string
}

// Response
{
  success: true,
  vendor: { ... }
}
```

**Validation:**
- Vendor code must be unique
- Email format validated
- Vendor code format validated (alphanumeric + underscore/hyphen)

#### PUT /api/admin/vendors/[id]
**Protection:**
- ❌ Cannot change `isHouseStock` flag
- ❌ Cannot change vendor code for House Stock vendor
- ✅ Can update name, phone, email, notes, isActive

#### DELETE /api/admin/vendors/[id]
**Protection:**
- ❌ Cannot delete House Stock vendor
- ❌ Cannot delete vendors with inventory records
- ❌ Cannot delete vendors with sales history
- ✅ Suggests deactivation instead

---

### 6. ✅ Updated Order Model (`models/Order.ts`)

**Interface Changes:**
```typescript
interface IOrderItem {
  // ... existing fields
  branchId?: mongoose.Types.ObjectId
  branchCode?: string
  branchStockId?: string
  vendorId?: mongoose.Types.ObjectId    // NEW
  vendorCode?: string                   // NEW
  groupId?: string
}
```

**Schema Changes:**
```typescript
OrderItemSchema {
  // ... existing fields
  branchId: { type: ObjectId, ref: 'Branch' },
  branchCode: String,
  branchStockId: String,
  vendorId: { type: ObjectId, ref: 'Vendor' },  // NEW
  vendorCode: String,                            // NEW
  groupId: String
}
```

**Purpose:**
- Track which vendor's stock was sold
- Enable vendor-specific sales reports
- Maintain historical vendor attribution

---

## 📋 Summary of Changes

### Files Created (New):
1. ✅ `app/api/admin/vendors/route.ts`
2. ✅ `app/api/admin/vendors/[id]/route.ts`
3. ✅ `PHASE_2_PROGRESS.md` (this file)

### Files Modified:
1. ✅ `lib/branch-inventory.ts` - Vendor-aware stock operations
2. ✅ `app/api/admin/products/add-stock/route.ts` - Vendor selection required
3. ✅ `app/api/products/route.ts` - Vendor selection required
4. ✅ `app/admin/products/new/page.tsx` - Vendor selector UI
5. ✅ `models/Order.ts` - Vendor tracking in order items

---

## 🎯 What Works Now

### ✅ Add New Product with Vendor
1. Admin selects Branch (e.g., Main Branch)
2. Admin selects Vendor (e.g., House Stock)
3. Admin sets initial stock quantity
4. **Result:** BranchStock created with `branchId` + `vendorId`

### ✅ Add Stock with Vendor
```
API: POST /api/admin/products/add-stock
Body: {
  productId, branchId, vendorId,
  imageIndex, selectedSize, quantity
}
```
- Validates vendor exists and active
- Creates/updates vendor-specific BranchStock
- Records vendor in ledger entry

### ✅ List Vendors
```
API: GET /api/admin/vendors
```
- Returns all vendors sorted by House Stock first
- Optional active-only filter

### ✅ Create Vendor
```
API: POST /api/admin/vendors
Body: { name, vendorCode, phone, email }
```
- Validates unique vendor code
- Auto-uppercase vendor code
- Email validation

### ✅ Update/Delete Vendor
- Protected operations
- Cannot delete House Stock
- Cannot delete vendors with history

---

## ⏳ Still TODO: Phase 3 - POS Implementation

### Next Steps:
1. Update POS page with branch context at top
2. Update variant selector with vendor selection
3. Update cart store to track vendorId
4. Update sale-service.ts for vendor-aware stock deduction
5. Update POS APIs to pass vendor information
6. Update reports to show vendor attribution

**Files to Modify Next:**
- `app/pos/make-sale/page.tsx` - Add branch context
- `components/pos/variant-selector.tsx` - Add vendor selection
- `lib/pos/cart-store.ts` - Track vendorId in cart items
- `lib/pos/sale-service.ts` - Vendor-aware deduction
- `app/api/pos/products/branch-stock/route.ts` - Return vendor options
- `app/api/pos/sales/complete/route.ts` - Validate vendor

---

## 🧪 Testing Phase 2

### Test 1: Create Product with Vendor
```bash
# Prerequisites
1. Run migration script (creates House Stock vendor)
2. Ensure at least one active branch exists

# Test Steps
1. Go to /admin/products/new
2. Verify "Branch & Vendor Selection" section exists
3. Verify Branch dropdown populated
4. Verify Vendor dropdown populated
5. Verify House Stock auto-selected
6. Fill product form with stock quantity
7. Submit

# Expected Result
- Product created successfully
- BranchStock record has vendorId
- Stock shows in branch inventory
```

### Test 2: Add Stock with Vendor
```bash
# Test via API
POST /api/admin/products/add-stock
{
  "productId": "existing_product_id",
  "branchId": "branch_id",
  "vendorId": "house_vendor_id",
  "imageIndex": 0,
  "quantity": 10
}

# Expected Result
- Returns success: true
- BranchStock quantity increased
- Ledger entry created with vendor info
- Product.stockQuantity synced
```

### Test 3: List Vendors
```bash
GET /api/admin/vendors

# Expected Result
{
  vendors: [
    { name: "House Stock", isHouseStock: true, ... },
    { name: "Vendor A", isHouseStock: false, ... }
  ]
}

# House Stock appears first
```

### Test 4: Create Vendor
```bash
POST /api/admin/vendors
{
  "name": "Vendor John",
  "vendorCode": "JOHN",
  "phone": "+254712345678"
}

# Expected Result
- Vendor created
- vendorCode auto-uppercased
- isActive: true
- isHouseStock: false
```

### Test 5: Vendor Validation
```bash
# Try creating vendor without code
POST /api/admin/vendors
{ "name": "Test" }

# Expected: 400 error

# Try duplicate vendor code
POST /api/admin/vendors
{ "name": "Test", "vendorCode": "HOUSE" }

# Expected: 400 error "Vendor code already exists"
```

### Test 6: Delete Protection
```bash
# Try deleting House Stock vendor
DELETE /api/admin/vendors/{house_vendor_id}

# Expected: 400 error "Cannot delete house stock vendor"

# Try deleting vendor with inventory
DELETE /api/admin/vendors/{vendor_with_stock_id}

# Expected: 400 error "Cannot delete vendor with inventory records"
```

---

## 🔄 Database State After Phase 2

### Collections Updated:

#### vendors (NEW)
```javascript
{
  _id: ObjectId("..."),
  name: "House Stock",
  vendorCode: "HOUSE",
  isActive: true,
  isHouseStock: true,
  notes: "Default vendor for store-owned inventory",
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

#### branchstocks (UPDATED)
```javascript
// After migration
{
  _id: ObjectId("..."),
  productId: ObjectId("..."),
  branchId: ObjectId("..."),
  vendorId: ObjectId("..."),  // Added by migration
  imageIndex: 0,
  selectedSize: "M",
  stockIdentifier: "PROD-MAIN-IMG0-M",
  quantity: 10
}

// New products
{
  productId: ObjectId("..."),
  branchId: ObjectId("..."),
  vendorId: ObjectId("..."),  // Set during creation
  imageIndex: 0,
  quantity: 20
}
```

#### orders (SCHEMA UPDATED)
```javascript
// Future orders will include
{
  items: [{
    productId: ObjectId("..."),
    branchId: ObjectId("..."),
    vendorId: ObjectId("..."),  // NEW
    vendorCode: "HOUSE",        // NEW
    quantity: 1
  }]
}

// Historical orders remain valid (vendorId: undefined)
```

---

## 📊 API Endpoints Summary

### Vendor Management
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/admin/vendors` | List vendors | Admin |
| GET | `/api/admin/vendors?activeOnly=true` | List active vendors | Admin |
| POST | `/api/admin/vendors` | Create vendor | Admin |
| GET | `/api/admin/vendors/[id]` | Get vendor | Admin |
| PUT | `/api/admin/vendors/[id]` | Update vendor | Admin |
| DELETE | `/api/admin/vendors/[id]` | Delete vendor | Admin |

### Product Management (Updated)
| Method | Endpoint | Changes | Auth |
|--------|----------|---------|------|
| POST | `/api/products` | Now requires `vendorId` | Admin |
| POST | `/api/admin/products/add-stock` | Now requires `vendorId` | Admin |

---

## ⚠️ Breaking Changes

### API Changes:
1. **POST /api/products** - Now requires `vendorId` in request body
2. **POST /api/admin/products/add-stock** - Now requires `vendorId` in request body

### Migration Required:
- Run `node scripts/migrate-vendor-inventory.js` before using new features
- All existing BranchStock records assigned to House Stock vendor

### UI Changes:
- Add Product page now requires vendor selection
- Cannot create product without selecting vendor

---

## 🎉 Phase 2 Complete

**Status:** ✅ Admin interfaces updated for vendor support

**What's Working:**
- ✅ Vendors can be created/managed
- ✅ Products can be created with vendor assignment
- ✅ Stock can be added with vendor assignment
- ✅ Order model tracks vendor information
- ✅ All inventory helpers are vendor-aware

**What's Next:**
- Phase 3: POS Implementation (Items 7-12)
- Phase 4: Sale completion and stock deduction (Items 13-17)
- Phase 5: Reports and public ecommerce (Items 18-24)

**Ready for:** POS branch context and vendor selection implementation
