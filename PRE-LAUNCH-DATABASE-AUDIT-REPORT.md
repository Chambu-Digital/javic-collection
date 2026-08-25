# PRE-LAUNCH DATABASE CLEANUP AUDIT REPORT
**Generated:** February 18, 2026  
**Database:** MongoDB (test database)  
**Total Collections:** 28  
**Total Records:** 130

---

## ⚠️ CRITICAL FINDINGS

### 1. **DATABASE NAME CONTAINS "TEST"**
Your MongoDB connection string connects to a database named **"test"**. This is a critical finding that needs immediate clarification:

- **If this IS your production database:** The name is misleading and should be renamed to avoid confusion
- **If this is NOT your production database:** You are auditing the wrong database! Connect to production instead

**Action Required:** Verify you are connected to the correct production database before proceeding with any cleanup.

### 2. **NODE_ENV SET TO DEVELOPMENT**
Your environment is set to `development` mode. For production launch:
- Set `NODE_ENV=production` in your deployment environment
- Ensure development-only features are disabled

### 3. **SEED SCRIPT CAN RECREATE TEST DATA**
The application has a seed script (`lib/seed.ts`) accessible via `/admin/seed` page that:
- Deletes all existing categories and products
- Inserts predefined test/sample products (Rose Petal Face Serum, Lavender Body Oil, etc.)
- Can be triggered by any admin user

**CRITICAL:** If you clean the database but leave this page active, someone could accidentally recreate test data!

**Action Required:** Disable or remove `/admin/seed` page before production launch.

---

## 📊 DATABASE INVENTORY BY COLLECTION

### **SYSTEM CONFIGURATION (DO NOT DELETE)**

#### 1. **branches** (1 record)
- **Purpose:** Physical branch/location management for inventory tracking
- **Contains:** Main Branch (code: M, isMainBranch: true)
- **Relationships:** branchstocks, orders
- **Recommendation:** **KEEP** - Required for inventory system
- **Note:** System prevents deletion if branch has historical stock or orders

#### 2. **vendors** (2 records)
- **Purpose:** Vendor/supplier tracking for inventory
- **Contains:**
  - House Stock (code: HOUSE, isHouseStock: true)
  - Mama Vic (code: MV, isHouseStock: false)
- **Relationships:** branchstocks, orders
- **Recommendation:** **KEEP** - Required for inventory system
- **Note:** House Stock vendor cannot be deleted (system protection)

#### 3. **posoutlets** (1 record)
- **Purpose:** Point of Sale outlet configuration
- **Contains:** Main Shop (code: MAIN)
- **Relationships:** orders, users, posheldorders, posauditentries
- **Recommendation:** **KEEP** - Required for POS system operation

#### 4. **sitesettings** (1 record)
- **Purpose:** Application-wide configuration (watermark settings, etc.)
- **Recommendation:** **KEEP** - System configuration

#### 5. **notificationsettings** (1 record)
- **Purpose:** System notification preferences
- **Recommendation:** **KEEP** - System configuration

#### 6. **outlets** (1 record)
- **Purpose:** Sales outlet records
- **Relationships:** orders
- **Recommendation:** **KEEP** - Configuration data

---

### **USER ACCOUNTS (MIXED - REVIEW CAREFULLY)**

#### 7. **users** (6 records)
- **Purpose:** User authentication and authorization
- **Admin/System Accounts (KEEP):**
  - admin@javic.com (role: admin, provider: local)
  - superadmin@javic.com (role: super_admin, provider: local)
  - admin@javic.co.ke (role: super_admin, provider: local)
  - jay@javic.co.ke (role: admin, provider: local)

- **Customer Accounts:**
  - vickiemimo@gmail.com (role: customer, provider: google)
  - jeremihjay999@gmail.com (role: customer, provider: local)

**Analysis:**
- 4 admin accounts (67% of users)
- 2 customer accounts (33% of users)
- No obvious test account names (no "test@", "demo@", etc.)
- Both customer accounts appear legitimate (real Gmail addresses)

