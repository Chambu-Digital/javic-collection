# Phase 3 & 4 Implementation: Stock Management & Navigation Updates

## Overview
Updated existing stock management components to filter vendors by branch and reorganized navigation to remove direct vendor access from sidebar.

---

## Phase 3: Update Existing Stock Management ✅

### 3.1 Stock Management Modal
**File:** `components/admin/stock-management-modal.tsx`

**Changes:**
1. **Vendor Fetching Logic:**
   - Updated `fetchVendors()` to require branch selection first
   - Filters vendors by branch: `GET /api/admin/vendors?activeOnly=true&branchId=${selectedBranch}`
   - Returns empty vendor list if no branch selected
   - Auto-selects house stock vendor or first available vendor

2. **Branch Change Handling:**
   - Added `useEffect` to re-fetch vendors when `selectedBranch` changes
   - Clears vendor list and selection when branch is cleared

3. **Improved UX:**
   - Vendor dropdown disabled until branch is selected
   - Shows context-aware placeholder text:
     - "Select branch first" - if no branch selected
     - "Loading..." - while fetching
     - "No vendors assigned to branch" - if none available
   - Added help text with link to assign vendors when none exist
   - Updated validation messages

**Before:**
```typescript
// Fetched all vendors globally
const res = await fetch('/api/admin/vendors?activeOnly=true')
```

**After:**
```typescript
// Fetches only vendors assigned to selected branch
if (!selectedBranch) {
  setVendors([])
  return
}
const res = await fetch(`/api/admin/vendors?activeOnly=true&branchId=${selectedBranch}`)
```

### 3.2 Product Stock Page
**File:** `app/admin/products/[id]/stock/page.tsx`

**Changes:**
1. **Same vendor filtering logic** as stock modal
2. **useEffect structure:**
   - Removed vendor fetching from initial load
   - Added separate `useEffect` watching `selectedBranch`
   - Vendors only load when branch is selected

3. **User Flow:**
   - User selects branch → vendors populate automatically
   - User changes branch → vendors update to match new branch
   - User clears branch → vendors cleared

### 3.3 Product Creation Page
**File:** `app/admin/products/new/page.tsx`

**Changes:**
1. **Branch-First Workflow:**
   - Removed `fetchVendors()` from initial load
   - Added `useEffect` to watch `formData.branchId`
   - Vendors only fetch after branch is selected

2. **Auto-Selection Logic:**
   - Tries to select house stock vendor first
   - Falls back to first vendor if no house stock
   - Clears selection if no vendors available

3. **Form Flow:**
   ```
   1. Select branch (required)
   2. Vendor dropdown populates with branch-specific vendors
   3. Select vendor (required)
   4. Enter initial stock quantity
   ```

### 3.4 Backend Validation
**Files:** 
- `app/api/admin/products/add-stock/route.ts`
- `app/api/admin/products/remove-stock/route.ts`

**Added Validation:**
```typescript
// Verify vendor is assigned to this branch
const BranchVendor = (await import('@/models/BranchVendor')).default
const isAssigned = await BranchVendor.isVendorAssignedToBranch(branchId, vendorId, true)
if (!isAssigned) {
  throw new Error(`Vendor ${vendor.name} (${vendor.vendorCode}) is not assigned to branch ${branch.name}. Please assign the vendor to this branch first.`)
}
```

**Protection:**
- Cannot add stock if vendor not assigned to branch
- Cannot remove stock if vendor not assigned to branch
- Clear error messages guide user to assign vendor
- Prevents data inconsistencies

---

## Phase 4: Navigation & Routing Updates ✅

### 4.1 Admin Sidebar/Navigation
**File:** `lib/admin-navigation.ts`

**Changes:**
- **Removed** "Vendors" navigation item from `NAVIGATION_CONFIG`
- Kept "Branches" navigation item
- Store icon (`<Store />`) no longer used in sidebar

