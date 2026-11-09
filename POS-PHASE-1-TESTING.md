# POS Phase 1 - Testing Guide

## 🎯 What Was Built

Phase 1 implements the POS login and navigation shell:
- User model updated with `canAccessPOS` field
- POS login page at `/pos-login`
- POS layout with sidebar navigation
- Dashboard page
- Placeholder pages (Make Sale, Inventory)
- Branches API endpoint

---

## 📋 Pre-Testing Setup

### 1. Grant POS Access to an Admin User

You need to manually set `canAccessPOS: true` for at least one admin user in MongoDB.

**Option A: Using MongoDB Compass or Shell**
```javascript
// Find an admin user
db.users.findOne({ role: 'admin' })

// Update to grant POS access
db.users.updateOne(
  { email: 'your-admin@email.com' },
  { $set: { canAccessPOS: true } }
)

// Verify
db.users.findOne({ email: 'your-admin@email.com' }, { canAccessPOS: 1, role: 1 })
```

**Option B: Using the provided script**
Create a file `grant-pos-access.js`:
```javascript
const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const email = process.argv[2]
    if (!email) {
      console.log('Usage: node grant-pos-access.js <email>')
      process.exit(1)
    }

    const result = await mongoose.connection.db.collection('users').updateOne(
      { email, role: { $in: ['admin', 'super_admin'] } },
      { $set: { canAccessPOS: true } }
    )

    if (result.matchedCount === 0) {
      console.log('❌ Admin user not found with email:', email)
    } else {
      console.log('✅ POS access granted to:', email)
    }

    process.exit(0)
  })
```

Run: `node grant-pos-access.js admin@example.com`

### 2. Ensure You Have Branches

Check if branches exist:
```javascript
db.branches.find({ isActive: true })
```

If none exist, create a test branch via admin panel or MongoDB:
```javascript
db.branches.insertOne({
  name: "Main Shop",
  branchCode: "MAIN",
  location: "Nairobi",
  isActive: true,
  isMainBranch: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## 🧪 Test Cases

### Test 1: POS Login - Successful Access ✅

**Steps:**
1. Navigate to `http://localhost:3000/pos-login`
2. Enter email/password for user with `canAccessPOS: true` and `role: admin`
3. Click "Sign In to POS"

**Expected Result:**
- ✅ Redirects to `/pos` (dashboard)
- ✅ Shows welcome message with user's name
- ✅ Sidebar visible with navigation items
- ✅ Branch selector shows available branches

---

### Test 2: POS Login - Access Denied (No POS Access) ❌

**Steps:**
1. Navigate to `http://localhost:3000/pos-login`
2. Enter email/password for user with `canAccessPOS: false` or undefined
3. Click "Sign In to POS"

**Expected Result:**
- ❌ Shows error: "Your account does not have POS access. Please contact your administrator."
- ❌ Does NOT redirect to `/pos`
- ❌ User is logged out

---

### Test 3: POS Login - Customer Account ❌

**Steps:**
1. Navigate to `http://localhost:3000/pos-login`
2. Enter email/password for user with `role: customer`
3. Click "Sign In to POS"

**Expected Result:**
- ❌ Shows error: "POS access denied. Admin credentials required."
- ❌ Does NOT redirect to `/pos`

---

### Test 4: Direct Access Without Login 🔒

**Steps:**
1. Clear cookies/logout
2. Navigate directly to `http://localhost:3000/pos`

**Expected Result:**
- ✅ Redirects to `/pos-login`
- ✅ Shows POS login form

---

### Test 5: Branch Selector 🏢

**Steps:**
1. Login successfully to POS
2. Look at sidebar (desktop) or header (after opening mobile menu)
3. Click branch dropdown

**Expected Result:**
- ✅ Shows all active branches
- ✅ Main branch appears first
- ✅ Can select different branch
- ✅ Selected branch updates in header
- ✅ Branch name shown with location (if available)

---

### Test 6: Sidebar Navigation 🧭

**Steps:**
1. Login to POS
2. Click each sidebar item

**Expected Results:**

**Make Sale:**
- ✅ Navigates to `/pos/make-sale`
- ✅ Shows placeholder page with feature descriptions
- ✅ "Coming Soon" badge visible

**Inventory:**
- ✅ Navigates to `/pos/inventory`
- ✅ Shows placeholder page with feature descriptions
- ✅ "Coming Soon" badge visible