**Relationships:** orders, reviews, adminrequests

**Recommendation:** **KEEP ALL**
- Admin accounts are required for system access
- Customer accounts appear legitimate
- Check if these customers have placed real orders before considering deletion

---

### **PRODUCTS & CATALOG (PRODUCTION DATA - REVIEW)**

#### 8. **products** (10 records)
- **Purpose:** Product catalog for e-commerce
- **Category:** All products are in "Sleepwear & Loungewear" or "Lingerie" categories
- **Relationships:** orders, reviews, branchstocks, categories

**Current Products:**
1. Scarlet Allure 3-Piece Sheer Nightdress Set - KSH 2,500 (0 stock)
2. Sweet Cherry Ribbed Cami & Shorts Lounge Set - KSH 1,500 (in stock)
3. See-Through Lace Lingerie Set with Strings & Slit - KSH 1,500 (in stock)
4. Ribbed Cherry 2-Piece Pajama Set - KSH 1,000 (in stock)
5. High-End Camisole & Shorts Loungewear Set - KSH 1,500 (in stock)
6. Ladies Love Hearts 3-Piece Pajama Set - KSH 2,000 (0 stock)
7. V-Neck Soft Silk Lace Camisole & Pants Set - KSH 2,000 (0 stock)
8. Butterfly Print Lace-Trim Pajama Set - KSH 1,500 (in stock)
9. Floral Print Lace Cami & Robe 3-Piece Set - KSH 1,500 (in stock)
10. Cherry Print Cami & Shorts Pajama Set - KSH 2,000 (0 stock)

**Analysis:**
- These products are **NOT from the seed script** (seed script has skincare/beauty products)
- Product names suggest this is a **real sleepwear/lingerie business** (Javic)
- 3 products (30%) have zero stock - possibly discontinued or awaiting restock
- Price range: KSH 1,000 - 2,500 (reasonable retail pricing)

**Recommendation:** **KEEP** - These appear to be your actual product catalog, not test data

---

#### 9. **categories** (3 records)
- **Purpose:** Product categorization
- **Contains:**
  - Sleepwear & Loungewear (slug: sleepwear-loungewear)
  - Lingerie (slug: lingerie)
  - Night Dresses (slug: night-dresses)

**Analysis:**
- These categories are **NOT from the seed script** (seed script has skincare categories)
- Categories align with the actual products in the database
- All categories are actively used (products exist in these categories)

**Recommendation:** **KEEP** - These are your production categories

---

### **ORDERS & TRANSACTIONS (PRODUCTION DATA - CRITICAL)**

#### 10. **orders** (12 records)
- **Purpose:** Customer order history and sales records
- **Channel:** All orders are POS (Point of Sale) orders
- **Status:** All orders are "completed"
- **Relationships:** users, products, mpesatransactions, reviews

**Sample Order Numbers:**
- POS260723594 - KSH 1,500
- POS260723358 - KSH 1,500
- POS260723825 - KSH 1,500
- POS260723293 - KSH 1,500
- POS260723590 - KSH 1,500
- (7 more orders...)

**Analysis:**
- **ALL orders are from July 26, 2023** (order numbers: POS260723xxx)
- All orders are POS (in-store) transactions, not online orders
- No obvious test indicators (no test emails, no 000000 phone numbers)
- All orders completed successfully (no cancelled/failed orders)
- Order amounts are consistent with product prices (KSH 1,500 typical)

**Critical Questions:**
1. Are these orders from your initial POS testing/training?
2. Are these real customer purchases from 2.5 years ago?
3. Do you need to keep them for financial/tax records?

**Recommendation:** **MANUAL REVIEW REQUIRED**
- If these are real sales: **KEEP for financial/audit records**
- If these are POS training/demo transactions: **CONSIDER DELETING**
- **Check with your accountant** before deleting any order data

---