**Before:**
```typescript
{ name: 'Branches', ... },
{ name: 'Vendors', ... },  // ← REMOVED
{ name: 'Settings', ... }
```

**After:**
```typescript
{ name: 'Branches', ... },
{ name: 'Settings', ... }
```

### 4.2 Branches List Page
**File:** `app/admin/branches/page.tsx`

**Changes:**
1. **Clickable Branch Cards:**
   - Branch cards now navigate to detail page on click
   - Added hover effects and cursor pointer
   - Action buttons (Edit, Deactivate, Delete) stop click propagation

2. **User Flow:**
   ```
   /admin/branches
   └─> Click branch card
       └─> /admin/branches/[id]
           └─> Vendors tab → Manage vendors for this branch
   ```

**Code:**
```typescript
<Card 
  className="cursor-pointer hover:shadow-md transition-shadow"
  onClick={() => router.push(`/admin/branches/${branch._id}`)}
>
  {/* Action buttons stop propagation */}
  <Button onClick={(e) => { e.stopPropagation(); handleEdit(branch) }}>
    Edit
  </Button>
</Card>
```

### 4.3 Old Vendors Page (Deprecated)
**File:** `app/admin/vendors/page.tsx`

**Changes:**
- **Added deprecation notice banner** at top of page
- Banner explains new workflow
- "Go to Branches" button for easy navigation
- **Page remains functional** for backward compatibility during transition

**Deprecation Banner:**
```tsx
<div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
  <AlertCircle className="h-5 w-5 text-amber-600" />
  <div>
    <h3>Vendor Management Has Moved</h3>
    <p>Vendors are now managed within branches...</p>
    <Button onClick={() => router.push('/admin/branches')}>
      Go to Branches
    </Button>
  </div>
</div>
```

**Note:** Page can be deleted once all users are transitioned, or kept as admin-only "all vendors" view.

---

## User Experience Improvements

### Before (Problems):
❌ Could select any vendor globally  
❌ No branch-vendor validation  
❌ Confusing when vendor had no stock at branch  
❌ Two separate sidebar items (Branches + Vendors)  
❌ No clear hierarchy  

### After (Solutions):
✅ Must select branch before vendor  
✅ Only shows vendors assigned to that branch  
✅ Backend validates assignments  
✅ Clear error messages with guidance  
✅ Single entry point (Branches)  
✅ Hierarchical navigation: Branch → Vendors  

---

## Workflow Examples

### Adding Stock (New Flow)
```
1. Admin clicks "Manage Stock" on product
2. Stock modal opens
3. Admin selects Branch A
   → Vendor dropdown populates with vendors assigned to Branch A only
4. Admin selects Vendor John (assigned to Branch A)
5. Admin adds 50 units
6. ✅ Stock added successfully
```

**If vendor not assigned:**
```
3. Admin selects Branch B
   → Vendor dropdown shows: "No vendors assigned to branch"
   → Shows link: "Assign vendors"
4. Admin clicks link → Opens Branch B detail page → Vendors tab
5. Admin assigns Vendor John to Branch B
6. Returns to product → Can now add stock
```

### Creating Product (New Flow)
```
1. Admin opens "New Product" page
2. Fills product details (name, price, images)
3. Selects Branch: Main Branch
   → Vendor dropdown appears with Main Branch vendors
4. Selects Vendor: House Stock (auto-selected)
5. Enters initial stock: 100 units
6. Clicks "Create Product"
7. ✅ Product created with stock at Main Branch from House Stock vendor
```

---

## Error Handling

### Validation Errors
| Scenario | Error Message | User Action |
|----------|--------------|-------------|
| No branch selected | "Please select a branch" | Select a branch first |
| No vendor selected | "Please select a vendor" | Select a vendor from dropdown |
| Vendor not assigned | "Vendor X is not assigned to branch Y. Please assign the vendor..." | Assign vendor to branch |
| No vendors at branch | Link to "Assign vendors" | Go to branch detail → assign vendors |