**Other Items (Held Orders, Customers, Credit, Reports, Sync):**
- ✅ Marked with "Soon" tag
- ✅ Grayed out / disabled
- ✅ No navigation occurs when clicked

---

### Test 7: Mobile Responsive 📱

**Steps:**
1. Login to POS
2. Resize browser to mobile width (< 1024px)

**Expected Result:**
- ✅ Sidebar hidden by default
- ✅ Hamburger menu icon visible in top-left
- ✅ Clicking hamburger opens sidebar drawer
- ✅ Branch selector visible in mobile sidebar
- ✅ Clicking sidebar item closes the drawer
- ✅ User info visible at bottom of mobile sidebar

---

### Test 8: Dashboard Content 📊

**Steps:**
1. Login to POS
2. View dashboard at `/pos`

**Expected Result:**
- ✅ Welcome banner with gradient background
- ✅ User's first name displayed
- ✅ Two quick action cards (Make Sale, Inventory)
- ✅ Four placeholder stat cards (all showing 0)
- ✅ Coming soon features section
- ✅ Getting started tips card

---

### Test 9: Logout Functionality 🚪

**Steps:**
1. Login to POS
2. Click "Logout" button in sidebar (bottom)

**Expected Result:**
- ✅ User logged out
- ✅ Redirects to `/pos-login`
- ✅ Cannot access `/pos` routes anymore

---

### Test 10: API Branches Endpoint 🔌

**Steps:**
1. Login to POS
2. Open browser DevTools > Network tab
3. Reload page

**Expected Result:**
- ✅ Request to `/api/branches` succeeds (200)
- ✅ Returns JSON with `{ success: true, branches: [...] }`
- ✅ Only active branches returned
- ✅ Main branch first in array

**Manual API Test:**
```bash
# Get auth token from browser cookies (auth-token)
curl http://localhost:3000/api/branches \
  -H "Cookie: auth-token=YOUR_TOKEN_HERE"
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "POS access denied" even for admin
**Fix:** Check MongoDB - ensure `canAccessPOS: true` is set for the user

### Issue 2: Branch selector is empty
**Fix:** Create at least one active branch in MongoDB or via admin panel

### Issue 3: Middleware redirects not working
**Fix:** Ensure `middleware.ts` is at project root and middleware config includes the pattern

### Issue 4: TypeScript errors on `canAccessPOS`
**Fix:** Restart TypeScript server or rebuild: `npm run build`

### Issue 5: 401 Unauthorized on `/api/branches`
**Fix:** Ensure user is logged in and `auth-token` cookie exists

---

## ✅ Success Criteria

Phase 1 is complete when:

- [x] POS login page works
- [x] Only users with `canAccessPOS` can access POS
- [x] Customers cannot access POS
- [x] Branch selector loads and works
- [x] Sidebar navigation displays correctly
- [x] Active routes (Make Sale, Inventory) are accessible
- [x] Disabled routes show "Soon" badge and don't navigate
- [x] Mobile responsive layout works
- [x] Logout redirects to login page
- [x] Dashboard displays welcome and placeholders

---

## 📝 Manual Verification Checklist

```
□ Created test admin user with canAccessPOS: true
□ Created at least one active branch
□ Can login at /pos-login
□ Access denied for users without POS access
□ Access denied for customers
□ Dashboard loads at /pos
□ Branch selector populates with branches
□ Can select different branches
□ Make Sale page loads
□ Inventory page loads
□ Disabled menu items show "Soon" badge
□ Mobile menu works (hamburger opens/closes)
□ Logout works and redirects to login
□ Direct access to /pos without login redirects to /pos-login
□ API endpoint /api/branches returns branches
```

---

## 🚀 Next Steps (Phase 2)

Once Phase 1 testing passes:

1. **Make Sale Implementation**
   - Product search and grid
   - Variant/size selection modal
   - Cart management
   - Payment processing

2. **Inventory Implementation**
   - Stock display by branch
   - Search and filters
   - Vendor information

3. **Additional Features**
   - Held orders
   - Customer management
   - Credit accounts
   - Reports & ledger

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check network tab for failed API calls
3. Verify MongoDB data (user, branches)
4. Check server logs for backend errors

**Test Environment:**
- Node.js version: Check with `node -v`
- MongoDB connection: Check `.env.local`
- Next.js version: Check `package.json`

---

**Phase 1 Complete!** 🎉
Ready to move to Phase 2: Make Sale & Inventory implementation.