#### 11. **ledgerentries** (29 records)
- **Purpose:** Financial accounting ledger (double-entry bookkeeping)
- **Relationships:** orders, credittransactions
- **Contains:** Financial transaction records

**Analysis:**
- 29 ledger entries for 12 orders suggests 2-3 entries per order (typical for double-entry)
- These entries track debits/credits for each transaction
- Critical for financial reconciliation and audit trail

**Recommendation:** **MANUAL REVIEW - CRITICAL FINANCIAL DATA**
- **NEVER delete ledger entries without consulting your accountant**
- If orders are deleted, corresponding ledger entries should also be deleted
- If keeping orders, you **MUST keep** corresponding ledger entries

---

#### 12. **mpesatransactions** (0 records)
- **Purpose:** M-Pesa payment tracking
- **Status:** Empty (no M-Pesa transactions recorded)
- **Analysis:** Your POS orders likely used cash payment, not M-Pesa

**Recommendation:** **SAFE - No data to clean**

---

### **INVENTORY TRACKING (PRODUCTION DATA)**

#### 13. **branchstocks** (43 records)
- **Purpose:** Per-branch, per-vendor inventory tracking
- **Tracks:** 7 unique products across branch(es) and vendor(s)
- **Relationships:** products, branches, vendors

**Analysis:**
- 43 stock records for 10 products suggests multiple variants per product
- Tracks inventory by:
  - Branch (which location has stock)
  - Vendor (who supplied the stock - House Stock vs Mama Vic)
  - Image variant (different designs/colors)
  - Size (if applicable)

**Recommendation:** **KEEP**
- This is your current inventory tracking
- Deleting this will lose all inventory counts
- Only delete if you're starting with a fresh inventory count

---

### **POS SYSTEM DATA (PRODUCTION/TEST MIX - REVIEW)**

#### 14. **posheldorders** (2 records)
- **Purpose:** Orders that were started but "held" (not completed)
- **Analysis:** These are likely:
  - Customer orders put on hold (to be completed later)
  - OR training/test orders that were never completed

**Recommendation:** **MANUAL REVIEW**
- Check if these are real customer holds or test data
- If test data: **SAFE TO DELETE**
- If real holds: **KEEP** until customer returns

---

#### 15. **posauditentries** (8 records)
- **Purpose:** Audit trail of POS system actions
- **Analysis:** Tracks who did what in the POS system (login, logout, sales, etc.)

**Recommendation:** **REVIEW**
- If these are from POS training/testing: **SAFE TO DELETE**
- If these are production audit logs: **KEEP for audit compliance**
- Can be cleared for fresh start if desired

---

### **MARKETING & CONTENT (PRODUCTION DATA)**

#### 16. **campaigns** (1 record)
- **Purpose:** Marketing campaign management
- **Contains:** "Valentines gift" (status: active)
- **Relationships:** campaignanalytics

**Analysis:**
- Single active campaign for Valentine's Day
- May be a past campaign that's still marked "active"

**Recommendation:** **KEEP but review**
- Update status to "expired" if campaign is over
- This is production marketing data, not test data

---

#### 17. **campaignanalytics** (3 records)
- **Purpose:** Campaign performance metrics (views, clicks, etc.)
- **Relationships:** campaigns

**Recommendation:** **SAFE TO DELETE**
- Analytics data can be regenerated
- Safe to clear for fresh analytics on launch
- **This is the only collection we recommend deleting with high confidence**

---

#### 18. **banners** (6 records)
- **Purpose:** Homepage/promotional banner images
- **Analysis:** 6 active banners currently displayed

**Recommendation:** **KEEP but review**
- These are your current homepage banners
- Review to ensure banners are appropriate for launch
- Not test data

---

#### 19. **blogposts** (0 records)
- **Purpose:** Blog/content management
- **Status:** Empty (no blog posts yet)

**Recommendation:** **SAFE - No data**

---

### **REVIEWS & ENGAGEMENT (EMPTY)**

#### 20. **reviews** (0 records)
- **Purpose:** Product reviews from customers
- **Status:** Empty

