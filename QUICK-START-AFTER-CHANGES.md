# Quick Start Guide - After POS Simplification

## 🚀 For Developers: What Changed

### TL;DR
- ✅ Auth is now unified - use `useUserStore()` everywhere
- ✅ POS cart stays separate - use `usePosCartStore()` for POS
- ✅ No breaking changes - everything still works
- ⚠️ Test auth flows before deploying

---

## 📝 Quick Reference

### Before (Old Way) ❌
```typescript
// DON'T use these anymore - they're deleted
import { usePosAuthStore } from '@/lib/pos/pos-auth-store' // ❌ DELETED
import { getPosUser } from '@/lib/pos/auth' // ❌ DELETED
```

### After (New Way) ✅
```typescript
// ✅ Use unified auth
import { useUserStore } from '@/lib/user-store'
import { requirePosAccess } from '@/lib/auth'

// In components
const { user, loginPos, checkAuth } = useUserStore()

// In API routes
const user = await requirePosAccess(request)
```

---

## 🔑 Common Tasks

### Task 1: Implement POS Login
```typescript
// app/pos-login/page.tsx
import { useUserStore } from '@/lib/user-store'

function PosLogin() {
  const { loginPos, user, isLoading } = useUserStore()
  
  const handleSubmit = async (email: string, password: string) => {
    const result = await loginPos(email, password)
    if (result.success) {
      router.push('/pos/make-sale')
    }
  }
  
  return <LoginForm onSubmit={handleSubmit} />
}
```

### Task 2: Check POS Access in Component
```typescript
// components/pos/some-component.tsx
import { useUserStore } from '@/lib/user-store'

function PosComponent() {
  const { user } = useUserStore()
  
  // User is guaranteed to have POS access if they reached this page
  // (pos-shell.tsx checks on mount)
  
  const canApplyDiscount = user?.posRole !== 'cashier'
  
  return <div>...</div>
}
```

### Task 3: Protect API Route
```typescript
// app/api/pos/something/route.ts
import { requirePosAccess } from '@/lib/auth'
import { createPosPermissionChecker, POS_PERMISSIONS } from '@/lib/pos/permissions'

export async function POST(request: NextRequest) {
  // Get authenticated POS user
  const user = await requirePosAccess(request)
  
  // Check specific permission
  const checker = createPosPermissionChecker(user as any)
  if (!checker.hasPosPermission(POS_PERMISSIONS.SALES_DISCOUNT)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    )
  }
  
  // Proceed with operation
  // ...
}
```

### Task 4: Use POS Cart
```typescript
// app/pos/make-sale/page.tsx
import { usePosCartStore } from '@/lib/pos/cart-store' // ✅ Still separate

function MakeSale() {
  const { items, addItem, getTotalMinor, clearCart } = usePosCartStore()
  
  const handleAddProduct = (product: Product) => {
    addItem({
      id: product._id,
      productId: product._id,
      productName: product.name,
      quantity: 1,
      retailUnitPrice: product.price,
      // ... other POS-specific fields
    })
  }
  
  return <div>...</div>
}
```

### Task 5: Offline Mode
```typescript
// Check auth with offline support
const { checkAuth } = useUserStore()

useEffect(() => {
  // Will validate JWT locally if offline
  checkAuth(true) // true = offline mode
}, [])
```

---

## 🧪 Testing Your Changes

### Quick Smoke Test (5 minutes)
```bash
# 1. Start dev server
npm run dev

# 2. Test POS login
# Visit: http://localhost:3000/pos-login
# Login with POS staff account
# Should redirect to /pos/make-sale

# 3. Test making a sale
# Search for product
# Add to cart
# Complete checkout
# Verify receipt

# 4. Test logout
# Click logout
# Should redirect to /pos-login

# 5. Test offline
# Open DevTools → Network → Offline
# Reload page
# Should stay logged in (offline JWT)
# Go back online
# Should still work
```

### Full Test (30 minutes)
See [PHASE-5-TESTING-CHECKLIST.md](./PHASE-5-TESTING-CHECKLIST.md)

---

## 🐛 Common Issues & Fixes

### Issue 1: "Cannot find module '@/lib/pos/pos-auth-store'"
**Cause**: You're importing deleted file  
**Fix**: 
```typescript
// Change this:
import { usePosAuthStore } from '@/lib/pos/pos-auth-store'

// To this:
import { useUserStore } from '@/lib/user-store'
```

