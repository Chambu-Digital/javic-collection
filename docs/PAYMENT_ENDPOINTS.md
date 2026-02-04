# Payment API Endpoints

## Active Endpoints (STK Push Only)

### 1. `/api/payments/initiate` - Start Payment
**Method**: POST  
**Purpose**: Initiates STK Push to customer's phone  
**Used by**: Your frontend checkout

```json
POST /api/payments/initiate
{
  "amount": 1000,
  "phone": "254712345678",
  "orderId": "order_id",
  "orderNumber": "ORD-12345",
  "paymentMethod": "mpesa"
}
```

---

### 2. `/api/payments/callback` - Receive Payment Result
**Method**: POST  
**Purpose**: Receives payment confirmation from M-Pesa  
**Used by**: M-Pesa Daraja API (automatic)  
**URL**: `https://serenleaf.co.ke/api/payments/callback`

⚠️ **You don't call this** - M-Pesa calls it automatically!

---

### 3. `/api/payments/verify` - Check Transaction Status
**Method**: GET  
**Purpose**: Query transaction status from database or M-Pesa  
**Used by**: Your frontend to check payment status

```
GET /api/payments/verify?checkoutRequestID=ws_CO_123456789
OR
GET /api/payments/verify?transactionId=transaction_id
```

---

### 4. `/api/payments/test-auth` - Test M-Pesa Connection
**Method**: GET  
**Purpose**: Verify M-Pesa credentials and API connection  
**Used by**: Testing/debugging

```
GET /api/payments/test-auth
```

---

## Removed Endpoints (C2B - Not Needed)

These were for Customer-to-Business (manual paybill entry) which you don't need:

- ❌ `/api/payments/validation` - C2B validation
- ❌ `/api/payments/confirmation` - C2B confirmation  
- ❌ `/api/payments/register-urls` - C2B URL registration
- ❌ `/api/payments/mpesa/*` - Duplicate endpoints

---

## Payment Flow

```
1. Customer clicks "Pay" 
   → Frontend calls /api/payments/initiate

2. Customer receives STK popup on phone
   → Enters M-Pesa PIN

3. M-Pesa processes payment
   → Calls /api/payments/callback with result

4. Your system updates order
   → Order marked as paid
   → Customer sees confirmation

5. (Optional) Frontend polls /api/payments/verify
   → To show real-time status updates
```

---

## File Structure

```
app/api/payments/
├── initiate/route.ts      ✅ Initiate STK Push
├── callback/route.ts      ✅ Receive M-Pesa callback
├── verify/route.ts        ✅ Query transaction status
└── test-auth/route.ts     ✅ Test M-Pesa auth

lib/
└── mpesa-service.ts       ✅ M-Pesa API utilities

models/
└── MpesaTransaction.ts    ✅ Transaction database model
```

---

## Quick Test

1. **Test auth**: `curl https://serenleaf.co.ke/api/payments/test-auth`
2. **Initiate payment**: Use your checkout page
3. **Check logs**: Vercel Dashboard → Functions
4. **Verify callback**: Watch for M-Pesa callback in logs