### Backend Validation
```typescript
// Add Stock API Response (vendor not assigned)
{
  "error": "Vendor John Doe (JOHN) is not assigned to branch Main Branch. 
            Please assign the vendor to this branch first."
}
```

---

## Testing Checklist

### Stock Management Modal
- [ ] Open stock modal without selecting branch → vendor dropdown disabled
- [ ] Select branch → vendor dropdown populates with assigned vendors only
- [ ] Change branch → vendor list updates
- [ ] Try to add stock without vendor → shows error
- [ ] Add stock with valid branch+vendor → success
- [ ] Branch with no vendors → shows helpful message + link

### Product Stock Page
- [ ] Same tests as modal above
- [ ] Verify vendor list updates on branch change

### Product Creation
- [ ] Try to select vendor before branch → dropdown disabled
- [ ] Select branch → vendors appear
- [ ] Change branch → vendors update
- [ ] Create product with branch+vendor → success
- [ ] Verify initial stock is created for correct branch+vendor

### Navigation
- [ ] Vendors link removed from sidebar
- [ ] Branches page loads
- [ ] Click branch card → navigates to detail page
- [ ] Edit/delete buttons don't trigger navigation
- [ ] Old /admin/vendors page shows deprecation notice

### Backend Validation
- [ ] Try to add stock with unassigned vendor via API → error
- [ ] Try to remove stock with unassigned vendor → error
- [ ] Error messages are clear and helpful

---

## Migration Strategy

### For Existing Deployments

1. **Before Deployment:**
   - Run migration script: `npx ts-node scripts/migrate-branch-vendor-assignments.ts --dry-run`
   - Review assignment logs
   - Verify no errors

2. **Deploy Phase 1-2:**
   - Data model + APIs
   - Branch detail pages
   - Run migration script (live)

3. **Deploy Phase 3-4:**
   - Stock management updates
   - Navigation changes
   - Users see deprecation notice

4. **Monitor:**
   - Check for "vendor not assigned" errors
   - Ensure users can complete stock operations
   - Collect feedback

5. **Optional Cleanup:**
   - After 2-4 weeks, consider removing `/admin/vendors` page
   - Or keep as admin-only "all vendors" management page

---

## Technical Details

### API Changes
- `GET /api/admin/vendors?branchId=X` - Returns filtered vendor list
- Backward compatible (no branchId = all vendors)
- Response includes `branchFiltered: boolean` flag

### Component Changes
- All stock management components now require branch first
- Vendor fetching delayed until branch selected
- Clear loading/empty states

### Validation Layer
- Frontend: Disables vendor selection until branch chosen
- Backend: Validates BranchVendor assignment exists
- Double protection against incorrect assignments

---

## Files Modified

### Phase 3: Stock Management
- `components/admin/stock-management-modal.tsx`
- `app/admin/products/[id]/stock/page.tsx`
- `app/admin/products/new/page.tsx`
- `app/api/admin/products/add-stock/route.ts`
- `app/api/admin/products/remove-stock/route.ts`

### Phase 4: Navigation
- `lib/admin-navigation.ts`
- `app/admin/branches/page.tsx`
- `app/admin/vendors/page.tsx`

**Total:** 8 files modified

---

## Summary

✅ **Phase 3 Complete:** Stock management filters vendors by branch  
✅ **Phase 4 Complete:** Navigation reorganized, vendors accessed through branches  

**What Works:**
- Branch-scoped vendor selection in all stock operations
- Backend validation prevents invalid assignments
- Clear user guidance when vendors not assigned
- Hierarchical navigation (Branches → Vendors)
- Deprecation notice for old workflow

**What's Next:**
- Phase 5: POS Integration (if needed)
- Phase 6: Testing & validation
- Phase 7: Documentation & cleanup

---

**Status:** Phases 3 & 4 complete and ready for testing
**Deployment:** Can be deployed together with Phase 1-2
