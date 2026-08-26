# POS Branch Selector UI Refactor

## Change Summary

Moved the branch selector from the main POS page content area to the sidebar menu for better UX and consistency across all POS pages.

## Why This Change?

1. **Global Context**: Branch selection affects the entire POS session, not just the sale page
2. **Persistent Visibility**: Branch selector is now always visible in the sidebar
3. **Cleaner Layout**: Main page has more space for products and cart
4. **Better UX**: Branch changes are intentional sidebar actions, not accidentally triggered
5. **Consistency**: All POS pages now see the same branch context

## Implementation

### 1. **POS Shell (`components/pos/pos-shell.tsx`)**
   - Added branch management state (branches, selectedBranchId, loadingBranches)
   - Loads branches on mount
   - Auto-selects main branch or first active branch
   - Handles branch changes with cart clear confirmation
   - Updates cart store with selected branch via `setCurrentBranch()`
   - Passes branch state down to sidebar

### 2. **POS Sidebar (`components/pos/pos-sidebar.tsx`)**
   - Added branch selector UI between logo and navigation menu
   - Shows branch name in dropdown
   - Shows branch code below selector
   - Disabled state when loading or no branches available
   - Clean, compact design matching sidebar aesthetics

### 3. **Make Sale Page (`app/pos/make-sale/page.tsx`)**
   - **Removed**: Local branch state (branches, selectedBranchId, selectedBranchCode)
   - **Removed**: Branch loading effect
   - **Removed**: handleBranchChange function
   - **Removed**: Branch selector UI from page content
   - **Removed**: Building2 icon import
   - **Removed**: Branch code display from cart items (redundant now)
   - **Uses**: `currentBranchId` from cart store (set by shell)
   - Product search still filters by `currentBranchId` correctly

## User Flow

```
POS loads
    ↓
Shell loads branches
    ↓
Auto-selects main/first branch
    ↓
Updates cart store with branch context
    ↓
User sees branch in sidebar
    ↓
All pages use currentBranchId from cart store
    ↓
User changes branch in sidebar
    ↓
Confirms cart clear if items exist
    ↓
Cart store updates
    ↓
All pages refetch with new branch
```

## Benefits

✅ **Single Source of Truth**: Branch is set once in shell, used everywhere  
✅ **No Duplication**: Each page doesn't need its own branch selector  
✅ **Cart Protection**: Shell handles cart clearing when branch changes  
✅ **Always Visible**: Branch is always shown in sidebar, never hidden  
✅ **Clean Layout**: Make Sale page is less cluttered  
✅ **Extensible**: Future POS pages automatically get branch context  

## Files Changed

- **`components/pos/pos-shell.tsx`**: Added branch management logic
- **`components/pos/pos-sidebar.tsx`**: Added branch selector UI
- **`app/pos/make-sale/page.tsx`**: Removed local branch management, uses cart store

## Testing

1. ✅ Branch selector appears in sidebar
2. ✅ Auto-selects main branch on load
3. ✅ Changing branch clears cart with confirmation
4. ✅ Product search filters by selected branch
5. ✅ Variant selector uses correct branch
6. ✅ Sales complete with correct branch tracking
7. ✅ Branch selection persists across POS page navigation

## Related Documentation

- `POS-IMAGE-STOCK-FIX.md` - Image-level stock enrichment fix
- `POS-BRANCH-INVENTORY-FIX.md` - Original branch inventory implementation
- `pos.md` - Full POS requirements specification
