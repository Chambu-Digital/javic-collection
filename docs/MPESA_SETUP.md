# M-Pesa Integration Setup Guide

This guide explains how to set up M-Pesa payment integration for Serenleaf.

## Overview

The M-Pesa integration uses Safaricom's Daraja API to process payments via STK Push (Lipa na M-Pesa Online). When a customer selects M-Pesa as their payment method, they receive a prompt on their phone to complete the payment.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# M-Pesa Configuration
MPESA_BUSINESS_SHORT_CODE=your_paybill_number
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_ENVIRONMENT=sandbox  # or 'production' for live environment

# Base URL for callbacks (required for production)
NEXT_PUBLIC_BASE_URL=https://your-domain.com
# Or if using Vercel, it will use VERCEL_URL automatically
```

## Getting M-Pesa Credentials

1. **Register on Safaricom Developer Portal**
   - Go to https://developer.safaricom.co.ke/
   - Create an account and register your app

2. **Get Your Credentials**
   - Business Short Code: Your PayBill number
   - Consumer Key: From your app credentials
   - Consumer Secret: From your app credentials
   - Passkey: Generated passkey for your app

3. **Set Up Callback URL**
   - In your Safaricom app settings, set the callback URL to:
     `https://your-domain.com/api/payments/callback`
   - For local development, you can use a service like ngrok to expose your local server

## How It Works

1. **Customer Checkout**
   - Customer adds items to cart and proceeds to checkout
   - Selects M-Pesa as payment method
   - Enters shipping address and phone number

2. **Order Creation**
   - Order is created with `paymentStatus: 'pending'`
   - Order status is set to `'pending'`

3. **M-Pesa Payment Initiation**
   - System calls M-Pesa STK Push API
   - Customer receives prompt on their phone
   - Transaction is saved to database with status `'pending'`

4. **Payment Completion**
   - Customer enters M-Pesa PIN on their phone
   - M-Pesa sends callback to `/api/payments/callback`
   - System updates transaction status to `'completed'` and `'paid'`
   - Order is updated to `paymentStatus: 'paid'` and `status: 'confirmed'`

## Viewing Transactions

Admins can view all M-Pesa transactions at:
- `/admin/mpesa-transactions`

This page shows:
- All transactions with their status
- Payment amounts and receipt numbers
- Associated orders
- Transaction statistics

## Testing

### Sandbox Environment
- Use test phone numbers provided by Safaricom
- Test credentials are available in the developer portal
- Set `MPESA_ENVIRONMENT=sandbox`

### Production Environment
- Use real PayBill number and credentials
- Set `MPESA_ENVIRONMENT=production`
- Ensure callback URL is publicly accessible
- Test with small amounts first

## Troubleshooting

### Payment Not Received
- Check that callback URL is accessible
- Verify M-Pesa credentials are correct
- Check server logs for errors
- Ensure phone number is in correct format (254XXXXXXXXX)

### Callback Not Working
- Verify callback URL is set correctly in Safaricom app settings
- Check that your server is publicly accessible
- Review callback endpoint logs

### Transaction Status Issues
- Check database for transaction records
- Verify order is linked to transaction
- Review M-Pesa transaction logs in admin panel

## Security Notes

- Never commit `.env.local` file to version control
- Keep M-Pesa credentials secure
- Use HTTPS in production
- Validate all callback data from M-Pesa
- Implement rate limiting on payment endpoints