**Recommendation:** **SAFE - No data to clean**

---

#### 21. **productviews** (0 records)
- **Purpose:** Product view tracking/analytics
- **Status:** Empty

**Recommendation:** **SAFE - No data to clean**

---

### **ADMIN WORKFLOWS (EMPTY)**

#### 22. **adminrequests** (0 records)
- **Purpose:** Pending admin registration requests
- **Status:** Empty (no pending requests)

**Recommendation:** **SAFE - No data to clean**

---

### **CREDIT SYSTEM (EMPTY)**

#### 23. **customercreditaccounts** (0 records)
- **Purpose:** Customer credit account balances
- **Status:** Not in use

**Recommendation:** **SAFE - No data**

---

#### 24. **credittransactions** (0 records)
- **Purpose:** Credit transaction history
- **Status:** Not in use

**Recommendation:** **SAFE - No data**

---

### **LOCATION DATA (EMPTY)**

#### 25. **areas** (0 records)
- **Purpose:** Delivery areas/locations
- **Status:** Not populated

**Recommendation:** **SAFE - No data**

---

#### 26. **counties** (0 records)
- **Purpose:** Kenya counties reference data
- **Status:** Not populated

**Recommendation:** **SAFE - No data**

---

### **POS CONFIGURATION (EMPTY)**

#### 27. **possettings** (0 records)
- **Purpose:** POS system settings
- **Status:** Using defaults (no custom settings)

**Recommendation:** **SAFE - No data**

---

### **UNKNOWN COLLECTIONS**

#### 28. **exams** (0 records)
- **Purpose:** UNKNOWN - Not part of application schema
- **Analysis:** This collection is not defined in your models
- **Possible Origin:**
  - Leftover from a different project using the same database
  - MongoDB Compass or other tool created it accidentally
  - Test/demo from a tutorial

**Recommendation:** **INVESTIGATE**
- This collection doesn't belong to your application
- Safe to ignore (empty) or delete

---

## 🔍 DATA INTEGRITY ANALYSIS

### ✅ **GOOD NEWS - NO INTEGRITY ISSUES FOUND**

1. **No Orphaned Orders** - All orders reference existing users
2. **No Orphaned Reviews** - No reviews (collection empty)
3. **No Orphaned Stock Records** - All branch stock records reference existing products
4. **No Duplicate Accounts** - All user emails are unique
5. **No Broken Relationships** - All foreign key references are valid

---

## 🎯 CLEANUP RECOMMENDATIONS

### **PHASE 1: SAFE CLEANUP (Can Delete Now)**

#### ✅ Safe to Delete:
1. **campaignanalytics** (3 records)
   - Reason: Analytics data, can be regenerated
   - Action: Delete all records
   - Risk: None

#### Empty Collections (Nothing to Clean):
- reviews (0)
- productviews (0)
- adminrequests (0)
- blogposts (0)
- customercreditaccounts (0)
- credittransactions (0)
- mpesatransactions (0)
- areas (0)
- counties (0)
- possettings (0)
- exams (0)

---

### **PHASE 2: CONDITIONAL CLEANUP (Verify First)**

#### ⚠️ Verify Before Deleting:

1. **orders** (12 records) - **CRITICAL DECISION NEEDED**
   - **IF these are POS training/demo orders:** Delete them
   - **IF these are real sales from 2.5 years ago:** Keep for records
   - **Action:** Manually review order details (customer names, phone numbers, items purchased)
   - **Dependencies:** If deleted, also delete corresponding:
     - ledgerentries (29 records)
   - **Risk:** Loss of financial audit trail

2. **posheldorders** (2 records)
   - **IF these are test holds:** Delete them
   - **IF these are real customer holds:** Keep them
   - **Action:** Open POS system and check held order details
   - **Risk:** Low (can be recreated if needed)

