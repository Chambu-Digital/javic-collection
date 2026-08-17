# INVENTORY + POS ARCHITECTURE AUDIT

**Date:** 2026-08-16  
**Purpose:** Pre-Vendor Implementation Investigation  
**Status:** Audit Only - No Code Modifications

---

## A. EXECUTIVE SUMMARY

The system currently implements a **dual-inventory architecture** where products can store stock in two places:

1. **Legacy Product-Level Stock**: `Product.stockQuantity` and per-image stock fields
2. **Branch Inventory System**: `BranchStock` collection with branch-specific stock tracking

### Current State
- **Branch system is ACTIVE and PRIMARY** for POS operations
- POS selects specific branch inventory when adding items to cart
- POS deducts from both BranchStock AND Product.stockQuantity during sales
- Products are created with branch selection and initial stock goes to BranchStock
- Public ecommerce uses Product.stockQuantity (not branch-aware)
- Orders store branch information at the ITEM level (not order level)

### Critical Finding
**DUAL DEDUCTION OCCURS**: When a POS sale completes, the system:
1. Deducts from `BranchStock` (via `deductBranchStock()`)
2. ALSO deducts from `Product.stockQuantity` and image-level stock (via `deductInventory()`)

This creates potential for stock inconsistencies if not carefully maintained.

---

## B. CURRENT DATA MODEL

### 1. Product Model (`models/Product.ts`)

```typescript
interface IProduct {
  _id?: string
  name: string
  slug: string
  sku?: string  // Product-level SKU
  
  // Pricing
  price: number
  wholesalePrice?: number
  wholesaleThreshold?: number
  
  // Images = Design Variants
  images: IProductImage[]
  
  // Default sizes
  sizes: string[]
  
  // Legacy stock fields (still active)
  stockQuantity: number
  inStock: boolean
  
  // Branch inventory migration flag
  branchInventoryEnabled?: boolean
  branchId?: mongoose.Types.ObjectId  // Product's "home" branch
  
  category: string
  categoryId: mongoose.Types.ObjectId
  // ... other fields
}

interface IProductImage {
  url: string
  groupId?: string  // Groups front/back/side views
  
  // Per-image overrides
  price?: number
  wholesalePrice?: number
  wholesaleThreshold?: number
  
  // Per-image stock (legacy but active)
  stock?: number
  sizes?: string[]
  sizeStock?: Record<string, number>  // { S: 5, M: 8, L: 3 }
  
  sku?: string  // Image-specific SKU
}
```

**Relationships:**
- Product has multiple images
- Each image can override pricing, sizes, and stock
- Each image can have per-size stock tracking
- Product.stockQuantity is calculated as sum of image stocks if images have stock defined

**Stock Storage Locations:**
1. `Product.stockQuantity` (number)
2. `Product.images[i].stock` (number)
3. `Product.images[i].sizeStock` (Record<string, number>)

---

### 2. Branch Model (`models/Branch.ts`)

```typescript
interface IBranch {
  _id?: string
  name: string
  branchCode: string  // Unique, uppercase (e.g., "MAIN", "BRANCH-A")
  location?: string
  address?: string
  isActive: boolean
  isMainBranch: boolean  // Only one main branch allowed
}
```

**Constraints:**
- `branchCode` must be unique
- Only ONE branch can have `isMainBranch: true`
- Branches cannot be deleted if they have inventory or sales history
- Inactive branches cannot receive new stock

**Current branches:** Unknown (database access not available)

---

### 3. BranchStock Model (`models/BranchStock.ts`)

```typescript
interface IBranchStock {
  _id?: string
  productId: mongoose.Types.ObjectId
  branchId: mongoose.Types.ObjectId
  imageIndex: number
  selectedSize?: string
  stockIdentifier: string  // Format: SKU-BRANCHCODE-IMGn[-SIZE]
  quantity: number
}
```

**Key Features:**
- Compound unique constraint on: `productId + branchId + imageIndex + selectedSize`
- `stockIdentifier` is globally unique
- Quantity cannot be negative (validated in pre-save hook)

**Stock Identifier Format:**
```
Examples:
- PROD-MAIN-IMG0
- DRESS001-BRANCH-A-IMG1-M
- SKU123-MAIN-IMG0
```

**Helper Methods:**
- `generateStockIdentifier(sku, branchCode, imageIndex, selectedSize?)`
- `findOrCreate(...)` - finds or creates branch stock record
- `getTotalStock(productId, imageIndex?, selectedSize?)` - sum across all branches
- `getStockByBranch(productId, branchId, imageIndex?, selectedSize?)`
- `getProductBranchStocks(productId, imageIndex?, selectedSize?)` - detailed breakdown

**Indexes:**
- `{ productId: 1, branchId: 1, imageIndex: 1, selectedSize: 1 }`
- `{ branchId: 1, quantity: 1 }`
- `{ stockIdentifier: 1 }` (unique)

---

### 4. Order Model (`models/Order.ts`)

```typescript
interface IOrder {
  orderNumber: string  // Auto-generated
  userId?: mongoose.Types.ObjectId
  customerEmail: string
  
  items: IOrderItem[]
  
  subtotal: number
  shippingCost: number
  discountAmount: number
  totalAmount: number
  
  status: 'pending' | 'completed' | 'cancelled' | ...
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: 'mpesa' | 'card' | 'bank_transfer' | 'cash_on_delivery' | 'cash' | 'credit' | 'split'
  
  // POS fields
  channel?: 'online' | 'pos'
  outletId?: mongoose.Types.ObjectId
  outletName?: string
  cashierId?: mongoose.Types.ObjectId
  cashierName?: string
  pricingMode?: 'retail' | 'wholesale'
  paymentAllocations?: IPaymentAllocation[]
  
  shippingAddress: IShippingAddress
}

interface IOrderItem {
  productId: mongoose.Types.ObjectId
  productName: string
  productImage: string
  selectedImage?: string
  selectedImageIndex?: number
  selectedSize?: string
  sku?: string
  quantity: number
  price: number
  totalPrice: number
  pricingMode?: 'retail' | 'wholesale'
  
  // BRANCH TRACKING (item-level, not order-level)
  branchId?: mongoose.Types.ObjectId
  branchCode?: string
  branchStockId?: string  // The stockIdentifier that was deducted
  
  // Image variant tracking
  groupId?: string
}
```

**CRITICAL: Branch Information is Stored PER ITEM, Not Per Order**

This means:
- A single order CAN contain items from multiple branches
- Each item knows which branch's stock was used
- No order-level branch field exists
- Reports must aggregate at the item level to get branch-specific sales

---

### 5. PosOutlet Model (`models/PosOutlet.ts`)

```typescript
interface IPosOutlet {
  name: string
  code: string  // Unique, uppercase
  address?: string
  phone?: string
  isActive: boolean
  isDefault: boolean
}
```

**Note:** PosOutlet is DIFFERENT from Branch:
- **Outlet** = Physical POS terminal/location/shop front
- **Branch** = Inventory ownership/storage location
- An outlet doesn't explicitly "belong to" a branch in current schema
- POS users select branch PER PRODUCT when adding to cart

---

### 6. LedgerEntry Model (`models/LedgerEntry.ts`)

Tracks all inventory and financial events:

```typescript
interface ILedgerEntry {
  entryNumber: string  // Unique, auto-generated
  eventType: LedgerEventType  // 'inventory_added', 'inventory_removed', 'pos_sale', etc.
  source: 'website' | 'pos' | 'admin' | 'system'
  channel?: 'online' | 'pos' | 'admin'
  
  // Location tracking
  outletId?: mongoose.Types.ObjectId
  branchId?: mongoose.Types.ObjectId
  branchCode?: string
  branchStockId?: string
  
  // Product tracking
  productId?: mongoose.Types.ObjectId
  productName?: string
  variantImageUrl?: string
  size?: string
  quantity?: number
  
  // Financial
  debitMinor?: number
  creditMinor?: number
  totalMinor: number
  
  // References
  orderId?: mongoose.Types.ObjectId
  orderNumber?: string
  userId?: mongoose.Types.ObjectId
}
```

