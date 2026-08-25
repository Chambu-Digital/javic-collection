# POS Image-Level Stock Fix

## Problem

Products in the POS were greyed out and not clickable despite having stock at the selected branch.

### Root Cause

The system has two inventory tracking systems:
1. **Legacy**: `product.images[].stock` (image-level stock stored on Product model)
2. **Current**: `BranchStock` collection (separate records tracking stock by branch/vendor/image/size)

The POS product search API was:
- ✅ Correctly filtering `BranchStock` records by selected branch
- ✅ Correctly calculating total product-level stock
- ❌ **NOT enriching individual image variants with their branch-specific stock**

This caused:
- `product.stock = 7` (correct branch total)
- `product.available = true` (correct)
- `product.images[0].stock = undefined` ❌ (missing)
- `product.images[1].stock = undefined` ❌ (missing)

The frontend checked `product.available` and found it false because the image-level stock wasn't calculated, making all products appear out of stock.

## Solution

Modified `/api/pos/products/search/route.ts` to:

1. **Group BranchStock records by imageIndex**
   ```typescript
   const imageStockMap = new Map<number, number>()
   for (const bs of relevantStocks) {
     const currentStock = imageStockMap.get(bs.imageIndex) || 0
     imageStockMap.set(bs.imageIndex, currentStock + bs.quantity)
   }
   ```

2. **Enrich each product image with branch-specific stock**
   ```typescript
   const enrichedImages = (p.images || []).map((img: any, idx: number) => ({
     ...img,
     stock: imageStockMap.get(idx) || 0,
   }))
   ```

3. **Recalculate variants using enriched images**
   ```typescript
   variants: getAllVariants({ ...p, images: enrichedImages } as any)
   ```

## Result

Now when a branch is selected:
- ✅ `product.stock = 7` (total at this branch)
- ✅ `product.available = true`
- ✅ `product.images[0].stock = 3` (branch-specific)
- ✅ `product.images[1].stock = 4` (branch-specific)
- ✅ Products are clickable
- ✅ Variant selector shows correct stock per image
- ✅ Vendor selection works correctly

## Files Changed

- **`app/api/pos/products/search/route.ts`**: Added image-level stock enrichment
- **`lib/pos/product-pricing.ts`**: Removed debug logging

## Testing

1. Select a branch in POS
2. Products with stock at that branch should be clickable (not greyed out)
3. Click a product to open variant selector
4. Each image variant should show its branch-specific stock
5. Sizes should show availability correctly
6. Vendor selection should work when multiple vendors have stock

## Related Documentation

- `POS-BRANCH-INVENTORY-FIX.md` - Original branch inventory implementation
- `pos.md` - Full POS requirements specification