3. **posauditentries** (8 records)
   - **IF from POS training/testing:** Safe to delete
   - **IF production audit logs:** Keep for compliance
   - **Action:** Review audit log entries
   - **Risk:** Loss of audit trail (may be required for compliance)

---

### **PHASE 3: DO NOT DELETE**

#### 🛡️ Keep These Collections:
- users (6) - **Required for system access**
- products (10) - **Your product catalog**
- categories (3) - **Your category structure**
- branches (1) - **Required for inventory system**
- vendors (2) - **Required for inventory system**
- branchstocks (43) - **Your current inventory**
- posoutlets (1) - **Required for POS operation**
- sitesettings (1) - **System configuration**
- notificationsettings (1) - **System configuration**
- campaigns (1) - **Active marketing campaign**
- banners (6) - **Current homepage banners**
- outlets (1) - **Sales outlet config**

---

## 📋 PRE-LAUNCH CHECKLIST

### **CRITICAL ACTIONS BEFORE LAUNCH**

- [ ] **1. Verify Database Connection**
  - [ ] Confirm you're connected to the production database
  - [ ] Rename database from "test" to a production name (e.g., "javic-prod")
  - [ ] Update MONGODB_URI in .env.local with correct database name

- [ ] **2. Environment Configuration**
  - [ ] Set `NODE_ENV=production` in deployment environment
  - [ ] Verify `NEXT_PUBLIC_BASE_URL=https://javic.co.ke`
  - [ ] Secure all API secrets (JWT_SECRET, CLEAR_DB_TOKEN, etc.)

- [ ] **3. Disable Development Features**
  - [ ] **CRITICAL:** Disable or remove `/admin/seed` page
  - [ ] Remove or protect `/admin/reset-all-passwords` page
  - [ ] Remove or protect `/api/admin/clear-database` endpoint
  - [ ] Verify these endpoints require strong authentication

- [ ] **4. Review Test Data**
  - [ ] Review 12 orders to determine if test or production
  - [ ] Review 2 held orders in POS system
  - [ ] Review 8 POS audit entries
  - [ ] Decide on ledger entries (if deleting orders)

- [ ] **5. Database Backup**
  - [ ] Create full database backup before any cleanup
  - [ ] Test backup restoration procedure
  - [ ] Document backup location and process

- [ ] **6. Cleanup Execution**
  - [ ] Delete campaignanalytics (3 records) - Safe
  - [ ] Delete test orders (if confirmed as test data)
  - [ ] Delete corresponding ledger entries (if deleting orders)
  - [ ] Delete test held orders (if confirmed as test)
  - [ ] Delete test audit logs (if desired fresh start)

- [ ] **7. Final Verification**
  - [ ] Run this audit script again to verify cleanup
  - [ ] Test user login (admin and customer)
  - [ ] Test product browsing
  - [ ] Test cart and checkout flow
  - [ ] Test POS order creation
  - [ ] Test payment processing (if applicable)
  - [ ] Test order tracking
  - [ ] Test admin dashboard access

- [ ] **8. Monitoring Setup**
  - [ ] Set up error monitoring (Sentry, etc.)
  - [ ] Set up uptime monitoring
  - [ ] Configure database backup automation
  - [ ] Set up performance monitoring

---

## 🚨 SEED SCRIPT WARNING

### **CRITICAL SECURITY ISSUE**

Your application has a seed script that can be triggered by ANY admin user via:
- **URL:** `/admin/seed`
- **API:** `/api/seed` (POST request)

**What it does:**
1. **DELETES ALL** categories
2. **DELETES ALL** products
3. Inserts test/sample products (skincare, beauty products)

**This is DANGEROUS in production because:**
- An admin could accidentally click "Seed Database"
- Your entire product catalog would be deleted
- Replaced with test skincare products (not your real inventory)
- All branch stock records would become orphaned

### **REQUIRED ACTIONS:**

#### Option 1: Remove Completely (Recommended)
```bash
# Delete these files:
rm app/admin/seed/page.tsx
rm app/api/seed/route.ts  # Find and delete this route
rm lib/seed.ts
```

