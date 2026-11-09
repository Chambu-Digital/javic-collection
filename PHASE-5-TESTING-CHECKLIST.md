# Phase 5: Testing & Validation Checklist

## Overview
Comprehensive testing checklist to verify the auth unification works correctly and doesn't break existing functionality.

---

## 🔐 Authentication Tests

### Web Auth (Should Still Work)
- [ ] Customer login via `/account/login`
- [ ] Customer registration via `/account/register`
- [ ] Google OAuth login
- [ ] Admin login via `/admin/login`
- [ ] Password reset flow
- [ ] Session persistence after browser refresh
- [ ] Logout functionality

### POS Auth (Unified)
- [ ] POS login via `/pos-login`
- [ ] Invalid credentials rejection
- [ ] Non-POS user rejection (customer trying to access POS)
- [ ] Session persistence after browser refresh
- [ ] Logout functionality
- [ ] Redirect to login when session expires

### Offline POS Auth
- [ ] Disable network in browser DevTools
- [ ] Reload POS page - should stay logged in (JWT validated locally)
- [ ] Try to make sale offline (should work with cached data)
- [ ] Re-enable network - should sync automatically

---

## 🛒 Cart Functionality Tests

### Web Cart (Should Be Unaffected)
- [ ] Add product to cart
- [ ] Update quantity
- [ ] Remove item
- [ ] Clear cart
- [ ] Cart persists after browser refresh
- [ ] Wholesale pricing applies at threshold
- [ ] Checkout process
- [ ] Multiple variants of same product

### POS Cart
- [ ] Add product to cart
- [ ] Update quantity
- [ ] Remove item
- [ ] Clear cart
- [ ] Cart persists after browser refresh
- [ ] Switch pricing mode (retail ↔ wholesale)
- [ ] Apply line-item discount
- [ ] Apply cart-level discount
- [ ] Price override with reason
- [ ] Attach customer to sale
- [ ] Multi-branch warning works
- [ ] Multi-vendor detection works

---

## 💰 POS Sales Flow Tests

### Basic Sale
- [ ] Login to POS
- [ ] Search for product
- [ ] Add to cart
- [ ] Complete cash sale
- [ ] Print/view receipt
- [ ] Verify stock decreased

### Advanced Features
- [ ] Hold order
- [ ] Retrieve held order
- [ ] Resume held order
- [ ] Cancel held order
- [ ] Split payment (cash + M-Pesa)
- [ ] Wholesale sale
- [ ] Sale with line discount
- [ ] Sale with cart discount
- [ ] Customer credit sale
- [ ] Return/refund

### Branch Operations
- [ ] Switch branch (should clear cart with warning)
- [ ] Products filtered by selected branch
- [ ] Stock shows correct branch quantity
- [ ] Multi-branch cart blocked from cart discount

---

## 👥 User Management Tests

### Admin Functions
- [ ] Create new POS user (staff)
- [ ] Assign POS role
- [ ] Assign branch
- [ ] Assign permissions
- [ ] Deactivate user
- [ ] View POS staff list

### Permission Checks
- [ ] Cashier: can make sales
- [ ] Cashier: cannot access reports
- [ ] Supervisor: can apply discounts
- [ ] Manager: can access all reports
- [ ] Administrator: full access

---

## 📊 Reporting & Audit Tests

### POS Reports
- [ ] Daily sales report
- [ ] Cashier performance
- [ ] Branch performance
- [ ] Product sales by branch
- [ ] Ledger entries recorded correctly

### Audit Trail
- [ ] Sale creates ledger entry
- [ ] Discount logged with reason and approver
- [ ] Price override logged
- [ ] Credit transaction logged
- [ ] Held order actions logged

---

## 🔄 Offline Mode Tests

### Going Offline
- [ ] Disconnect from network
- [ ] POS stays logged in (offline JWT)
- [ ] Product catalog loads from cache
- [ ] Can browse products
- [ ] Can add to cart
- [ ] Can complete sale (queued locally)
- [ ] Sale shows "pending sync" indicator

### Coming Back Online
- [ ] Reconnect to network
- [ ] Pending sales sync automatically
- [ ] No duplicate orders created
- [ ] Stock updates on server
- [ ] Ledger entries created
- [ ] Receipt available in order history

### Edge Cases
- [ ] Multiple offline sales queue correctly
- [ ] Conflict resolution if item sold out while offline
- [ ] Expired JWT rejects after coming online
- [ ] Sync retry on network error

---

## 🛡️ Security Tests

### Access Control
- [ ] POS routes require authentication
- [ ] Regular customer cannot access POS
- [ ] Deactivated user rejected at login
- [ ] Session invalidated on password change
- [ ] Admin cannot impersonate without proper permission

