import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'
import LedgerEntry from '@/models/LedgerEntry'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    await requirePosPermission(request, POS_PERMISSIONS.REPORTS_OWN)
    await connectDB()

    const { searchParams } = new URL(request.url)
    
    // Date filters
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const quickDate = searchParams.get('quickDate') // today, week, month
    
    // Channel filters
    const source = searchParams.get('source') // pos, online, admin
    const channel = searchParams.get('channel') // pos, website, admin
    
    // Organization filters
    const outletId = searchParams.get('outletId')
    const cashierId = searchParams.get('cashierId')
    const customerId = searchParams.get('customerId')
    
    // Product filters
    const productId = searchParams.get('productId')
    const category = searchParams.get('category')
    const variant = searchParams.get('variant')
    const size = searchParams.get('size')
    
    // Payment filters
    const paymentMethod = searchParams.get('paymentMethod') // cash, mpesa, credit
    const splitPayment = searchParams.get('splitPayment') === 'true'
    
    // Transaction type filters
    const eventType = searchParams.get('eventType')
    const hasDiscount = searchParams.get('hasDiscount') === 'true'
    const creditTransaction = searchParams.get('creditTransaction') === 'true'
    const inventoryMovement = searchParams.get('inventoryMovement') === 'true'
    const heldOrder = searchParams.get('heldOrder') === 'true'
    const cancelledOrder = searchParams.get('cancelledOrder') === 'true'
    const returnOrder = searchParams.get('returnOrder') === 'true'
    const refundOrder = searchParams.get('refundOrder') === 'true'
    
    // System filters
    const syncStatus = searchParams.get('syncStatus') // synced, pending, failed
    const deviceId = searchParams.get('deviceId')
    const wasOffline = searchParams.get('wasOffline') === 'true'
    
    // Search
    const search = searchParams.get('search')
    
    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const skip = (page - 1) * limit

    // Build query
    const query: Record<string, unknown> = {}

    // Date range
    if (quickDate) {
      const now = new Date()
      const startOfDay = new Date(now.setHours(0, 0, 0, 0))
      
      if (quickDate === 'today') {
        query.createdAt = { $gte: startOfDay }
      } else if (quickDate === 'week') {
        const weekAgo = new Date(startOfDay)
        weekAgo.setDate(weekAgo.getDate() - 7)
        query.createdAt = { $gte: weekAgo }
      } else if (quickDate === 'month') {
        const monthAgo = new Date(startOfDay)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        query.createdAt = { $gte: monthAgo }
      }
    } else if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query.createdAt.$lte = end
      }
    }

    // Channel filters
    if (source) query.source = source
    if (channel) query.channel = channel
    
    // Organization filters
    if (outletId) query.outletId = outletId
    if (cashierId) query.userId = cashierId
    if (customerId) query.customerId = customerId
    
    // Product filters
    if (productId) query.productId = productId
    if (category) query.category = category
    if (variant) query.variant = variant
    if (size) query.size = size
    
    // Payment filters
    if (paymentMethod) query.paymentMethod = paymentMethod
    if (splitPayment) query.isSplitPayment = true
    
    // Transaction type filters
    if (eventType) query.eventType = eventType
    if (hasDiscount) query.discountMinor = { $gt: 0 }
    if (creditTransaction) {
      query.eventType = { $in: ['credit_issued', 'credit_adjustment', 'credit_limit_change', 'customer_repayment'] }
    }
    if (inventoryMovement) {
      query.eventType = { $in: ['inventory_added', 'inventory_removed', 'inventory_adjusted', 'stock_transferred'] }
    }
    if (heldOrder) {
      query.eventType = { $in: ['held_order_created', 'held_order_resumed', 'held_order_cancelled'] }
    }
    if (cancelledOrder) {
      query.eventType = { $in: ['order_cancelled', 'sale_reversed'] }
    }
    if (returnOrder) query.eventType = 'return'
    if (refundOrder) query.eventType = 'refund'
    
    // System filters
    if (syncStatus) query.syncStatus = syncStatus
    if (deviceId) query.deviceId = deviceId
    if (wasOffline) query.wasOffline = true
    
    // Search
    if (search) {
      query.$or = [
        { referenceNumber: { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
        { itemCode: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { mpesaReference: { $regex: search, $options: 'i' } },
        { receiptNumber: { $regex: search, $options: 'i' } },
      ]
    }

    const [entries, total] = await Promise.all([
      LedgerEntry.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LedgerEntry.countDocuments(query)
    ])

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/reports/ledger]', error)
    return NextResponse.json({ error: 'Failed to fetch ledger entries' }, { status: 500 })
  }
}