**Event Types Include:**
- `inventory_added`
- `inventory_removed`
- `inventory_adjusted`
- `stock_transferred` (defined but NOT IMPLEMENTED)
- `pos_sale`, `wholesale_sale`, `retail_sale`
- `cash_payment`, `mpesa_payment`, `credit_issued`

---

## C. IMAGE-AS-VARIANT ARCHITECTURE

### Overview

The system uses a **unique image-based variant system** where each image in `Product.images[]` represents a **separate sellable design variant**. This is different from traditional variant systems that use attribute combinations (e.g., Color × Size).

**Core Concept:** 
- 1 Product = Multiple Design Variants (Images)
- Each image = Independently priced, stocked, and sold variant
- Images can be "grouped" to show multiple views of the same variant

---

### 1. Image Array Structure

**Location:** `Product.images: IProductImage[]`

Each image is a full-fledged variant with:

```typescript
interface IProductImage {
  url: string                          // Image URL (required)
  groupId?: string                     // Groups related images (front/back/side)
  
  // Pricing overrides (per-variant pricing)
  price?: number                       // Overrides Product.price
  wholesalePrice?: number              // Overrides Product.wholesalePrice
  wholesaleThreshold?: number          // Overrides Product.wholesaleThreshold
  
  // Stock overrides (legacy but active)
  stock?: number                       // Total stock for this design
  sizes?: string[]                     // Overrides Product.sizes
  sizeStock?: Record<string, number>   // Per-size stock: { S: 5, M: 8, L: 3 }
  
  // Identity
  sku?: string                         // Image-specific SKU
}
```

### 2. Image = Variant Identity

**Key Principle:** The `imageIndex` is the primary variant identifier.

**In Cart:**
```javascript
{
  productId: "prod_123",
  selectedImageIndex: 2,        // THIS identifies which variant
  selectedImageUrl: "img3.jpg", // Visual reference
  selectedSize: "M",            // Sub-variant within image
  quantity: 3
}
```

**In BranchStock:**
```javascript
{
  productId: "prod_123",
  branchId: "branch_a",
  imageIndex: 2,                // THIS identifies which design variant
  selectedSize: "M",            // Optional sub-variant
  stockIdentifier: "SKU-BRANCH-IMG2-M",
  quantity: 15
}
```

**In Order Items:**
```javascript
{
  productId: "prod_123",
  selectedImageIndex: 2,        // Recorded for fulfillment
  selectedImage: "img3.jpg",    // Visual record
  selectedSize: "M",
  quantity: 3,
  branchId: "branch_a",
  branchStockId: "SKU-BRANCH-IMG2-M"
}
```

---

### 3. Image Grouping System

**Purpose:** Allow multiple angles/views of the same design variant

**groupId Field:**
- Optional string identifier
- Images with same `groupId` are treated as one variant with multiple views
- Example: Front view, back view, detail shot of same dress design

**Implementation:**

```javascript
// Product with 4 images, 2 designs
{
  images: [
    { url: "dress-red-front.jpg", groupId: "red-dress" },
    { url: "dress-red-back.jpg", groupId: "red-dress" },
    { url: "dress-blue-front.jpg", groupId: "blue-dress" },
    { url: "dress-blue-back.jpg", groupId: "blue-dress" }
  ]
}
```

**In UI:**
- Carousel shows all 4 images
- Selecting any "red-dress" image = choosing the red variant
- Customer sees 2 images per variant but buys 1 design

**In Cart:**
- Only stores first image's index from the group
- All grouped images share same stock, price, SKU

**Grouping is Manual:**
- Admin drags one image onto another in product creation UI
- System generates or reuses `groupId`
- Images without `groupId` are independent variants

---

### 4. Variant Resolution Logic

**Pricing Resolution (Cascading Overrides):**

```javascript
// 1. Check image-level price override
const imagePrice = product.images[selectedImageIndex]?.price

// 2. Fall back to product-level price
const price = imagePrice ?? product.price

// 3. Check wholesale (same cascade)
const wsPrice = product.images[selectedImageIndex]?.wholesalePrice 
                ?? product.wholesalePrice
const wsThreshold = product.images[selectedImageIndex]?.wholesaleThreshold 
                    ?? product.wholesaleThreshold

// 4. Apply wholesale if quantity threshold met
const finalPrice = (wsPrice && wsThreshold && quantity >= wsThreshold)
                   ? wsPrice 
                   : price
```

**Size Resolution:**

```javascript
// 1. Check image-level size override
const imageSizes = product.images[selectedImageIndex]?.sizes

// 2. Fall back to product-level sizes
const sizes = imageSizes?.length ? imageSizes : product.sizes
```

**Stock Resolution (Complex):**

The system has **dual stock tracking** for images:

```javascript
// Option A: Per-size stock (most granular)
if (image.sizeStock && selectedSize) {
  stock = image.sizeStock[selectedSize]
}
// Option B: Per-image total stock
else if (image.stock !== undefined) {
  stock = image.stock
}
// Option C: Product-level fallback (legacy)
else {
  stock = product.stockQuantity
}
```

**HOWEVER:** With branch inventory enabled, **BranchStock is the source of truth**:

```javascript
// Modern approach (POS)
const stock = await getBranchStock(
  branchId, 
  productId, 
  selectedImageIndex,  // Image = variant identifier
  selectedSize
)
```

---

### 5. Example Product Structures

**Example 1: Simple Product (No Image Variants)**

```javascript
{
  name: "Basic White T-Shirt",
  price: 500,
  images: [
    { url: "tshirt-front.jpg" },
    { url: "tshirt-back.jpg", groupId: "main" },  // Grouped views
  ],
  sizes: ["S", "M", "L", "XL"],
  stockQuantity: 50
}
```
- 1 design, 2 views (grouped)
- Same price for all sizes
- Stock managed at product level OR via BranchStock

**Example 2: Multi-Variant Product**

```javascript
{
  name: "Summer Dress Collection",
  price: 1200,  // Base price
  images: [
    { 
      url: "dress-floral.jpg",
      price: 1500,  // Override: floral is more expensive
      sku: "DRESS-FLORAL",
      stock: 20
    },
    { 
      url: "dress-solid.jpg",
      price: 1200,
      sku: "DRESS-SOLID",
      stock: 30
    },
    { 
      url: "dress-stripe.jpg",
      price: 1400,
      sku: "DRESS-STRIPE",
      sizeStock: { S: 5, M: 10, L: 8 }  // Per-size tracking
    }
  ],
  sizes: ["S", "M", "L"],
  stockQuantity: 73  // Sum of all image stocks
}
```
- 3 independent design variants
- Each has own price and stock
- Third variant has per-size stock breakdown

**Example 3: Grouped Multi-Variant**

```javascript
{
  name: "Designer Jumpsuit",
  price: 2500,
  images: [
    { url: "jump-red-front.jpg", groupId: "red", price: 2800, sku: "JUMP-RED" },
    { url: "jump-red-back.jpg", groupId: "red" },
    { url: "jump-blue-front.jpg", groupId: "blue", price: 2600, sku: "JUMP-BLUE" },
    { url: "jump-blue-back.jpg", groupId: "blue" },
  ],
  sizes: ["S", "M", "L", "XL"]
}
```
- 2 designs (red, blue)
- 4 images total (2 views each)
- Customer sees 4 images but buys from 2 variants
- Grouped images share stock and pricing

---

### 6. POS Variant Selection Flow