### JWT Validation
- [ ] Expired token redirects to login
- [ ] Tampered token rejected
- [ ] Token includes correct POS claims
- [ ] Offline validation works without DB hit
- [ ] Online validation checks DB for revoked access

---

## 🧪 Integration Tests

### Web + POS Interaction
- [ ] Admin updates product price → reflects in POS
- [ ] Admin adds product → appears in POS search
- [ ] Admin adjusts stock → POS shows correct quantity
- [ ] Customer placed online order → shows in admin orders
- [ ] POS sale → shows in admin orders
- [ ] Both channels update same stock

### Stock Synchronization
- [ ] Web sale decreases stock
- [ ] POS sale decreases stock
- [ ] Low stock alert works across channels
- [ ] Out of stock prevents sale in both channels

---

## 📱 UI/UX Tests

### POS Interface
- [ ] Login screen responsive
- [ ] Make sale page responsive
- [ ] Search works quickly
- [ ] Barcode scanner opens
- [ ] Product grid loads smoothly
- [ ] Cart updates instantly
- [ ] Payment modal intuitive
- [ ] Receipt displays correctly

### Error Handling
- [ ] Network error shows friendly message
- [ ] Invalid credentials show clear error
- [ ] Out of stock shows warning
- [ ] Insufficient permissions show explanation
- [ ] Failed payment shows actionable error

---

## 🔧 Developer Tests

### Code Quality
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] No React warnings
- [ ] Auth store types correct
- [ ] API responses match types

### Performance
- [ ] POS login < 2 seconds
- [ ] Product search < 500ms
- [ ] Cart update < 100ms
- [ ] Sale completion < 3 seconds
- [ ] Report generation < 5 seconds

---

## ✅ Verification Steps

### 1. Manual Testing (Priority)
Run through the flows marked as "Priority" first:

**Critical Path:**
1. ✅ POS Login
2. ✅ Search & add product
3. ✅ Complete cash sale
4. ✅ Verify stock decreased
5. ✅ View receipt
6. ✅ Logout

### 2. Automated Testing (Optional)
If you have E2E tests:
```bash
npm run test:e2e
npm run test:pos
```

### 3. Load Testing (Before Production)
- [ ] 10 concurrent POS terminals
- [ ] 100 sales per hour
- [ ] Network latency simulation
- [ ] Offline queue with 50 pending sales

---

## 🐛 Known Issues & Workarounds

### Issue 1: Session Check on Every POS Mount
**Status**: Expected behavior  
**Impact**: Slight delay on page load  
**Workaround**: None needed - ensures fresh session

### Issue 2: Offline Mode Requires Manual Network Toggle
**Status**: Testing only  
**Impact**: None in production (automatic detection)  
**Workaround**: Use browser DevTools to simulate

---

## 📋 Test Results Template

### Date: _____________
### Tester: _____________
### Environment: [ ] Dev [ ] Staging [ ] Production

| Test Category | Pass | Fail | Notes |
|--------------|------|------|-------|
| Web Auth | ☐ | ☐ | |
| POS Auth | ☐ | ☐ | |
| Offline Auth | ☐ | ☐ | |
| Web Cart | ☐ | ☐ | |
| POS Cart | ☐ | ☐ | |
| Basic Sale | ☐ | ☐ | |
| Advanced Features | ☐ | ☐ | |
| Branch Operations | ☐ | ☐ | |
| User Management | ☐ | ☐ | |
| Permissions | ☐ | ☐ | |
| Reports | ☐ | ☐ | |
| Offline Mode | ☐ | ☐ | |
| Security | ☐ | ☐ | |
| Integration | ☐ | ☐ | |
| UI/UX | ☐ | ☐ | |

**Overall Result**: [ ] PASS [ ] FAIL [ ] CONDITIONAL PASS

**Blockers**:
- 

**Non-Blockers**:
- 

**Recommendations**:
- 

---

## 🚀 Pre-Production Checklist

Before deploying to production:

### Code Review
- [ ] PR created with clear description
- [ ] Code reviewed by another developer
- [ ] All comments addressed
- [ ] No merge conflicts

### Testing
- [ ] All critical tests pass
- [ ] Manual testing complete
- [ ] Regression tests pass
- [ ] Performance acceptable

### Documentation
- [ ] CHANGELOG.md updated
- [ ] API docs updated (if applicable)
- [ ] User guide updated
- [ ] Migration guide available

### Deployment
- [ ] Database backup taken
- [ ] Rollback plan ready
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment

### Post-Deployment
- [ ] Smoke tests pass
- [ ] Monitor error logs for 24h
- [ ] User feedback collected
- [ ] Performance metrics normal

---

**Testing Status**: 📋 Ready to Begin  
**Priority**: High - Auth is critical  
**Timeline**: 2-3 hours for manual testing  
**Next Step**: Run Critical Path tests first
