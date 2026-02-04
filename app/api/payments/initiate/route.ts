import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import MpesaTransaction from '@/models/MpesaTransaction'
import Order from '@/models/Order'
import { initiateSTKPush } from '@/lib/mpesa-service'

// Payment Initiation API Route - Initiate M-Pesa STK Push
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, phone, orderId, orderNumber, paymentMethod = 'mpesa' } = body

    if (!amount || !phone || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: amount, phone, orderId' },
        { status: 400 }
      )
    }

    // Only support M-Pesa for now
    if (paymentMethod !== 'mpesa') {
      return NextResponse.json(
        { success: false, error: 'Only M-Pesa payments are supported currently' },
        { status: 400 }
      )
    }

    await connectDB()

    // Verify order exists
    const order = await Order.findById(orderId)
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get callback URL for STK Push
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://serenleaf.co.ke'
    const callbackUrl = `${baseUrl}/api/payments/callback`
    
    console.log('STK Push callback URL:', callbackUrl)

    // Initiate STK Push
    const stkResponse = await initiateSTKPush(
      phone,
      amount,
      orderNumber || order.orderNumber,
      `Payment for order ${order.orderNumber}`,
      callbackUrl
    )

    // Save transaction to database
    const transaction = new MpesaTransaction({
      merchantRequestID: stkResponse.MerchantRequestID,
      checkoutRequestID: stkResponse.CheckoutRequestID,
      resultCode: parseInt(stkResponse.ResponseCode),
      resultDesc: stkResponse.ResponseDescription,
      phoneNumber: phone,
      amount: amount,
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: 'pending',
      paymentStatus: 'pending',
      responseCode: stkResponse.ResponseCode,
      responseDescription: stkResponse.ResponseDescription,
      customerMessage: stkResponse.CustomerMessage
    })

    await transaction.save()

    return NextResponse.json({
      success: true,
      message: stkResponse.CustomerMessage || 'M-Pesa payment prompt sent to your phone',
      merchantRequestID: stkResponse.MerchantRequestID,
      checkoutRequestID: stkResponse.CheckoutRequestID,
      transactionId: transaction._id,
      amount: amount,
      phone: phone,
      status: 'initiated',
      paymentMethod: 'mpesa'
    })
  } catch (error: any) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process payment',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 400 }
    )
  }
}