**Step-by-Step:**

1. **Cashier searches product:** "Summer Dress"

2. **Product card shows:**
   - Product name
   - Base price OR first image price
   - **Total stock across all branches and all images**

3. **Cashier clicks product → VariantSelector modal opens**

4. **Modal displays:**
   ```
   [Image thumbnails row]
   [IMG1] [IMG2] [IMG3] ← Click to select design
   
   Sizes: [S] [M] [L] [XL] ← Click to select size
   
   Select Branch:
   ┌─────────────────────────────────────┐
   │ ● Branch Main (MAIN)      50 units  │
   │   Branch A (BR-A)         20 units  │
   │   Branch B (BR-B)         0 units   │
   └─────────────────────────────────────┘
   
   Quantity: [-] 1 [+]
   Price: KSH 1,500
   ```

5. **Variant selection triggers branch stock fetch:**
   ```javascript
   // When user changes image or size:
   fetch(`/api/pos/products/branch-stock?` +
         `productId=${id}&imageIndex=${idx}&selectedSize=${size}`)
   
   // Returns branches with stock for THIS specific variant
   ```

6. **User confirms → Added to cart with:**
   ```javascript
   {
     productId: "dress_id",
     selectedImageIndex: 2,      // Floral design
     selectedImageUrl: "dress-floral.jpg",
     selectedSize: "M",
     branchId: "branch_main_id",
     branchCode: "MAIN",
     branchStockId: "DRESS-FLORAL-MAIN-IMG2-M",
     quantity: 1,
     actualUnitPrice: 1500
   }
   ```

---

### 7. Public Ecommerce Variant Experience

**Product Page:**

```javascript
// ProductImageCarousel component shows ALL images
<Carousel>
  {product.images.map((img, idx) => (
    <img 
      src={img.url} 
      onClick={() => setSelectedImageIndex(idx)}
    />
  ))}
</Carousel>

// Grouped images shown together but customer selects one
```

**Customer selects:**
- Design (by clicking image)
- Size (from dropdown/buttons)
- Quantity

**Add to cart:**
```javascript
{
  id: product._id,
  name: product.name,
  price: effectivePrice,      // Image override or base
  image: selectedImageUrl,
  quantity,
  selectedSize,
  selectedImage: selectedImageUrl,  // For fulfillment
  imageIndex: selectedImageIndex,   // Critical: which variant
  sku: image.sku,                  // Image-specific SKU
  groupId: image.groupId,          // For grouped tracking
  branchId: product.branchId       // Product's default branch
}
```

**Key Difference from POS:**
- Public site: No branch selection UI
- Stock shown: Total across all branches (`product.stockQuantity`)
- Branch assignment: Either product's default `branchId` or fulfillment logic decides later

---

### 8. Stock Tracking Per Image

**BranchStock Granularity:**

```
Product → Branch → Image → Size
   ↓         ↓       ↓       ↓
  ID       ID    Index    String

One BranchStock record per unique combination
```

**Example BranchStock Records:**

```javascript
// Product: Dress, Branch: Main, Image 0 (Red), Size M
{
  productId: "dress_id",
  branchId: "main_id",
  imageIndex: 0,
  selectedSize: "M",
  stockIdentifier: "DRESS-RED-MAIN-IMG0-M",
  quantity: 10
}

// Same product, same branch, DIFFERENT image (Blue)
{
  productId: "dress_id",
  branchId: "main_id",
  imageIndex: 1,
  selectedSize: "M",
  stockIdentifier: "DRESS-BLUE-MAIN-IMG1-M",
  quantity: 15
}

// Same product, DIFFERENT branch, same image
{
  productId: "dress_id",
  branchId: "branch_a_id",
  imageIndex: 0,
  selectedSize: "M",
  stockIdentifier: "DRESS-RED-BRA-IMG0-M",
  quantity: 5
}
```

**Queries:**

```javascript
// Get stock for specific variant at specific branch
const stock = await BranchStock.findOne({
  productId,
  branchId,
  imageIndex: 0,      // Red dress
  selectedSize: "M"
})

// Get stock for variant across ALL branches
const allBranches = await BranchStock.find({
  productId,
  imageIndex: 0,      // Red dress only
  selectedSize: "M"
})

// Total stock: sum quantities
```

---

### 9. Order Fulfillment Tracking

**Order Item Structure:**

```javascript
{
  productId: "dress_id",
  productName: "Summer Dress Collection",
  productImage: "dress-floral.jpg",     // Main product image
  
  // VARIANT IDENTIFICATION
  selectedImage: "dress-floral.jpg",    // Which design was bought
  selectedImageIndex: 0,                // Array index in product.images
  selectedSize: "M",                    // Sub-variant
  
  // VARIANT METADATA
  sku: "DRESS-FLORAL",                  // Image-specific SKU
  groupId: undefined,                   // If image was grouped
  
  // INVENTORY TRACKING
  branchId: "main_id",                  // Which branch's stock
  branchCode: "MAIN",                   // Human-readable
  branchStockId: "DRESS-FLORAL-MAIN-IMG0-M",  // Exact stock record
  
  // TRANSACTION DATA
  quantity: 2,
  price: 1500,
  totalPrice: 3000
}
```

**Fulfillment Process Can:**
1. Look up exact BranchStock that was deducted via `branchStockId`
2. Identify product via `productId`
3. Show warehouse/picker exactly which design via `selectedImageIndex` and `selectedImage` URL
4. Pick correct size via `selectedSize`
5. Verify stock was from correct branch via `branchCode`

---

### 10. Image Variant Implications for Vendor

**Current Structure:**
```
Product → Image (variant) → Branch → Stock
```

**With Vendor:**
```
Product → Image (variant) → Branch → Vendor → Stock
```

**Critical Questions:**

1. **Can different vendors own stock of the SAME image variant at the SAME branch?**
   ```
   Example:
   Red Dress (Image 0), Size M, Branch Main
   - Vendor John: 10 units
   - Vendor Mary: 5 units
   
   TOTAL available at Branch Main: 15 units
   ```
   - If YES: BranchStock needs `vendorId`
   - If NO: Different model needed

2. **Does vendor own the entire product or per-image stock?**
   - **Scenario A:** Vendor John owns "Summer Dress Collection" product
     - All images/variants belong to John
     - Stock across all branches belongs to John
   
   - **Scenario B:** Vendor John owns stock of specific variants
     - John has 10 Red Dresses (Image 0) at Branch Main
     - Mary has 5 Blue Dresses (Image 1) at Branch Main
     - Same product, different image variants, different owners

3. **POS variant + vendor selection flow:**
   
   **Current:**
   ```
   Product → Image → Size → Branch → Quantity
   ```
   
   **Option A (Branch-first):**
   ```
   Product → Image → Size → Branch → Vendor (filtered by branch) → Quantity
   ```
   
   **Option B (Vendor-first):**
   ```
   Product → Image → Size → Vendor → Branch (filtered by vendor) → Quantity
   ```
   
   **Option C (POS has branch context):**
   ```
   [POS is set to Branch Main]
   Product → Image → Size → Vendor (only vendors with stock at Main) → Quantity
   ```

4. **Stock identifier format:**
   
   **Current:**
   ```
   SKU-BRANCHCODE-IMGn-SIZE
   DRESS-FLORAL-MAIN-IMG0-M
   ```
   
   **With Vendor:**
   ```
   SKU-BRANCHCODE-VENDORCODE-IMGn-SIZE
   DRESS-FLORAL-MAIN-JOHN-IMG0-M
   ```
   
   **Problem:** Very long identifier
   
   **Alternative:**
   ```
   SKU-VENDOR-BRANCH-IMGn-SIZE
   DRESS-FLORAL-JOHN-MAIN-IMG0-M
   ```

