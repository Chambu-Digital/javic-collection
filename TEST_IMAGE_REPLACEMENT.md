# Test Guide: Image Replacement Feature

## Quick Test (5 minutes)

### Prerequisites
- Admin access to the system
- At least one product with multiple images
- Test image file ready (< 10MB)

### Steps

1. **Navigate to Product Edit**
   ```
   Admin Dashboard → Products → Click any product → Edit
   ```

2. **Locate Replace Button**
   - Hover over any product image
   - Look for blue "Replace" button (top-left corner of image)
   - ✅ Button should appear on hover

3. **Replace Image**
   - Click "Replace" button
   - Select a test image from your computer
   - Wait for upload (button shows "Replacing...")
   - ✅ New image should appear after upload completes
   - ✅ Success toast notification shown

4. **Verify Stock Unchanged**
   - Check stock section on same page
   - ✅ Stock quantity should be exactly the same as before

5. **Verify Product Page**
   - Open product page in new tab
   - ✅ New image should be visible
   - ✅ No errors or broken images

6. **Test Cart (Optional)**
   - Add product to cart
   - ✅ Cart shows new image
   - ✅ Checkout works normally

---

## Comprehensive Test (20 minutes)

### Test 1: Basic Replacement

**Goal**: Verify basic functionality works

**Steps**:
1. Edit any product
2. Replace image at index 0 (main image)
3. Replace image at index 2 (middle image)
4. Replace last image

**Expected Results**:
- ✅ All replacements succeed
- ✅ Images appear correctly
- ✅ No errors in console

---

### Test 2: Stock Integrity

**Goal**: Verify stock references remain intact

**Setup**:
```
Product: "Test Product"
Image 2: Has 50 units in stock
```

**Steps**:
1. Note stock quantity for image 2
2. Replace image 2 with new photo
3. Check stock quantity again

**Expected Results**:
- ✅ Stock quantity unchanged (still 50)
- ✅ Stock still tracked for image 2
- ✅ Can add/remove stock normally

---

### Test 3: Cart Preservation

**Goal**: Verify cart items work with new images

**Setup**:
```
1. Add product (image 1) to cart
2. Note cart item details
```

**Steps**:
1. While item in cart, replace image 1
2. Refresh cart page
3. Proceed to checkout

**Expected Results**:
- ✅ Cart shows new image
- ✅ Quantity preserved
- ✅ Price unchanged
- ✅ Checkout succeeds

---

### Test 4: Error Handling

**Goal**: Verify proper error handling

**Test 4a: Invalid File Type**
1. Click Replace button
2. Select a PDF or Word document
3. **Expected**: "Please select an image file" error

**Test 4b: File Too Large**
1. Click Replace button
2. Select image > 10MB (if available)
3. **Expected**: "Image must be less than 10MB" error

**Test 4c: Network Error**
1. Open browser DevTools
2. Set network to "Offline"
3. Try to replace image
4. **Expected**: Graceful error message

---

### Test 5: Concurrent Operations

**Goal**: Verify multiple admins can work safely

**Setup**: Two admin sessions (two browsers/tabs)

**Steps**:
1. Admin A: Opens product for editing
2. Admin B: Opens same product for editing
3. Admin A: Replaces image 1
4. Admin B: Replaces image 2
5. Both save changes

**Expected Results**:
- ✅ Both replacements succeed
- ✅ No conflicts
- ✅ Both images updated correctly

---

### Test 6: Order History

**Goal**: Verify old orders still work

**Setup**:
```
1. Create order with product (image 2)
2. Complete order
3. Replace image 2
```

**Steps**:
1. View order in admin panel
2. View order in customer account
3. Check order email (if sent)

**Expected Results**:
- ✅ Order displays correctly
- ✅ Old or new image shown (depending on design decision)
- ✅ No errors loading order

---

## Edge Case Tests

### Edge Case 1: Replace Main Image

**Why**: Main image is often treated specially

