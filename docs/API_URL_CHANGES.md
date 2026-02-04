# API URL Changes - Payment Endpoints

## Summary
Updated payment API URLs to remove "mpesa" from the path for cleaner, more generic payment handling.

## URL Changes

### Before (Old URLs)
- **Payment Initiation**: `/api/payments/mpesa`
- **Payment Callback**: `/api/payments/mpesa/callback`

### After (New URLs)
- **Payment Initiation**: `/api/payments/initiate`
- **Payment Callback**: `/api/payments/callback`

## Benefits
1. **Generic Payment Handling**: URLs no longer tied to specific payment method
2. **Cleaner URLs**: Shorter, more professional-looking endpoints
3. **Future-Proof**: Easy to add other payment methods (Stripe, PayPal, etc.)
4. **Better Security**: Less obvious what payment system is being used

## Updated Files
- ✅ `app/api/payments/initiate/route.ts` - New payment initiation endpoint
- ✅ `app/api/payments/callback/route.ts` - New callback endpoint
- ✅ `app/checkout/page.tsx` - Updated frontend call
- ✅ `lib/payment-service.ts` - Updated service call
- ✅ `docs/MPESA_SETUP.md` - Updated documentation

## Migration Notes
- Old endpoints still exist for backward compatibility
- Update your Safaricom M-Pesa app settings to use the new callback URL:
  ```
  https://serenleaf.co.ke/api/payments/callback
  ```
- Frontend automatically uses new endpoints
- No database changes required

## Testing
1. Test payment initiation: `POST /api/payments/initiate`
2. Test callback handling: `POST /api/payments/callback`
3. Verify M-Pesa integration works with new URLs