5. **Grouped images and vendor:**
   - If images are grouped (same variant, multiple views)
   - Do grouped images always have same vendor?
   - **Answer should be YES** - groups represent same physical item
   - Vendor ownership is per variant, not per image file

---

### 11. Image Indexing Stability

**CRITICAL: imageIndex is a positional array index**

**Risk:**
```javascript
// Product created with 3 images
images: [
  { url: "red.jpg" },    // imageIndex: 0
  { url: "blue.jpg" },   // imageIndex: 1
  { url: "green.jpg" }   // imageIndex: 2
]

// BranchStock created for blue variant
{ imageIndex: 1, stockIdentifier: "PROD-MAIN-IMG1" }

// Admin deletes red image
images: [
  { url: "blue.jpg" },   // NOW imageIndex: 0 ❌
  { url: "green.jpg" }   // NOW imageIndex: 1 ❌
]

// BranchStock with imageIndex: 1 now points to GREEN, not BLUE!
```

**Current Mitigation:**
- Products are rarely edited after creation
- Image deletion is not common workflow
- Admin UI doesn't allow reordering images easily

**Better Solution (Not Implemented):**
- Give each image a stable UUID
- BranchStock stores `imageId` instead of `imageIndex`
- Would require schema migration

**Vendor Impact:**
- If vendor stock uses `imageIndex`
- Image reordering/deletion breaks vendor stock tracking
- **Recommendation:** Use image UUID or SKU-based identifier

---

### 12. SKU as Image Identifier

**Many images have image-specific SKUs:**

```javascript
images: [
  { url: "red.jpg", sku: "DRESS-001-RED" },
  { url: "blue.jpg", sku: "DRESS-001-BLUE" },
  { url: "green.jpg", sku: "DRESS-001-GREEN" }
]
```

**SKU Can Be:**
- Unique per image (recommended)
- Shared across grouped images (same variant)
- Missing (falls back to product SKU)

**Stock Identifier Uses SKU:**
```javascript
stockIdentifier = generateStockIdentifier(
  image.sku || product.sku || `PROD${productId.slice(-6)}`,
  branchCode,
  imageIndex,
  selectedSize
)
```

**For Vendor Implementation:**
- SKU is more stable than imageIndex
- Consider using SKU as primary variant identifier
- But: SKU is optional, imageIndex is always present

---

### 13. Reporting Implications

**Product Performance Reports Must Consider Images:**

**Wrong Approach:**
```javascript
// This undercounts if product has multiple image variants
SELECT productId, SUM(quantity) as totalSold
FROM order_items
GROUP BY productId
```

**Correct Approach:**
```javascript
// Must group by product AND image to see variant performance
SELECT 
  productId,
  selectedImageIndex,
  selectedImage,
  sku,
  SUM(quantity) as totalSold
FROM order_items
GROUP BY productId, selectedImageIndex
```

**Example Output:**
```
Product: Summer Dress Collection
├─ Image 0 (Red):    50 units sold
├─ Image 1 (Blue):   80 units sold  ← Best seller
└─ Image 2 (Green):  20 units sold
Total: 150 units
```

**With Vendor:**
```
Product: Summer Dress Collection
├─ Image 0 (Red)
│   ├─ Vendor John:  30 units sold
│   └─ Vendor Mary:  20 units sold
├─ Image 1 (Blue)
│   ├─ Vendor John:  50 units sold
│   └─ Vendor Mary:  30 units sold
└─ Image 2 (Green)
    └─ Vendor John:  20 units sold
```

---

### 14. Summary: Image System Characteristics

**Strengths:**
✅ Flexible - each image can have unique pricing, stock, sizes  
✅ Visual - images are intuitive variant identifiers  
✅ Supports complex products (multiple designs, each with sizes)  
✅ Grouping allows multiple views without complicating inventory  
✅ Works well with fashion/apparel domain  

**Weaknesses:**
⚠️ imageIndex is positional, not stable  
⚠️ No built-in protection against image reordering  
⚠️ Can't easily "merge" variants after creation  
⚠️ Reporting must always include imageIndex  
⚠️ Complex for products with many attributes (size, color, material, etc.)  

**Vendor Integration Points:**
1. ✅ Vendor ownership at image-level makes sense (design variants)
2. ⚠️ Need stable image identifiers (UUID or SKU-based)
3. ⚠️ Stock identifier will become very long with vendor code
4. ✅ Grouped images should share vendor ownership
5. ⚠️ Variant selector UI will add another selection step

**Critical for Vendor Design:**
- Decide: Does vendor own entire product OR per-image stock?
- If per-image: BranchStock becomes `productId + branchId + vendorId + imageIndex + size`
- Image grouping must be respected in vendor assignment
- Consider image UUID instead of imageIndex for stability

---

## D. CURRENT INVENTORY FLOW

### 1. Add Product Flow

**UI:** `app/admin/products/new/page.tsx`  
**API:** `POST /api/products` (`app/api/products/route.ts`)  
**Service:** N/A (logic in route)

**Process:**

1. **Admin fills form:**
   - Product name, description, pricing
   - Uploads images (each = design variant)
   - Sets base sizes
   - **Selects BRANCH** (required)
   - Sets **Initial Stock** for selected branch
   - Main branch auto-selected if available

2. **Form submission:**
   - Validates branch exists and is active
   - Creates Product with `branchId` set to selected branch
   - Product.stockQuantity set to initial stock value

3. **Transaction begins:**
   ```javascript
   // Creates Product
   const product = new Product(body)
   await product.save({ session })
   
   // Creates BranchStock records for selected branch
   for each image:
     if image has sizeStock:
       for each size with quantity > 0:
         create BranchStock(productId, branchId, imageIndex, size, quantity)
     else if image has stock > 0:
       create BranchStock(productId, branchId, imageIndex, quantity)
   
   // Fallback: if no image-level stock but product has initialStock:
   if initialStock > 0 and no image stock:
     create BranchStock(productId, branchId, imageIndex: 0, initialStock)
   ```

4. **Result:**
   - Product record created with branch reference
   - BranchStock record(s) created for initial inventory
   - Product.stockQuantity reflects total
   - No ledger entry created during product creation

**Example:**
Creating "Blue Dress" with:
- Branch: MAIN
- Initial Stock: 20
- 2 images, no per-image stock

**Database Records Created:**
```javascript
Product {
  name: "Blue Dress",
  branchId: ObjectId("main_branch_id"),
  stockQuantity: 20,
  images: [{ url: "img1.jpg" }, { url: "img2.jpg" }]
}

BranchStock {
  productId: ObjectId("blue_dress_id"),
  branchId: ObjectId("main_branch_id"),
  imageIndex: 0,
  stockIdentifier: "PROD-MAIN-IMG0",
  quantity: 20
}
```

---

### 2. Add Stock Flow

**UI:** Admin panel (not inspected in detail)  
**API:** `POST /api/admin/products/add-stock` (`app/api/admin/products/add-stock/route.ts`)  
**Service:** `lib/branch-inventory.ts`

**Process:**

1. **Admin provides:**
   - Product ID
   - Branch ID
   - Image index
   - Selected size (optional)
   - Quantity to add
   - Notes (optional)

2. **Validation:**
   - Product exists
   - Branch exists and is active
   - Image index is valid
   - If product has sizes, size must be provided and valid

3. **Transaction begins:**
   ```javascript
   // Add stock to branch
   const result = await addBranchStock(
     branchId, productId, imageIndex, selectedSize, quantity, session
   )
   // result includes: { success, newQuantity, stockIdentifier }
   
   // Sync product-level stockQuantity
   await syncProductStockQuantity(productId, session)
   
   // Create audit ledger entry
   await createLedgerEntry({
     eventType: 'inventory_added',
     source: 'admin',
     branchId, branchCode, branchStockId,
     productId, productName, quantity,
     notes: "Added X units to Branch Y"
   })
   ```

