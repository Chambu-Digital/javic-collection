import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import MpesaTransaction from '@/models/MpesaTransaction'
import { queryTransactionStatus } from '@/lib/mpesa-service'

// STK Push Transaction Verification
// Query M-Pesa for transaction status or check database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const checkoutRequestID = searchParams.get('checkoutRequestID')
    const transactionId = searchParams.get('transactionId')

    if (!checkoutRequestID && !transactionId) {
      return NextResponse.json(
        { success: false, error: 'checkoutRequestID or transactionId is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find transaction in database
    let transaction
    if (checkoutRequestID) {
      transaction = await MpesaTransaction.findOne({ checkoutRequestID })
    } else {
      transaction = await MpesaTransaction.findById(transactionId)
    }

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // If transaction is still pending, query M-Pesa for latest status
    if (transaction.status === 'pending' && transaction.checkoutRequestID) {
      try {
        const mpesaStatus = await queryTransactionStatus(transaction.checkoutRequestID)
        
        // Update transaction if M-Pesa has new info
        if (mpesaStatus.ResultCode !== undefined) {
          transaction.resultCode = parseInt(mpesaStatus.ResultCode)
          transaction.resultDesc = mpesaStatus.ResultDesc
          
          if (mpesaStatus.ResultCode === '0') {
            transaction.status = 'completed'
            transaction.paymentStatus = 'paid'
          } else {
            transaction.status = 'failed'
            transaction.paymentStatus = 'failed'
          }
          
          await transaction.save()
        }
      } catch (error) {
        console.error('Error querying M-Pesa status:', error)
        // Continue with database status if query fails
      }
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction._id,
        checkoutRequestID: transaction.checkoutRequestID,
        status: transaction.status,
        paymentStatus: transaction.paymentStatus,
        amount: transaction.amount,
        phoneNumber: transaction.phoneNumber,
        mpesaReceiptNumber: transaction.mpesaReceiptNumber,
        resultDesc: transaction.resultDesc,
        orderId: transaction.orderId,
        orderNumber: transaction.orderNumber,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      }
    })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
