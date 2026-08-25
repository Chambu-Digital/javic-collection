# Quick Pre-Launch Cleanup Guide

**TL;DR:** Your database is mostly production data. Only 3 records are definitely safe to delete.

---

## 🚦 WHAT CAN I DELETE?

### ✅ **SAFE TO DELETE** (Do it now)
- **campaignanalytics** (3 records) - Analytics can be regenerated

### ⚠️ **NEED YOUR DECISION** (Check these first)
- **12 orders from July 2023** - Are these real sales or POS training?
- **2 held POS orders** - Check if test or real customer holds
- **8 audit log entries** - Keep for compliance or clear for fresh start

### 🛡️ **DO NOT DELETE** (Everything else)
- 6 users (your admin accounts)
- 10 products (your sleepwear/lingerie catalog)
- 3 categories (your product categories)
- 43 inventory records (your current stock)
- All system configuration

---

## 🚨 CRITICAL ISSUES TO FIX

### 1. **DISABLE THE SEED PAGE** (Most Important!)
Your `/admin/seed` page can DELETE ALL PRODUCTS and replace them with test skincare products!

**Fix:** Delete or disable `/app/admin/seed/page.tsx` before launch

### 2. **DATABASE NAME**
Your database is called "test" but contains production data. Consider renaming.

### 3. **ENVIRONMENT**
Set `NODE_ENV=production` in your deployment

---

## 📋 PRE-LAUNCH CHECKLIST

```
[ ] 1. Create database backup
[ ] 2. Delete campaignanalytics (safe)
[ ] 3. Review and delete test orders (if any)
[ ] 4. DISABLE /admin/seed page
[ ] 5. Set NODE_ENV=production
[ ] 6. Test critical flows (login, checkout, POS)
[ ] 7. Launch! 🚀
```

---

## 💡 GOOD NEWS

Your database is in good shape:
- ✅ No orphaned records
- ✅ No duplicate accounts
- ✅ No broken relationships
- ✅ Products are real (not seed data)
- ✅ Categories are real (not seed data)
- ✅ No obvious test accounts

The only real concern is those 12 orders from 2.5 years ago - check if they're real or test data.

---

## 📞 NEED HELP DECIDING?

**For the 12 orders:** Check if they have:
- Real customer names and phone numbers → Keep them
- Test data (000000, test@, dummy names) → Delete them

**When in doubt:** Keep it. You can always clean up later, but you can't recover deleted data.

---

**Full detailed report:** See `PRE-LAUNCH-DATABASE-AUDIT-REPORT.md`  
**Raw data:** See `database-audit-report.json`