4. **`addBranchStock()` logic:**
   ```javascript
   // Finds or creates BranchStock record
   const branchStock = await BranchStock.findOne({
     productId, branchId, imageIndex, 
     selectedSize: size || { $exists: false }
   })
   
   if (!branchStock) {
     // Create new record with generated stockIdentifier
     const stockIdentifier = generateStockIdentifier(sku, branchCode, imageIndex, size)
     branchStock = new BranchStock({ ...fields, quantity })
   } else {
     branchStock.quantity += quantity
   }
   
   await branchStock.save({ session })
   ```

5. **`syncProductStockQuantity()` logic:**
   ```javascript
   // Aggregates total stock across ALL branches
   const totalStock = await getTotalProductStock(productId)
   
   // Updates Product
   await Product.findByIdAndUpdate(productId, {
     stockQuantity: totalStock,
     inStock: totalStock > 0,
     branchInventoryEnabled: true
   })
   ```

**Result:**
- BranchStock quantity increased
- Product.stockQuantity synced to match total across all branches
- Ledger entry created
- Product.branchInventoryEnabled set to true

**Example:**
Adding 10 units of Blue Dress, Size M, to Branch A:

**Before:**
```
BranchStock: none for this combination
Product.stockQuantity: 20
```

**After:**
```
BranchStock {
  productId: "blue_dress_id",
  branchId: "branch_a_id",
  imageIndex: 0,
  selectedSize: "M",
  stockIdentifier: "DRESS001-BRANCH-A-IMG0-M",
  quantity: 10
}

Product.stockQuantity: 30  // Total across all branches
```

---

### 3. Edit Product Flow

**UI:** `app/admin/products/[id]/edit/page.tsx`  
**API:** `PUT /api/products/[id]` (`app/api/products/[id]/route.ts`)

**Key Finding: Stock is NOT editable from product edit page**

```javascript
// From edit page - stock fields are removed before update
const imagesWithoutStock = formData.images.map(img => {
  const { stock, sizeStock, ...imgWithoutStock } = img
  return imgWithoutStock
})
```

**Process:**
- Admin can update product details, pricing, images, settings
- Stock values in images are STRIPPED before API call
- API uses simple `findByIdAndUpdate()` - no stock manipulation
- Stock management happens ONLY through dedicated "Add Stock" workflow

**Consequence:**
- Once branch inventory is enabled, stock MUST be managed through branch-specific operations
- No accidental override of branch stock from product edit
- Product.stockQuantity is READ-ONLY from product edit perspective

---

## D. CURRENT POS FLOW

### 1. POS Page Structure

**Component:** `app/pos/make-sale/page.tsx`  
**Cart Store:** `lib/pos/cart-store.ts`

**Key UI Elements:**
- Product search/browse (by name, category, barcode)
- Product cards showing total stock across all branches
- Branch selector in top bar (current outlet context)
- Variant selector modal (image + size + **branch** selection)
- Cart panel (shows branch code per item)
- Payment modal

---

### 2. Product Selection Flow

1. **Search products:**
   - API: `GET /api/pos/products/search`
   - Returns products with `branchStocks` array included
   - Total stock shown = sum across all branches

2. **Click product:**
   - Opens `VariantSelector` modal
   - Shows all product images (design variants)
   - Shows available sizes

3. **Variant selector fetches branch stock:**
   - API: `GET /api/pos/products/branch-stock?productId=X&imageIndex=Y&selectedSize=Z`
   - Returns: `{ branchStocks: [...], totalStock: N }`
   - Branch stocks filtered to active branches with quantity > 0

4. **User selects:**
   - Image (design variant)
   - Size (if applicable)
   - **Branch** (from available branches with stock)
   - Quantity

5. **Add to cart:**
   - Cart item includes:
     ```typescript
     {
       productId, productName, sku,
       selectedImageIndex, selectedImageUrl,
       selectedSize,
       quantity,
       retailUnitPrice, wholesaleUnitPrice,
       actualUnitPrice, pricingMode,
       branchId,         // CRITICAL: Which branch's stock
       branchCode,       // CRITICAL: Branch code
       branchStockId     // CRITICAL: Exact stockIdentifier
     }
     ```

---

### 3. Cart Store Structure

**File:** `lib/pos/cart-store.ts`

```typescript
interface PosCartItem {
  id: string  // Unique cart item ID
  productId: string
  productName: string
  selectedImageIndex: number
  selectedImageUrl: string
  selectedSize?: string
  quantity: number
  actualUnitPrice: number
  pricingMode: 'retail' | 'wholesale'
  
  // BRANCH TRACKING
  branchId: string          // Which branch owns this stock
  branchCode: string        // Branch code for display
  branchStockId: string     // Exact BranchStock.stockIdentifier
}
```

**Key Methods:**
- `addItem()` - adds or merges items (same product + image + size + **branch**)
- `isMultiBranchCart()` - checks if cart contains items from multiple branches
- `getTotalDiscountMinor()` - cart discount disabled if multi-branch cart
- `clearCart()` - clears items and discount

**Multi-Branch Cart Logic:**
```javascript
isMultiBranchCart() {
  const uniqueBranches = new Set(items.map(item => item.branchId))
  return uniqueBranches.size > 1
}
```

**Discount Restriction:**
- General cart discount is **disabled** if `isMultiBranchCart() === true`
- UI shows: "Multi-branch cart: Use item discounts only"
- Individual line item discounts are still allowed

---

### 4. POS Branch Behavior

**Current Implementation:**

1. **POS session has outlet context:**
   ```javascript
   // Fetched on page load
   fetch('/api/pos/session')
     .then(d => {
       if (d.defaultOutlet?._id) {
         setOutletId(d.defaultOutlet._id)
         setOutlet(d.defaultOutlet._id)  // Stored in cart
       }
     })
   ```

2. **NO POS-level branch selector:**
   - POS knows which **outlet** it belongs to
   - POS does NOT have a persistent "current branch" context
   - Branch is selected **per product** when adding to cart

3. **Branch selected in variant selector:**
   - Cashier sees list of branches with available stock
   - Cashier must choose which branch's stock to sell
   - Selection stored in cart item

4. **Can cart contain multiple branches?**
   - **YES**, UI allows it
   - Cart store detects it via `isMultiBranchCart()`
   - General cart discount is blocked if multi-branch
   - Backend enforces the same restriction

5. **What happens if branch info is missing?**
   - Backend validation will fail
   - Sale service requires `branchId` for each item
   - Error: "Branch not found for {product}"

---

### 5. Sale Completion Flow

**API:** `POST /api/pos/sales/complete` → `lib/pos/sale-service.ts`

**Input:**
```typescript
{
  items: [
    {
      productId, branchId, selectedImageIndex,
      selectedSize, quantity,
      lineDiscountType, lineDiscountValue,
      priceOverride
    }
  ],
  pricingMode: 'retail' | 'wholesale',
  cartDiscountType, cartDiscountValue, cartDiscountReason,
  paymentAllocations: [...],
  outletId, deviceId, customerId
}
```

**Process (Transaction):**

1. **Validate outlet**

