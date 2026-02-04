# M-Pesa STK Push Setup Guide

## Overview
Your STK Push (Lipa Na M-Pesa Online) is configured and ready to use!

## Callback URL
**Production URL**: `https://serenleaf.co.ke/api/payments/callback`

This URL is automatically included in every STK Push request - no separate registration needed!

## Environment Variables (Already Set in Vercel)
```
MPESA_BUSINESS_SHORT_CODE=4005485
MPESA_CONSUMER_KEY=lnQd3t...
MPESA_CONSUMER_SECRET=eFkTiA...
MPESA_PASSKEY=42b064...
MPESA_ENVIRONMENT=production
NEXT_PUBLIC_BASE_URL=https://serenleaf.co.ke
```

## How It Works

### 1. Customer Initiates Payment
When a customer clicks "Pay with M-Pesa" on your checkout:
- Your frontend calls: `POST /api/payments/initiate`
- With: `{ amount, phone, orderId, orderNumber }`

### 2. STK Push Sent
- Your backend calls M-Pesa API
- Customer receives popup on their phone
- They enter M-Pesa PIN

### 3. Callback Received
- M-Pesa sends result to: `https://serenleaf.co.ke/api/payments/callback`
- Your system updates transaction and order status
- Customer sees payment confirmation

## API Endpoints

### 1. Initiate Payment (STK Push)
```
POST /api/payments/initiate
Content-Type: application/json

{
  "amount": 1000,
  "phone": "254712345678",
  "orderId": "order_id_here",
  "orderNumber": "ORD-12345",
  "paymentMethod": "mpesa"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment prompt sent to your phone",
  "merchantRequestID": "...",
  "checkoutRequestID": "...",
  "transactionId": "...",
  "status": "initiated"
}
```

### 2. Callback (M-Pesa calls this automatically)
```
POST /api/payments/callback
```
M-Pesa sends payment result here. You don't call this - M-Pesa does!

### 3. Verify Transaction Status
```
GET /api/payments/verify?checkoutRequestID=ws_CO_123456789
OR
GET /api/payments/verify?transactionId=transaction_id_here
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "...",
    "checkoutRequestID": "...",
    "status": "completed",
    "paymentStatus": "paid",
    "amount": 1000,
    "mpesaReceiptNumber": "QAB12CD3EF",
    "orderNumber": "ORD-12345"
  }
}
```

### 4. Test Authentication
```
GET /api/payments/test-auth
```
Tests M-Pesa API credentials and connection.

## Testing

### 1. Test Authentication
```bash
curl https://serenleaf.co.ke/api/payments/test-auth
```

### 2. Test STK Push
Use your checkout page or call the API directly with a test phone number.

### 3. Monitor Logs
Check Vercel deployment logs:
- Go to Vercel Dashboard
- Select your project
- Click "Deployments" → Latest deployment → "Functions"
- Watch for callback logs

## Phone Number Format
The system automatically formats phone numbers:
- `0712345678` → `254712345678`
- `+254712345678` → `254712345678`
- `712345678` → `254712345678`

## Transaction Flow

1. **Initiated**: STK Push sent, waiting for customer
2. **Pending**: Customer entered PIN, processing
3. **Completed**: Payment successful, order confirmed
4. **Failed**: Payment failed/cancelled/timeout

## Troubleshooting

### Customer doesn't receive popup
- Check phone number format
- Verify phone has M-Pesa registered
- Check Vercel logs for errors

### Callback not received
- Verify callback URL is accessible: `https://serenleaf.co.ke/api/payments/callback`
- Check Vercel function logs
- M-Pesa may retry callbacks if they fail

### Payment successful but order not updated
- Check Vercel logs for callback processing errors
- Verify MongoDB connection
- Check transaction in database

## Database Models

### MpesaTransaction
Stores all payment attempts and results:
- `checkoutRequestID`: Unique transaction ID
- `status`: pending/completed/failed
- `mpesaReceiptNumber`: M-Pesa confirmation code
- `orderId`: Linked order

### Order
Updated when payment succeeds:
- `paymentStatus`: 'paid'
- `status`: 'confirmed'
- `adminNotes`: Includes M-Pesa receipt number

## Production Checklist
- [x] Environment variables set in Vercel
- [x] Callback URL configured: `https://serenleaf.co.ke/api/payments/callback`
- [x] Using production credentials
- [x] HTTPS enabled (automatic with Vercel)
- [ ] Test with real payment (small amount)
- [ ] Monitor first few transactions
- [ ] Set up error notifications (optional)

## Next Steps
1. Deploy your latest changes to Vercel
2. Test with a small real payment (e.g., KES 10)
3. Check Vercel logs to confirm callback is received
4. Verify order status updates correctly

## Support
- M-Pesa Daraja Portal: https://developer.safaricom.co.ke
- Vercel Logs: Dashboard → Your Project → Deployments → Functions