### Issue 2: "POS access denied" 
**Cause**: User doesn't have POS role  
**Fix**: Admin needs to assign `posRole` in `/admin/settings/staff`

### Issue 3: "Session expired in offline mode"
**Cause**: JWT expired (24h for POS)  
**Fix**: User must reconnect online and re-login

### Issue 4: TypeScript error on `user.posRole`
**Cause**: Type definitions not updated  
**Fix**: User interface in `lib/user-store.ts` already includes posRole:
```typescript
export interface User {
  // ...
  posRole?: 'cashier' | 'senior_cashier' | 'supervisor' | 'manager' | 'administrator'
  assignedBranchId?: string
}
```

---

## 📚 Where to Find Things

### Authentication
- **Client hook**: `lib/user-store.ts` → `useUserStore()`
- **Server utils**: `lib/auth.ts` → `requirePosAccess()`
- **Login page**: `app/pos-login/page.tsx`
- **Shell (guards)**: `components/pos/pos-shell.tsx`

### POS Cart
- **Store**: `lib/pos/cart-store.ts` → `usePosCartStore()`
- **Usage**: `app/pos/make-sale/page.tsx`

### Permissions
- **Definitions**: `lib/pos/permissions.ts`
- **Checker**: `createPosPermissionChecker(user)`

### Documentation
- **Summary**: `POS-SIMPLIFICATION-SUMMARY.md`
- **Phase 4**: `PHASE-4-CLEANUP-COMPLETED.md`
- **Testing**: `PHASE-5-TESTING-CHECKLIST.md`
- **Architecture**: `PHASE-6-GOING-FORWARD.md`

---

## 🎯 Key Takeaways

### 1. Auth is Unified ✅
- One system: `lib/user-store.ts`
- One cookie: `auth-token`
- Use `loginPos()` for POS login
- Use `requirePosAccess()` in API routes

### 2. Cart is Separate (Intentional) ✅
- `lib/cart-store.ts` - E-commerce
- `lib/pos/cart-store.ts` - POS
- Different features, different needs
- Don't try to merge them

### 3. No Breaking Changes ✅
- Everything backward compatible
- No migration needed
- No downtime required
- Safe to deploy

### 4. Well Documented ✅
- Comprehensive guides available
- Testing checklist ready
- Architecture decisions explained
- Future roadmap clear

---

## 🚦 Deployment Checklist

### Before Deploying
- [ ] Run smoke tests locally
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser
- [ ] POS login works
- [ ] POS sale works
- [ ] Web login still works (regression test)

### After Deploying
- [ ] Monitor error logs for 1 hour
- [ ] Test POS login in production
- [ ] Verify sessions persist
- [ ] Check offline mode works
- [ ] Confirm no user complaints

---

## 💡 Tips for New Devs

### Understanding the Architecture
1. Read `POS-SIMPLIFICATION-SUMMARY.md` first (10 min)
2. Skim `PHASE-6-GOING-FORWARD.md` (15 min)
3. Look at code examples above (5 min)
4. Try smoke test (5 min)
5. Start coding! 🎉

### When Adding POS Features
1. Use `requirePosAccess()` for auth
2. Check permissions with `createPosPermissionChecker()`
3. Use `usePosCartStore()` for cart
4. Log financial ops to ledger
5. Consider offline mode

### When Debugging Auth Issues
1. Check browser DevTools → Application → Cookies
2. Look for `auth-token` (should be present)
3. Check console for errors
4. Verify user has `posRole` in database
5. Test with different roles

---

## 🎓 Learning Resources

### Code Examples
- `app/pos-login/page.tsx` - Login implementation
- `components/pos/pos-shell.tsx` - Auth guard
- `app/pos/make-sale/page.tsx` - Cart usage
- `app/api/pos/customers/[id]/route.ts` - API auth

### Documentation
- This file - Quick start
- `PHASE-5-TESTING-CHECKLIST.md` - How to test
- `PHASE-6-GOING-FORWARD.md` - Deep dive
- `POS-SIMPLIFICATION-SUMMARY.md` - Full context

---

## ❓ Need Help?

1. **Check documentation** - Likely already answered
2. **Look at examples** - See how existing code does it
3. **Run tests** - Might reveal the issue
4. **Ask team** - We're here to help!

---

**Version**: 1.0  
**Last Updated**: Phase 4 Completion  
**Status**: ✅ Ready to Use

**Quick Question?** Check the FAQ in `PHASE-6-GOING-FORWARD.md`