2. **For each cart item:**
   
   a. **Fetch product** and verify active
   
   b. **Fetch branch** and verify active
   
   c. **Check branch stock availability:**
   ```javascript
   const branchStock = await getBranchStock(
     branchId, productId, imageIndex, selectedSize
   )
   
   if (branchStock < quantity) {
     throw new Error(`Insufficient stock at ${branch.name}`)
   }
   ```
   
   d. **Deduct from BranchStock:**
   ```javascript
   const stockResult = await deductBranchStock(
     branchId, productId, imageIndex, selectedSize, quantity, session
   )
   // Returns: { success, newQuantity, stockIdentifier }
   ```
   
   e. **ALSO deduct from Product-level stock:**
   ```javascript
   await deductInventory(product, imageIndex, quantity, selectedSize, session)
   // This updates:
   // - Product.images[i].sizeStock[size] or
   // - Product.images[i].stock or  
   // - Product.stockQuantity
   ```
   
   f. **Build order item:**
   ```javascript
   {
     productId, productName, selectedImageIndex,
     selectedSize, quantity, price,
     branchId: branch._id,
     branchCode: branch.branchCode,
     branchStockId: stockResult.stockIdentifier
   }
   ```

3. **Validate cart discount:**
   ```javascript
   const uniqueBranches = new Set(items.map(item => item.branchId))
   if (uniqueBranches.size > 1 && cartDiscountType) {
     throw Error('General cart discount not allowed for multi-branch carts')
   }
   ```

4. **Calculate totals, process payments**

5. **Create Order:**
   ```javascript
   new Order({
     orderNumber: generatePosOrderNumber(),  // POSyymmddXXX
     items: orderItems,  // Each with branchId, branchCode, branchStockId
     channel: 'pos',
     outletId, outletName,
     cashierId, cashierName,
     paymentAllocations,
     status: 'completed',
     paymentStatus: 'paid'
   })
   ```

6. **Create ledger entries:**
   - One `pos_sale` entry for the order total
   - One `inventory_removed` entry **per item per branch**
   - Payment-specific entries (cash_payment, mpesa_payment, etc.)

7. **Return receipt data**

**CRITICAL: Dual Deduction**

When a POS sale completes:
1. `deductBranchStock()` decreases `BranchStock.quantity`
2. `deductInventory()` decreases `Product.images[i].sizeStock[size]` or `Product.stockQuantity`

**Result:**
- BranchStock: -5 units
- Product: -5 units
- Both are kept in sync

---

## E. CURRENT STOCK SOURCES OF TRUTH

### Multiple Stock Storage Locations

**1. BranchStock Collection (PRIMARY for POS)**
- **Location:** Separate `branchstocks` collection
- **Granularity:** `productId + branchId + imageIndex + selectedSize`
- **Usage:** POS inventory checks and deductions
- **Sync:** Updated by Add Stock API and POS sales

**2. Product.stockQuantity (SECONDARY, used by public site)**
- **Location:** `Product.stockQuantity` field
- **Granularity:** Product-level total
- **Usage:** Public ecommerce, product listing filters
- **Sync:** Recalculated from BranchStock totals OR image stock totals

**3. Product.images[i].stock (LEGACY but still written)**
- **Location:** `Product.images[].stock` field
- **Granularity:** Per-image design variant
- **Usage:** Legacy fallback, POS deduction also updates this
- **Sync:** Deducted during `deductInventory()`

**4. Product.images[i].sizeStock (LEGACY but still written)**
- **Location:** `Product.images[].sizeStock` Map
- **Granularity:** Per-image, per-size
- **Usage:** Most granular legacy tracking
- **Sync:** Deducted during `deductInventory()`

### Synchronization Points

**When BranchStock changes → Product synced:**
- After `addBranchStock()`
- Via `syncProductStockQuantity()` which aggregates all BranchStock records

**When POS sale completes → Both deducted:**
- `deductBranchStock()` - updates BranchStock
- `deductInventory()` - updates Product fields

**No automatic sync from Product → BranchStock:**
- Product fields are NOT the source of truth for branch operations
- Editing product doesn't trigger BranchStock changes

### Potential Inconsistencies

1. **If BranchStock is deducted but Product isn't:**
   - Public site shows more stock than actually available
   - Fixed by running `syncProductStockQuantity()`

2. **If Product is deducted but BranchStock isn't:**
   - POS shows more stock than Product
   - This shouldn't happen with current code

3. **If manual Product.stockQuantity edit happens:**
   - BranchStock unaffected
   - **Current mitigation:** Edit product page strips stock before update

4. **If direct DB manipulation occurs:**
   - Both could be out of sync
   - Requires manual reconciliation script

---

## F. CURRENT BRANCH IMPLEMENTATION

### What Works:

1. **Branch Model:**
   - ✅ Branches can be created/managed
   - ✅ Branch codes are unique
   - ✅ Only one main branch enforced
   - ✅ Active/inactive status
   - ✅ Deletion protected if inventory/orders exist

2. **Branch Stock:**
   - ✅ Per-branch, per-product, per-image, per-size tracking
   - ✅ Stock identifier generation
   - ✅ Unique constraints prevent duplicates
   - ✅ Helper methods for aggregation

3. **Add Stock:**
   - ✅ Admin can add stock to specific branches
   - ✅ Validation for branch existence and active status
   - ✅ Transaction safety
   - ✅ Ledger audit trail

4. **POS Branch Selection:**
   - ✅ Variant selector shows available branches
   - ✅ Cart stores branch info per item
   - ✅ Multi-branch cart detection
   - ✅ Cart discount restriction for multi-branch carts

5. **POS Sale:**
   - ✅ Validates branch per item
   - ✅ Checks branch-specific stock before sale
   - ✅ Deducts from correct branch
   - ✅ Stores branch info in order items
   - ✅ Creates ledger entries with branch tracking

6. **Reports:**
   - ✅ Reports can filter by branchId
   - ✅ Aggregation at item level for branch-specific metrics
   - ✅ Branch information in ledger entries

### What Doesn't Work:

1. **No Default POS Branch Context:**
   - POS doesn't remember "my branch"
   - Cashier must select branch for EVERY product
   - No way to set "this POS always sells from Branch X"

2. **No PosOutlet → Branch Relationship:**
   - Outlet model exists but not linked to Branch
   - An outlet doesn't "belong to" a branch
   - Can't auto-filter products to outlet's branch

3. **Multi-Branch Carts Are Possible:**
   - Current UI allows cashier to mix branches in one cart
   - May or may not be desired behavior

4. **Public Ecommerce is Branch-Unaware:**
   - Public site shows `Product.stockQuantity` (total across branches)
   - Customers can't see which branch has stock
   - Customers can't choose preferred branch
   - Online orders don't specify which branch to fulfill from

5. **No Branch Assignment Logic:**
   - When online order comes in, which branch should fulfill it?
   - Currently, online orders MAY have `branchId` in items if set, but logic is unclear

---

## G. CURRENT STOCK MOVEMENT

**Status: NOT IMPLEMENTED**

**Evidence:**

1. **Ledger event type exists:**
   ```typescript
   type LedgerEventType = 
     | 'stock_transferred'  // DEFINED
     | ...
   ```

2. **No transfer API found:**
   - Searched for: "transfer", "movement", "move stock"
   - No API route for stock transfers
   - No UI for stock transfers

3. **No transfer model found:**
   - No StockTransfer or StockMovement model
   - No transfer history tracking

4. **Ledger search shows:**
   ```javascript
   if (inventoryMovement) {
     query.eventType = { 
       $in: ['inventory_added', 'inventory_removed', 
             'inventory_adjusted', 'stock_transferred'] 
     }
   }
   ```
   - System expects to FILTER for stock_transferred events
   - But nothing CREATES them

**Conclusion:**
Stock transfer between branches is **planned but not implemented**.

---

## H. CURRENT REPORTS

### Admin Reports API

**Route:** `GET /api/admin/reports` (`app/api/admin/reports/route.ts`)

**Branch Filtering:**
- ✅ Accepts `branchId` query parameter
- ✅ Filters at **item level** using `items.branchId`
- ✅ Aggregates sales/revenue per branch

**Report Types:**