#### Option 2: Protect with Environment Check
Add this check to `/api/seed/route.ts`:
```typescript
// Only allow seeding in development
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json(
    { error: 'Seeding is disabled in production' },
    { status: 403 }
  );
}
```

#### Option 3: Require Special Authorization
Add a secret token requirement:
```typescript
const authToken = request.headers.get('x-seed-token');
if (authToken !== process.env.SEED_SECRET_TOKEN) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}
```

---

## 📊 RISK ASSESSMENT SUMMARY

### **NO RISK (Safe to Delete)**
- campaignanalytics (3) - Analytics data
- Empty collections (12 collections)

### **LOW RISK (Review and Decide)**
- posheldorders (2) - Held POS orders
- posauditentries (8) - Audit logs

### **MEDIUM RISK (Careful Review Required)**
- orders (12) - **May be production sales**
- ledgerentries (29) - **Financial records**

### **HIGH RISK (Do Not Delete)**
- users (6) - System access
- products (10) - Product catalog
- categories (3) - Category structure
- branches (1) - Inventory system
- vendors (2) - Inventory system
- branchstocks (43) - Current inventory
- All system configuration collections

---

## 🎬 RECOMMENDED CLEANUP SCRIPT

**AFTER reviewing this audit and making your decisions, you can execute cleanup like this:**

```javascript
// database-cleanup.js
const { MongoClient } = require('mongodb');

async function performCleanup() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Phase 1: Safe Cleanup
    console.log('Phase 1: Deleting analytics data...');
    await db.collection('campaignanalytics').deleteMany({});
    console.log('✓ Deleted campaignanalytics');
    
    // Phase 2: Conditional Cleanup (UNCOMMENT AFTER VERIFICATION)
    
    // Delete test orders (ONLY if confirmed as test data)
    // const testOrderIds = ['order_id_1', 'order_id_2']; // ADD IDs after verification
    // await db.collection('orders').deleteMany({ _id: { $in: testOrderIds } });
    
    // Delete test held orders (ONLY if confirmed as test)
    // await db.collection('posheldorders').deleteMany({});
    
    // Delete audit logs (if desired fresh start)
    // await db.collection('posauditentries').deleteMany({});
    
    // Delete corresponding ledger entries (ONLY if deleting orders)
    // await db.collection('ledgerentries').deleteMany({ orderId: { $in: testOrderIds } });
    
    console.log('Cleanup complete!');
    
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await client.close();
  }
}
```

---

## 📝 FINAL RECOMMENDATIONS

### **Based on this audit, here's what you should do:**

1. **✅ SAFE TO DELETE NOW:**
   - campaignanalytics (3 records) - Only data we're confident is safe to delete

2. **❓ REQUIRES YOUR DECISION:**
   - **12 orders from July 26, 2023** - Are these real sales or POS training?
     - If real: Keep them (and the 29 ledger entries)
     - If test: Delete them (and the 29 ledger entries)
   - **2 held POS orders** - Check if real or test
   - **8 audit entries** - Keep for compliance or clear for fresh start

3. **🛡️ DO NOT DELETE:**
   - Everything else (users, products, categories, inventory, configuration)
   - These are your production data and system configuration

4. **🚨 CRITICAL ACTIONS:**
   - Disable `/admin/seed` page (prevents accidental data deletion)
   - Verify database name (currently "test" - rename to production name)
   - Set NODE_ENV=production in deployment
   - Create database backup before any changes

---

## 📞 NEXT STEPS

1. **Review this report carefully**
2. **Make decisions on the "requires verification" items**
3. **Create a database backup**
4. **Execute Phase 1 cleanup (safe items)**
5. **Disable seed page**
6. **Execute Phase 2 cleanup (verified items)**
7. **Run audit again to confirm**
8. **Proceed with launch**

---

**Report End**  
*No data was modified during this audit.*  
*A machine-readable version is available in `database-audit-report.json`*