**Steps**:
1. Replace image at index 0
2. Check product page
3. Check category page
4. Check search results

**Expected Results**:
- ✅ New main image everywhere
- ✅ Thumbnails updated

---

### Edge Case 2: Replace Grouped Images

**Why**: Grouped images share same variant

**Setup**: Product with grouped images

**Steps**:
1. Replace one image in a group
2. Check if group still works
3. View product page

**Expected Results**:
- ✅ Group remains intact
- ✅ Only replaced image changes
- ✅ Other images in group unchanged

---

### Edge Case 3: Rapid Replacements

**Why**: Test for race conditions

**Steps**:
1. Replace image 1
2. Immediately (don't wait) replace image 1 again
3. Wait for both uploads

**Expected Results**:
- ✅ Second replacement waits for first
- ✅ Final image is the second upload
- ✅ No errors or corruption

---

### Edge Case 4: Replace During Active Sale

**Why**: Real-world scenario

**Setup**: Product with active orders being placed

**Steps**:
1. Have someone add product to cart
2. Replace image while they're checking out
3. Complete checkout

**Expected Results**:
- ✅ Checkout succeeds
- ✅ No stock errors
- ✅ Order created correctly

---

## Performance Tests

### Test 7: Upload Speed

**Goal**: Verify reasonable upload times

**Test with**:
- Small image (100KB): Expected < 2 seconds
- Medium image (1MB): Expected < 5 seconds
- Large image (5MB): Expected < 15 seconds

**Pass criteria**: Times within 2x of expected

---

### Test 8: API Response Time

**Goal**: Verify fast API response

**Steps**:
1. Open browser DevTools → Network tab
2. Replace an image
3. Check API call `/api/admin/products/.../replace`

**Expected Results**:
- ✅ Response time < 500ms
- ✅ Status: 200 OK

---

## Security Tests

### Test 9: Authentication

**Goal**: Verify only admins can replace

**Test 9a: No Login**
1. Log out
2. Try to access `/api/admin/products/123/images/0/replace` directly
3. **Expected**: 401 Unauthorized

**Test 9b: Non-Admin User**
1. Log in as regular user
2. Try to replace image
3. **Expected**: 401 Unauthorized

---

### Test 10: Input Validation

**Goal**: Verify API validates inputs

**Test with curl/Postman**:

```bash
# Test 1: Invalid image index
curl -X PUT http://localhost:3000/api/admin/products/123/images/999/replace \
  -H "Content-Type: application/json" \
  -d '{"newImageUrl": "http://example.com/image.jpg"}'
# Expected: 400 Bad Request

# Test 2: Invalid URL
curl -X PUT http://localhost:3000/api/admin/products/123/images/0/replace \
  -H "Content-Type: application/json" \
  -d '{"newImageUrl": "not-a-url"}'
# Expected: 400 Bad Request

# Test 3: Missing URL
curl -X PUT http://localhost:3000/api/admin/products/123/images/0/replace \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 400 Bad Request
```

---

## Regression Tests

### Test 11: Existing Functionality

**Goal**: Verify we didn't break anything

**Test**:
- ✅ Adding new images still works
- ✅ Deleting images still works
- ✅ Editing image properties (price, SKU) still works
- ✅ Grouping images still works
- ✅ Reordering images (if feature exists) still works

---

## Browser Compatibility

### Test 12: Cross-Browser

**Test in**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Check**:
- ✅ Replace button appears on hover
- ✅ File picker opens
- ✅ Upload works
- ✅ UI updates correctly

---

## Mobile Testing (Optional)

### Test 13: Responsive Admin

**Test on**:
- Tablet (iPad)
- Large phone

**Check**:
- ✅ Can access replace button (tap instead of hover)
- ✅ Can select file from device
- ✅ Upload works
- ✅ UI readable and usable

---

## Production Readiness Checklist

Before deploying to production:

### Code Quality
- [ ] No console.errors in production build
- [ ] All TypeScript types correct
- [ ] No unused imports
- [ ] Code follows project style guide

### Testing
- [ ] All tests above passed
- [ ] Tested with real product data
- [ ] Tested with actual cloud storage (not mock)
- [ ] Tested on staging environment

### Performance
- [ ] Upload times acceptable
- [ ] API response times < 500ms
- [ ] No memory leaks (test with multiple uploads)

### Security
- [ ] Admin authentication verified
- [ ] Input validation working
- [ ] No sensitive data in logs
- [ ] HTTPS enforced in production

### Documentation
- [ ] Feature documented
- [ ] API documented
- [ ] Admin guide updated
- [ ] Changelog updated

### Monitoring
- [ ] Logging in place
- [ ] Error tracking configured
- [ ] Success rate monitored

---

## Troubleshooting Test Failures

### Replace Button Not Appearing
**Check**:
- Browser CSS enabled
- No JavaScript errors
- Hover working (try different mouse)
- Component imported correctly

### Upload Fails
**Check**:
- Upload API endpoint working (`/api/upload`)
- Cloud storage credentials valid
- Network connectivity
- File size within limits

### API Returns Error
**Check**:
- Admin authentication valid
- Product ID exists
- Image index in bounds
- Request body format correct

### Image Not Updating
**Check**:
- API call succeeded (check Network tab)
- Parent component refreshes after replace
- Browser cache cleared
- Database actually updated

---

## Test Data

### Sample Products to Test

**Product 1**: Simple product
- 3 images, no variants
- Good for basic testing

**Product 2**: Complex product
- 10+ images, grouped variants
- Multiple sizes and prices
- Good for edge case testing

**Product 3**: High stock product
- Active in multiple carts
- Recent orders
- Good for integration testing

### Sample Images

Keep these ready:
- `test-small.jpg` (100KB)
- `test-medium.jpg` (1MB)
- `test-large.jpg` (5MB)
- `test-invalid.pdf` (for error testing)
- `test-toolarge.jpg` (15MB, for error testing)

---

## Automated Test Script (Optional)

```javascript
// tests/image-replacement.test.js

describe('Image Replacement Feature', () => {
  let adminSession
  let testProduct
  
  beforeAll(async () => {
    adminSession = await loginAsAdmin()
    testProduct = await createTestProduct()
  })
  
  test('replaces image successfully', async () => {
    const newUrl = await uploadTestImage()
    const response = await replaceImage(testProduct._id, 0, newUrl)
    expect(response.success).toBe(true)
  })
  
  test('preserves stock quantity', async () => {
    const stockBefore = await getStock(testProduct._id, 0)
    await replaceImage(testProduct._id, 0, 'new-url.jpg')
    const stockAfter = await getStock(testProduct._id, 0)
    expect(stockAfter).toBe(stockBefore)
  })
  
  test('handles errors gracefully', async () => {
    const response = await replaceImage(testProduct._id, 999, 'url.jpg')
    expect(response.status).toBe(400)
  })
  
  afterAll(async () => {
    await cleanupTestData()
  })
})
```

Run with: `npm test -- image-replacement`

---

## Success Criteria

The feature is ready for production when:

✅ **All basic tests pass** (Tests 1-6)  
✅ **No errors in console**  
✅ **Upload times acceptable**  
✅ **Stock integrity maintained**  
✅ **Cart operations work**  
✅ **Security validated**  
✅ **Works in main browsers**  
✅ **Documentation complete**

---

## Sign-Off

**Tested by**: _______________  
**Date**: _______________  
**Result**: ☐ Pass  ☐ Fail  ☐ Needs fixes  
**Notes**: _______________

---

## Next Steps After Testing

1. Fix any issues found
2. Re-test failed cases
3. Deploy to staging
4. Final smoke test on staging
5. Get approval from stakeholders
6. Deploy to production
7. Monitor for 48 hours
8. Mark feature as stable
