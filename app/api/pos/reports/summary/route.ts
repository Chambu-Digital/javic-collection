import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'
import LedgerEntry from '@/models/LedgerEntry'
import Order from '@/models/Order'

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
    const outletId = searchParams.get('outletId')
    const cashierId = searchParams.get('cashierId')
    
    // Build date filter
    const dateFilter: Record<string, unknown> = {}
    if (quickDate) {
      const now = new Date()
      const startOfDay = new Date(now.setHours(0, 0, 0, 0))
      
      if (quickDate === 'today') {
        dateFilter.$gte = startOfDay
      } else if (quickDate === 'week') {
        const weekAgo = new Date(startOfDay)
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter.$gte = weekAgo
      } else if (quickDate === 'month') {
        const monthAgo = new Date(startOfDay)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFilter.$gte = monthAgo
      }
    } else if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        dateFilter.$lte = end
      }
    }

    // Base query
    const baseQuery: Record<string, unknown> = {}
    if (Object.keys(dateFilter).length > 0) {
      baseQuery.createdAt = dateFilter
    }
    if (source) baseQuery.source = source
    if (outletId) baseQuery.outletId = outletId
    if (cashierId) baseQuery.userId = cashierId

    // Sales summaries
    const salesQuery = { ...baseQuery, eventType: { $in: ['pos_sale', 'online_sale', 'wholesale_sale', 'retail_sale'] } }
    const posSalesQuery = { ...baseQuery, eventType: 'pos_sale' }
    const onlineSalesQuery = { ...baseQuery, eventType: 'online_sale' }
    const retailSalesQuery = { ...baseQuery, eventType: 'retail_sale' }
    const wholesaleSalesQuery = { ...baseQuery, eventType: 'wholesale_sale' }

    const [
      totalSales,
      posSales,
      onlineSales,
      retailSales,
      wholesaleSales,
      cashPayments,
      mpesaPayments,
      creditIssued,
      creditRepaid,
      discounts,
      returns,
      refunds,
      offlineTransactions,
      failedSyncs,
    ] = await Promise.all([
      // Total sales (all channels)
      LedgerEntry.aggregate([
        { $match: salesQuery },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalMinor' },
            count: { $sum: 1 },
          },
        },
      ]),
      // POS sales
      LedgerEntry.aggregate([
        { $match: posSalesQuery },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalMinor' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Online sales
      LedgerEntry.aggregate([
        { $match: onlineSalesQuery },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalMinor' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Retail sales
      LedgerEntry.aggregate([
        { $match: retailSalesQuery },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalMinor' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Wholesale sales
      LedgerEntry.aggregate([
        { $match: wholesaleSalesQuery },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalMinor' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Cash payments
      LedgerEntry.aggregate([
        { $match: { ...baseQuery, eventType: 'cash_payment' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalMinor' },
            count: { $sum: 1 },
          },
        },
      ]),
      // M-Pesa payments
      LedgerEntry.aggregate([
        { $match: { ...baseQuery, eventType: 'mpesa_payment' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalMinor' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Credit issued
      LedgerEntry.aggregate([
        { $match: { ...baseQuery, eventType: 'credit_issued' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalMinor' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Credit repaid
      LedgerEntry.aggregate([
        { $match: { ...baseQuery, eventType: 'customer_repayment' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalMinor' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Discounts
      LedgerEntry.aggregate([
        { $match: { ...baseQuery, eventType: 'discount_applied' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$discountMinor' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Returns
      LedgerEntry.aggregate([
        { $match: { ...baseQuery, eventType: 'return' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalMinor' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Refunds
      LedgerEntry.aggregate([
        { $match: { ...baseQuery, eventType: 'refund' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalMinor' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Offline transactions
      LedgerEntry.aggregate([
        { $match: { ...baseQuery, wasOffline: true } },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalMinor' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Failed syncs
      LedgerEntry.countDocuments({ ...baseQuery, syncStatus: 'failed' }),
    ])

    // Outstanding credit (current balance, not time-filtered)
    const outstandingCredit = await LedgerEntry.aggregate([
      {
        $match: {
          eventType: { $in: ['credit_issued', 'customer_repayment'] },
        },
      },
      {
        $group: {
          _id: '$customerId',
          balance: {
            $sum: {
              $cond: [
                { $eq: ['$eventType', 'credit_issued'] },
                '$totalMinor',
                { $multiply: ['$totalMinor', -1] },
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: '$balance' },
          customerCount: { $sum: 1 },
        },
      },
    ])

    // Sales by cashier
    const salesByCashier = await LedgerEntry.aggregate([
      {
        $match: { ...baseQuery, eventType: { $in: ['pos_sale', 'retail_sale', 'wholesale_sale'] } },
      },
      {
        $group: {
          _id: { userId: '$userId', userName: '$userName' },
          total: { $sum: '$totalMinor' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ])

    // Sales by outlet
    const salesByOutlet = await LedgerEntry.aggregate([
      {
        $match: { ...baseQuery, eventType: { $in: ['pos_sale', 'retail_sale', 'wholesale_sale'] } },
      },
      {
        $group: {
          _id: { outletId: '$outletId', outletName: '$outletName' },
          total: { $sum: '$totalMinor' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ])

    // Sales by product
    const salesByProduct = await LedgerEntry.aggregate([
      {
        $match: { ...baseQuery, eventType: { $in: ['pos_sale', 'retail_sale', 'wholesale_sale'] } },
      },
      {
        $group: {
          _id: { productId: '$productId', productName: '$productName' },
          total: { $sum: '$totalMinor' },
          quantity: { $sum: '$quantity' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 20 },
    ])

    // Inventory movements
    const inventoryMovements = await LedgerEntry.aggregate([
      {
        $match: {
          ...baseQuery,
          eventType: { $in: ['inventory_added', 'inventory_removed', 'inventory_adjusted', 'stock_transferred'] },
        },
      },
      {
        $group: {
          _id: '$eventType',
          total: { $sum: '$quantity' },
          count: { $sum: 1 },
        },
      },
    ])

    const formatMinor = (val: number) => val / 100

    return NextResponse.json({
      sales: {
        total: totalSales[0] ? { amount: formatMinor(totalSales[0].total), count: totalSales[0].count } : { amount: 0, count: 0 },
        pos: posSales[0] ? { amount: formatMinor(posSales[0].total), count: posSales[0].count } : { amount: 0, count: 0 },
        online: onlineSales[0] ? { amount: formatMinor(onlineSales[0].total), count: onlineSales[0].count } : { amount: 0, count: 0 },
        retail: retailSales[0] ? { amount: formatMinor(retailSales[0].total), count: retailSales[0].count } : { amount: 0, count: 0 },
        wholesale: wholesaleSales[0] ? { amount: formatMinor(wholesaleSales[0].total), count: wholesaleSales[0].count } : { amount: 0, count: 0 },
      },
      payments: {
        cash: cashPayments[0] ? { amount: formatMinor(cashPayments[0].total), count: cashPayments[0].count } : { amount: 0, count: 0 },
        mpesa: mpesaPayments[0] ? { amount: formatMinor(mpesaPayments[0].total), count: mpesaPayments[0].count } : { amount: 0, count: 0 },
      },
      credit: {
        issued: creditIssued[0] ? { amount: formatMinor(creditIssued[0].total), count: creditIssued[0].count } : { amount: 0, count: 0 },
        repaid: creditRepaid[0] ? { amount: formatMinor(creditRepaid[0].total), count: creditRepaid[0].count } : { amount: 0, count: 0 },
        outstanding: outstandingCredit[0] ? { amount: formatMinor(outstandingCredit[0].totalOutstanding), customerCount: outstandingCredit[0].customerCount } : { amount: 0, customerCount: 0 },
      },
      transactions: {
        discounts: discounts[0] ? { amount: formatMinor(discounts[0].total), count: discounts[0].count } : { amount: 0, count: 0 },
        returns: returns[0] ? { amount: formatMinor(returns[0].total), count: returns[0].count } : { amount: 0, count: 0 },
        refunds: refunds[0] ? { amount: formatMinor(refunds[0].total), count: refunds[0].count } : { amount: 0, count: 0 },
        offline: offlineTransactions[0] ? { amount: formatMinor(offlineTransactions[0].total), count: offlineTransactions[0].count } : { amount: 0, count: 0 },
        failedSyncs,
      },
      performance: {
        byCashier: salesByCashier.map((item: any) => ({
          userId: item._id.userId,
          userName: item._id.userName,
          amount: formatMinor(item.total),
          count: item.count,
        })),
        byOutlet: salesByOutlet.map((item: any) => ({
          outletId: item._id.outletId,
          outletName: item._id.outletName,
          amount: formatMinor(item.total),
          count: item.count,
        })),
        byProduct: salesByProduct.map((item: any) => ({
          productId: item._id.productId,
          productName: item._id.productName,
          amount: formatMinor(item.total),
          quantity: item.quantity,
          count: item.count,
        })),
      },
      inventory: inventoryMovements.map((item: any) => ({
        eventType: item._id,
        quantity: item.total,
        count: item.count,
      })),
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/reports/summary]', error)
    return NextResponse.json({ error: 'Failed to fetch report summary' }, { status: 500 })
  }
}
