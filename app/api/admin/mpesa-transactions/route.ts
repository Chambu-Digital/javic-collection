import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import MpesaTransaction from '@/models/MpesaTransaction'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Check if user has admin permissions
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const search = searchParams.get('search')
    const skip = (page - 1) * limit
    
    await connectDB()
    
    // Build query
    const query: any = {}
    
    if (status && status !== 'all') {
      query.status = status
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus
    }
    
    if (search) {
      query.$or = [
        { checkoutRequestID: { $regex: search, $options: 'i' } },
        { merchantRequestID: { $regex: search, $options: 'i' } },
        { mpesaReceiptNumber: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Get transactions with pagination
    const transactions = await MpesaTransaction.find(query)
      .populate('orderId', 'orderNumber totalAmount status paymentStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    // Get total count for pagination
    const total = await MpesaTransaction.countDocuments(query)
    
    // Calculate stats
    const totalTransactions = await MpesaTransaction.countDocuments()
    const completedTransactions = await MpesaTransaction.countDocuments({ status: 'completed', paymentStatus: 'paid' })
    const pendingTransactions = await MpesaTransaction.countDocuments({ status: 'pending' })
    const failedTransactions = await MpesaTransaction.countDocuments({ status: 'failed' })
    
    const totalAmount = await MpesaTransaction.aggregate([
      { $match: { status: 'completed', paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
    
    const totalRevenue = totalAmount.length > 0 ? totalAmount[0].total : 0
    
    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        total: totalTransactions,
        completed: completedTransactions,
        pending: pendingTransactions,
        failed: failedTransactions,
        totalRevenue
      }
    })
    
  } catch (error: any) {
    console.error('Error fetching M-Pesa transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