1. **sales-overview:**
   - Total revenue: SUM of `items.totalPrice` where `items.branchId` matches
   - Total orders: COUNT distinct orders with matching branch items
   - Average order value: AVG per-order totals (branch-filtered items only)
   - Payment methods: GROUP BY paymentMethod
   - Revenue by status: GROUP BY status

2. **product-performance:**
   - Top selling products by branch
   - Category performance by branch
   - Low stock products (uses BranchStock directly)

3. **revenue-trends:**
   - Daily/weekly/monthly revenue
   - Branch-specific time series

4. **customer-analytics:**
   - Customer segmentation
   - Repeat customer rate
   - Can be branch-filtered

**Aggregation Pattern:**
```javascript
Order.aggregate([
  { $match: dateFilter },
  { $unwind: '$items' },  // Break order into items
  { $match: { 'items.branchId': branchId } },  // Filter items
  { $group: { _id: null, total: { $sum: '$items.totalPrice' } } }
])
```

**Key Insight:**
Reports work at the **order item level**, not order level. This allows accurate branch-specific reporting even when orders contain mixed branches.

### POS Reports API

**Route:** `GET /api/pos/reports/summary` (`app/api/pos/reports/summary/route.ts`)

Similar structure:
- Filters by outlet
- Filters by branch (item-level)
- Aggregates inventory movements from ledger

---

## I. CURRENT VENDOR-RELATED CONCEPTS

**Search Results for: vendor, supplier, merchant, seller**

**Finding: NONE FOUND**

Only false positives:
- `isBestseller` (product field)
- `seller` (not used)

**Conclusion:**
No existing vendor, supplier, merchant, or seller concepts in the codebase. The field is clear for Vendor implementation.

---

## J. PUBLIC ECOMMERCE INVENTORY

### Product Detail Page

**File:** `app/product/[slug]/page.tsx`

**Stock Display Logic:**
```javascript
const effectiveStock = (): number => {
  if (!product) return 0
  return activeImage()?.stock ?? product.stockQuantity ?? 0
}

const isInStock = (): boolean => {
  if (!product) return false
  return effectiveStock() > 0
}
```

**Key Findings:**

1. **Branch-Unaware:**
   - Uses `Product.stockQuantity` (total across all branches)
   - OR `image.stock` if image has override
   - No branch selection or visibility

2. **Image Grouping:**
   - `groupId` used to group related images (front/back/side)
   - Customer sees all images but buys one variant
   - Cart stores `imageIndex` and `groupId`

3. **Cart Item Structure (Public):**
   ```javascript
   {
     id, name, price, image,
     quantity, selectedSize,
     selectedImage, imageIndex,
     sku, groupId,
     branchId: product.branchId  // Product's "home" branch
   }
   ```

### Online Checkout

**API:** `POST /api/orders/create` (`app/api/orders/create/route.ts`)

**Process:**
1. Validates products exist
2. Validates pricing (including wholesale logic)
3. Calculates shipping
4. Creates order with:
   ```javascript
   items: [{
     productId, productName, productImage,
     selectedImage, selectedImageIndex, selectedSize,
     sku, groupId,
     branchId: item.branchId  // From cart
   }]
   ```

**Stock Deduction: NOT IN THIS FILE**

The online checkout API:
- ❌ Does NOT deduct stock
- ❌ Does NOT validate stock availability
- ❌ Does NOT check BranchStock

**Where does online order stock deduction happen?**
- Not found in the code examined
- Likely in a separate order processing/fulfillment flow
- Or possibly when payment is confirmed

**Implication:**
Online orders may record `branchId` from product's default branch, but there's no branch-selection UI for customers.

---

## K. API AUDIT

### Product APIs

| Method | Route | Purpose | Branch Field | Stock Field |
|--------|-------|---------|--------------|-------------|
| GET | `/api/products` | List products | ❌ Not used | ✅ stockQuantity filtered |
| POST | `/api/products` | Create product | ✅ branchId required | ✅ Creates BranchStock |
| GET | `/api/products/[id]` | Get product | ❌ | ✅ Returns stockQuantity |
| PUT | `/api/products/[id]` | Update product | ❌ | ❌ Stock stripped |
| GET | `/api/products/by-slug/[slug]` | Public product | ❌ | ✅ Returns stockQuantity |

