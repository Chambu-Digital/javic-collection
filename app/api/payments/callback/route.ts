import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import MpesaTransaction from '@/models/MpesaTransaction'
import Order from '@/models/Order'

// M-Pesa STK Push Callback Handler
// This endpoint receives callbacks from M-Pesa when a payment is completed
// URL: https://serenleaf.co.ke/api/payments/callback
export async function POST(request: NextRequest) {
  try {
    console.log('=== M-Pesa Callback Received ===')
    const body = await request.json()
    console.log('Raw callback body:', JSON.stringify(body, null, 2))
    
    // M-Pesa sends the callback in a specific format
    const callbackData = body.Body?.stkCallback || body
    
    if (!callbackData) {
      console.error('Invalid callback data - missing stkCallback:', body)
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid callback data' })
    }

    await connectDB()

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = callbackData

    console.log('Callback details:', {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc
    })

    // Find the transaction
    const transaction = await MpesaTransaction.findOne({
      checkoutRequestID: CheckoutRequestID
    })

    if (!transaction) {
      console.error('Transaction not found for CheckoutRequestID:', CheckoutRequestID)
      // Still return success to M-Pesa to prevent retries
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Transaction not found but acknowledged' })
    }

    console.log('Transaction found:', transaction._id)

    // Update transaction with callback data
    transaction.resultCode = ResultCode
    transaction.resultDesc = ResultDesc

    // Extract payment details from CallbackMetadata if payment was successful
    if (ResultCode === 0 && CallbackMetadata?.Item) {
      const metadata: any = {}
      CallbackMetadata.Item.forEach((item: any) => {
        metadata[item.Name] = item.Value
      })

      console.log('Payment successful! Metadata:', metadata)

      transaction.mpesaReceiptNumber = metadata.MpesaReceiptNumber
      transaction.transactionDate = metadata.TransactionDate
      transaction.phoneNumber = metadata.PhoneNumber || transaction.phoneNumber
      
      // Mark as completed and paid
      transaction.status = 'completed'
      transaction.paymentStatus = 'paid'
    } else {
      // Payment failed or cancelled
      console.log('Payment failed/cancelled. ResultCode:', ResultCode, 'ResultDesc:', ResultDesc)
      transaction.status = 'failed'
      transaction.paymentStatus = 'failed'
    }

    await transaction.save()
    console.log('Transaction updated successfully')

    // If payment was successful, update the order
    if (ResultCode === 0 && transaction.orderId) {
      const order = await Order.findById(transaction.orderId)
      
      if (order) {
        console.log('Updating order:', order.orderNumber)
        order.paymentStatus = 'paid'
        order.status = 'confirmed'
        
        // Add M-Pesa receipt number to admin notes
        if (transaction.mpesaReceiptNumber) {
          order.adminNotes = `M-Pesa Receipt: ${transaction.mpesaReceiptNumber}\n${order.adminNotes || ''}`
        }
        
        await order.save()
        console.log('Order updated successfully')
      } else {
        console.log('Order not found for ID:', transaction.orderId)
      }
    } else if (ResultCode === 0 && !transaction.orderId) {
      // Payment successful but no order yet - create order now
      console.log('Payment successful, creating order now...')
      
      try {
        // Get order data from session or create new order
        // For now, we'll need to store order data in transaction or separate collection
        // This is a simplified version - you may need to enhance this
        
        console.log('Order creation after payment not yet implemented')
        // TODO: Implement order creation from stored order data
      } catch (orderError) {
        console.error('Error creating order after payment:', orderError)
      }
    }

    console.log('=== Callback processed successfully ===')

    // Return success response to M-Pesa
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Callback processed successfully'
    })

  } catch (error: any) {
    console.error('Payment callback error:', error)
    console.error('Error stack:', error.stack)
    
    // Still return success to M-Pesa to prevent retries
    // Log the error for manual investigation
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Callback received but processing failed'
    })
  }
}

// Allow GET for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Payment callback endpoint',
    method: 'POST',
    description: 'This endpoint receives callbacks from payment providers when payments are completed'
  })
}