### Branch APIs

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin/branches` | List branches |
| POST | `/api/admin/branches` | Create branch |
| GET | `/api/admin/branches/[id]` | Get branch |
| PUT | `/api/admin/branches/[id]` | Update branch |

### Stock Management APIs

| Method | Route | Purpose | Stock Source |
|--------|-------|---------|--------------|
| POST | `/api/admin/products/add-stock` | Add stock to branch | BranchStock |
| GET | `/api/admin/products/branch-stock` | Get branch stock | BranchStock |

### POS APIs

| Method | Route | Purpose | Stock Source |
|--------|-------|---------|--------------|
| GET | `/api/pos/session` | Get POS session | N/A |
| GET | `/api/pos/products/search` | Search products | BranchStock + Product |
| GET | `/api/pos/products/branch-stock` | Get branch options | BranchStock |
| POST | `/api/pos/sales/complete` | Complete sale | BranchStock (check & deduct) |

### Order APIs

| Method | Route | Purpose | Branch Usage |
|--------|-------|---------|--------------|
| POST | `/api/orders/create` | Create online order | Stores item.branchId |
| GET | `/api/orders` | List orders | Can filter by branchId |

### Report APIs

| Method | Route | Purpose | Branch Support |
|--------|-------|---------|----------------|
| GET | `/api/admin/reports` | Get reports | ✅ branchId param |
| GET | `/api/pos/reports/summary` | POS summary | ✅ branch filtering |
| GET | `/api/pos/reports/ledger` | Ledger entries | ✅ branchId field |

---

## L. CRITICAL GAPS FOR VENDOR SUPPORT

To support the target model where:
- **Branch** = WHERE the stock is (physical location)
- **Vendor** = WHO OWNS the stock
- **POS** selects branch context → then vendor per product

### 1. DATA MODEL GAPS

**Missing:**
- ❌ Vendor model/collection
- ❌ vendorId in BranchStock
- ❌ Vendor-Branch relationship (M:M)
- ❌ vendorId in Order items

**Current structure:**
```
BranchStock: productId + branchId + imageIndex + selectedSize
```

**Needed structure:**
```
BranchStock: productId + branchId + vendorId + imageIndex + selectedSize
```

**Impact:**
- Cannot track who owns the stock
- Cannot filter inventory by vendor
- Cannot attribute sales to vendor
- Cannot support multiple vendors in same branch for same product

---

### 2. POS WORKFLOW GAPS

**Current:**
1. POS has no branch context
2. User adds product → selects branch + variant
3. Cart can mix branches

**Needed:**
1. POS selects branch at session start (or per transaction)
2. User adds product → selects vendor (from vendors with stock in POS branch)
3. Cart can mix vendors within same branch

**Missing:**
- ❌ POS branch selector/context
- ❌ Vendor selector in variant modal
- ❌ Vendor information in cart items
- ❌ Vendor-filtered stock display

---

### 3. STOCK IDENTIFIER GAPS

**Current format:**
```
SKU-BRANCHCODE-IMGn-SIZE
Example: DRESS001-MAIN-IMG0-M
```

**Needed format:**
```
SKU-BRANCHCODE-VENDORCODE-IMGn-SIZE
Example: DRESS001-MAIN-JOHN-IMG0-M
```

**Impact:**
- Stock identifier is primary key for BranchStock
- Schema change required
- Migration script needed for existing data

---

### 4. ADMIN UI GAPS

**Missing:**
- ❌ Vendor management UI
- ❌ Vendor selection when adding product
- ❌ Vendor selection when adding stock
- ❌ Vendor-branch stock overview
- ❌ Vendor performance reports

---

### 5. REPORTING GAPS

**Missing:**
- ❌ Sales by vendor
- ❌ Stock by vendor
- ❌ Vendor commission/payouts
- ❌ Vendor-branch inventory breakdown
- ❌ Low stock alerts by vendor

---

### 6. BUSINESS LOGIC GAPS

**Questions to answer:**

1. **Product ownership:**
   - Can a product belong to multiple vendors?
   - Or does a vendor own stock of a product?
   - Current: Product has optional branchId but no vendorId

2. **Initial product creation:**
   - Who is the default vendor?
   - Can admin create product without vendor?

3. **Stock addition:**
   - Must vendor be specified when adding stock?
   - Can same product have stock from multiple vendors in same branch?

4. **POS constraints:**
   - Can one cart mix vendors? (Likely yes, like branches)
   - General cart discount allowed for single-vendor carts only?

5. **Online orders:**
   - Which vendor fulfills online orders?
   - First available? Specific vendor?
   - Need vendor selection logic

6. **Stock transfer:**
   - Transfer between branches (already planned)
   - Transfer between vendors?
   - Change stock ownership?

---

## M. RISK AREAS

### 1. Data Consistency Risks

**Dual Deduction Pattern:**
- Both BranchStock AND Product are deducted
- If transaction fails mid-way, inconsistency possible
- **Mitigation:** Wrapped in mongoose transaction

**Sync Timing:**
- `syncProductStockQuantity()` called after BranchStock changes
- If not called, Product.stockQuantity out of sync
- **Mitigation:** Always call in same transaction

**Manual Edits:**
- Direct DB edits bypass sync logic
- **Mitigation:** Product edit UI strips stock fields

---

### 2. Migration Risks

**Adding Vendor to Existing Data:**

1. **BranchStock schema change:**
   - Add `vendorId` field
   - Add `vendorCode` to stockIdentifier
   - **Risk:** 100+ existing BranchStock records must be migrated

2. **Order history:**
   - Existing order items have branchId but no vendorId
   - **Risk:** Historical reports won't show vendor attribution
   - **Decision needed:** Backfill with default vendor? Leave null?

3. **Stock identifier collision:**
   - Current: `PROD-MAIN-IMG0`
   - Future: `PROD-MAIN-VENDOR1-IMG0`
   - **Risk:** If not migrated carefully, duplicate identifiers possible

**Migration Script Requirements:**
- Create default "Main Vendor" or "House Stock" vendor
- Update all BranchStock records with default vendorId
- Regenerate stockIdentifier with vendor code
- Update all Order items with vendorId (default)
- Update LedgerEntry records

---

### 3. POS UX Risks

**Added Complexity:**
- Cashier currently selects: Product → Variant (image/size) → Branch → Quantity
- After Vendor: Product → Variant → Branch? → **Vendor** → Quantity
- **Risk:** Too many clicks, slower checkout

**Alternative Flow:**
- POS sets branch at session start (sticky)
- Cashier selects: Product → Variant → **Vendor** → Quantity
- **Benefit:** One less selection per item

**Training Required:**
- Cashiers must understand vendor concept
- Cashiers must know which vendor to select when
- **Risk:** Selection errors, wrong vendor attributed

---

### 4. Discount Logic Risks

**Current Rule:**
- General cart discount blocked if multi-branch cart

**Future Rule:**
- General cart discount blocked if multi-branch OR multi-vendor cart?
- Or just multi-vendor?

**Decision needed:**
- If POS branch is fixed per session, all items are same branch
- Then only multi-vendor matters for discount logic

---

### 5. Public Ecommerce Risks

**Current:** Branch-unaware

**After Vendor:**
- Still show total stock across all vendors?
- Or hide vendor complexity from customers?

**If vendor-aware:**
- Do customers choose vendor?
- Do customers see vendor names?
- **Risk:** Confusion, complexity

**Recommended:**
- Keep public site vendor-agnostic
- Internally, fulfill from first available vendor
- Or vendor priority system

---

### 6. Stock Transfer Risks

**Not yet implemented:**
- If Vendor is added before Stock Transfer
- Transfer logic must handle vendor

**Scenarios:**
1. **Transfer within same vendor:**
   - Move Vendor A stock from Branch X to Branch Y
   - Straightforward

2. **Transfer changes ownership:**
   - Change stock from Vendor A to Vendor B at same branch?
   - **Risk:** Is this allowed? Business rule needed

---

### 7. Performance Risks

**BranchStock Queries:**
- Currently: `{ productId, branchId, imageIndex, selectedSize }`
- After Vendor: `{ productId, branchId, vendorId, imageIndex, selectedSize }`

**Indexes:**
- Need compound index on all 5 fields
- Existing indexes must be updated

**Aggregations:**
- Reports now aggregate by vendor too
- More complex queries
- **Risk:** Slower report generation

---

## N. RECOMMENDED NEXT STEP

### What We Now Know:

1. ✅ **Current inventory architecture is well-defined:**
   - Dual-tracking (BranchStock + Product) is intentional
   - Branch system is active and primary for POS
   - Stock deduction is transactional and atomic

2. ✅ **POS flow is clear:**
   - Per-item branch selection works
   - Multi-branch carts are supported but discount-restricted
   - Order items store branch information

3. ✅ **Gaps are identified:**
   - No vendor model exists
   - No POS branch context exists
   - Stock transfer not implemented
   - Public site is branch-unaware

4. ✅ **Risks are catalogued:**
   - Migration complexity
   - POS UX complexity
   - Discount logic
   - Performance implications

### What We Still Need to Decide:

**Business Logic:**
1. Does a product "belong to" a vendor, or does stock belong to a vendor?
2. Can same product have stock from multiple vendors in same branch?
3. Which vendor fulfills online orders?
4. Can stock ownership transfer between vendors?
5. What is the default vendor for existing data?

**POS Workflow:**
1. Should POS have a sticky branch context? Or keep per-item selection?
2. If vendor selection is per-item, in what order? Branch then vendor? Or vice versa?
3. Should variant selector show branches OR vendors first?
4. Should multi-vendor carts be allowed?

**Technical Decisions:**
1. Vendor model schema
2. Vendor-Branch relationship (M:M? Or vendor "home branch"?)
3. Migration strategy for existing BranchStock
4. Stock identifier format with vendor code
5. Whether to make public site vendor-aware

### Recommendation:

**Do NOT write code yet.**

**Next steps:**
1. **Define vendor business model document:**
   - What is a vendor?
   - Vendor-product relationship
   - Vendor-branch relationship
   - Vendor rules and constraints

2. **Define target POS workflow:**
   - Mockup/wireframe of vendor selection
   - Step-by-step cashier actions
   - Error states and validations

3. **Define migration strategy:**
   - Default vendor for existing data
   - BranchStock migration script
   - Order history backfill strategy
   - Stock identifier regeneration

4. **Define public ecommerce strategy:**
   - Vendor-agnostic (recommended)
   - Or vendor selection UI (complex)

5. **Create Vendor Implementation Specification:**
   - Database schema changes
   - API endpoints to create/modify
   - UI changes required
   - Migration scripts
   - Testing requirements
   - Rollout plan

**Once these decisions are documented, return with:**
- Vendor model definition
- POS workflow specification
- Migration plan

**Then we can generate the implementation code.**

---

## O. APPENDIX: TESTED QUERIES

During this audit, the following information sources were examined:

**Models:**
- Product, Branch, BranchStock, Order, PosOutlet, LedgerEntry

**APIs:**
- Product CRUD, Branch APIs, Stock management, POS products, POS sales, Online orders, Reports

**UI Components:**
- Add product page, Edit product page, POS make-sale page, Variant selector, Cart store

**Services:**
- branch-inventory.ts, sale-service.ts, ledger-service.ts

**Database:** Not accessed directly (no connection available)

---

**End of Audit**

