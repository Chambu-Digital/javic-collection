import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/Product'
import User from '@/models/User'
import Review from '@/models/Review'
import BranchStock from '@/models/BranchStock'
import { requireAdmin } from '@/lib/auth'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type')
    const period = searchParams.get('period') || '30' // days
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const branchId = searchParams.get('branchId') // Branch filter for sale-line level reporting
    
    // Calculate date range
    let dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    } else {
      const days = parseInt(period)
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - days)
      dateFilter = {
        createdAt: { $gte: fromDate }
      }
    }
    
    switch (reportType) {
      case 'sales-overview':
        return NextResponse.json(await getSalesOverview(dateFilter, branchId))
      
      case 'product-performance':
        return NextResponse.json(await getProductPerformance(dateFilter, branchId))
      
      case 'customer-analytics':
        return NextResponse.json(await getCustomerAnalytics(dateFilter, branchId))
      
      case 'revenue-trends':
        return NextResponse.json(await getRevenueTrends(dateFilter, branchId))
      
      case 'top-products':
        const limit = parseInt(searchParams.get('limit') || '10')
        return NextResponse.json(await getTopProducts(dateFilter, limit, branchId))
      
      case 'geographic-distribution':
        return NextResponse.json(await getGeographicDistribution(dateFilter, branchId))
      
      case 'order-analytics':
        return NextResponse.json(await getOrderAnalytics(dateFilter, branchId))
      
      default:
        return NextResponse.json(await getDashboardSummary(dateFilter, branchId))
    }
    
  } catch (error: any) {
    console.error('Error fetching reports:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

async function getSalesOverview(dateFilter: any, branchId?: string | null) {
  // Build item-level filter for branch filtering
  const itemFilter: any = {}
  if (branchId && branchId !== 'all') {
    itemFilter['items.branchId'] = new mongoose.Types.ObjectId(branchId)
  }

  const [
    totalRevenue,
    totalOrders,
    averageOrderValue,
    topPaymentMethods,
    revenueByStatus
  ] = await Promise.all([
    // Total revenue - use unwind for branch-level filtering
    Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      ...(branchId && branchId !== 'all' ? [{ $match: { 'items.branchId': new mongoose.Types.ObjectId(branchId) } }] : []),
      { $match: { status: { $nin: ['cancelled', 'returned'] } } },
      { $group: { _id: null, total: { $sum: '$items.totalPrice' } } }
    ]),
    
    // Total orders - count orders that have items from the specified branch
    Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      ...(branchId && branchId !== 'all' ? [{ $match: { 'items.branchId': new mongoose.Types.ObjectId(branchId) } }] : []),
      { $group: { _id: '$_id' } },
      { $count: 'total' }
    ]),
    
    // Average order value - use branch-filtered line items
    Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      ...(branchId && branchId !== 'all' ? [{ $match: { 'items.branchId': new mongoose.Types.ObjectId(branchId) } }] : []),
      { $match: { status: { $nin: ['cancelled', 'returned'] } } },
      { $group: { _id: '$_id', orderTotal: { $sum: '$items.totalPrice' } } },
      { $group: { _id: null, avg: { $avg: '$orderTotal' } } }
    ]),
    
    // Payment methods distribution
    Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      ...(branchId && branchId !== 'all' ? [{ $match: { 'items.branchId': new mongoose.Types.ObjectId(branchId) } }] : []),
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$items.totalPrice' } } },
      { $sort: { count: -1 } }
    ]),
    
    // Revenue by order status
    Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      ...(branchId && branchId !== 'all' ? [{ $match: { 'items.branchId': new mongoose.Types.ObjectId(branchId) } }] : []),
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$items.totalPrice' } } }
    ])
  ])
  
  return {
    totalRevenue: totalRevenue[0]?.total || 0,
    totalOrders: totalOrders[0]?.total || 0,
    averageOrderValue: averageOrderValue[0]?.avg || 0,
    paymentMethods: topPaymentMethods,
    revenueByStatus
  }
}

async function getProductPerformance(dateFilter: any, branchId?: string | null) {
  const branchFilter = branchId && branchId !== 'all' 
    ? [{ $match: { 'items.branchId': new mongoose.Types.ObjectId(branchId) } }]
    : []

  const [
    topSellingProducts,
    categoryPerformance,
    lowStockProducts,
    productRatings
  ] = await Promise.all([
    // Top selling products
    Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      ...branchFilter,
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]),
    
    // Category performance
    Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      ...branchFilter,
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          productCount: { $addToSet: '$items.productId' }
        }
      },
      {
        $project: {
          category: '$_id',
          totalQuantity: 1,
          totalRevenue: 1,
          uniqueProducts: { $size: '$productCount' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]),
    
    // Low stock products - this should use branch stock if branch is specified
    ...(branchId && branchId !== 'all' 
      ? [
          BranchStock.aggregate([
            { $match: { branchId: new mongoose.Types.ObjectId(branchId), quantity: { $lte: 10 } } },
            {
              $lookup: {
                from: 'products',
                localField: 'productId',
                foreignField: '_id',
                as: 'product'
              }
            },
            { $unwind: '$product' },
            { $match: { 'product.isActive': true } },
            {
              $group: {
                _id: '$productId',
                name: { $first: '$product.name' },
                stockQuantity: { $sum: '$quantity' },
                hasVariants: { $first: '$product.hasVariants' }
              }
            },
            { $limit: 20 }
          ])
        ]
      : [
          Product.find({
            $or: [
              { hasVariants: false, stockQuantity: { $lte: 10 } },
              { hasVariants: true, 'variants.stock': { $lte: 10 } }
            ],
            isActive: true
          }).select('name stockQuantity variants.stock variants.value hasVariants').limit(20)
        ]
    ),
    
    // Product ratings summary (not affected by branch filter)
    Review.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          averageRating: 1,
          totalReviews: 1
        }
      },
      { $sort: { averageRating: -1, totalReviews: -1 } },
      { $limit: 10 }
    ])
  ])
  
  return {
    topSellingProducts,
    categoryPerformance,
    lowStockProducts: Array.isArray(lowStockProducts) ? lowStockProducts[0] : lowStockProducts,
    topRatedProducts: productRatings
  }
}

async function getCustomerAnalytics(dateFilter: any, branchId?: string | null) {
  const branchFilter = branchId && branchId !== 'all' 
    ? [{ $match: { 'items.branchId': new mongoose.Types.ObjectId(branchId) } }]
    : []
  const [
    newCustomers,
    topCustomers,
    geographicDistribution,
    customerRetention
  ] = await Promise.all([
    // New customers in period
    User.countDocuments({ ...dateFilter, role: 'customer' }),
    
    // Top customers by orders and revenue - use branch-filtered line items
    Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      ...branchFilter,
      {
        $group: {
          _id: '$userId',
          customerEmail: { $first: '$customerEmail' },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$items.totalPrice' },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]),
    
    // Geographic distribution - use branch-filtered line items
    Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      ...branchFilter,
      {
        $group: {
          _id: '$shippingAddress.county',
          orderCount: { $sum: 1 },
          revenue: { $sum: '$items.totalPrice' },
          uniqueCustomers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          county: '$_id',
          orderCount: 1,
          revenue: 1,
          customerCount: { $size: '$uniqueCustomers' }
        }
      },
      { $sort: { revenue: -1 } }
    ]),
    
    // Customer retention (customers with multiple orders) - use branch-filtered line items
    Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      ...branchFilter,
      {
        $group: {
          _id: { userId: '$userId', orderId: '$_id' }
        }
      },
      {
        $group: {
          _id: '$_id.userId',
          orderCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          repeatCustomers: {
            $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          totalCustomers: 1,
          repeatCustomers: 1,
          retentionRate: {
            $multiply: [
              { $divide: ['$repeatCustomers', '$totalCustomers'] },
              100
            ]
          }
        }
      }
    ])
  ])
  
  return {
    newCustomers,
    topCustomers,
    geographicDistribution,
    customerRetention: customerRetention[0] || { totalCustomers: 0, repeatCustomers: 0, retentionRate: 0 }
  }
}

async function getRevenueTrends(dateFilter: any, branchId?: string | null) {
  const branchFilter = branchId && branchId !== 'all' 
    ? [{ $match: { 'items.branchId': new mongoose.Types.ObjectId(branchId) } }]
    : []
  return Order.aggregate([
    { $match: dateFilter },
    { $unwind: '$items' },
    ...branchFilter,
    { $match: { status: { $nin: ['cancelled', 'returned'] } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        revenue: { $sum: '$items.totalPrice' },
        orders: { $sum: 1 }
      }
    },
    {
      $project: {
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day'
          }
        },
        revenue: 1,
        orders: 1
      }
    },
    { $sort: { date: 1 } }
  ])
}

async function getTopProducts(dateFilter: any, limit: number, branchId?: string | null) {
  const branchFilter = branchId && branchId !== 'all' 
    ? [{ $match: { 'items.branchId': new mongoose.Types.ObjectId(branchId) } }]
    : []
  return Order.aggregate([
    { $match: dateFilter },
    { $unwind: '$items' },
    ...branchFilter,
    {
      $group: {
        _id: '$items.productId',
        productName: { $first: '$items.productName' },
        productImage: { $first: '$items.productImage' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalPrice' },
        averagePrice: { $avg: '$items.price' }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit }
  ])
}

async function getGeographicDistribution(dateFilter: any, branchId?: string | null) {
  const branchFilter = branchId && branchId !== 'all' 
    ? [{ $match: { 'items.branchId': new mongoose.Types.ObjectId(branchId) } }]
    : []
  return Order.aggregate([
    { $match: dateFilter },
    { $unwind: '$items' },
    ...branchFilter,
    {
      $group: {
        _id: {
          county: '$shippingAddress.county',
          area: '$shippingAddress.area'
        },
        orderCount: { $sum: 1 },
        revenue: { $sum: '$items.totalPrice' },
        customers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        county: '$_id.county',
        area: '$_id.area',
        orderCount: 1,
        revenue: 1,
        customerCount: { $size: '$customers' }
      }
    },
    { $sort: { revenue: -1 } }
  ])
}

async function getOrderAnalytics(dateFilter: any, branchId?: string | null) {
  const branchFilter = branchId && branchId !== 'all' 
    ? [{ $match: { 'items.branchId': new mongoose.Types.ObjectId(branchId) } }]
    : []
  const [
    statusDistribution,
    fulfillmentTimes,
    shippingPerformance
  ] = await Promise.all([
    // Order status distribution - use branch-filtered line items
    Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      ...branchFilter,
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          percentage: { $sum: 1 }
        }
      }
    ]),
    
    // Average fulfillment times
    Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: 'delivered',
          deliveredAt: { $exists: true }
        }
      },
      {
        $project: {
          fulfillmentTime: {
            $divide: [
              { $subtract: ['$deliveredAt', '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageFulfillmentDays: { $avg: '$fulfillmentTime' },
          minFulfillmentDays: { $min: '$fulfillmentTime' },
          maxFulfillmentDays: { $max: '$fulfillmentTime' }
        }
      }
    ]),
    
    // Shipping performance by county
    Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ['shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: '$shippingAddress.county',
          totalOrders: { $sum: 1 },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          county: '$_id',
          totalOrders: 1,
          deliveredOrders: 1,
          deliveryRate: {
            $multiply: [
              { $divide: ['$deliveredOrders', '$totalOrders'] },
              100
            ]
          }
        }
      },
      { $sort: { totalOrders: -1 } }
    ])
  ])
  
  return {
    statusDistribution,
    fulfillmentTimes: fulfillmentTimes[0] || {},
    shippingPerformance
  }
}

async function getDashboardSummary(dateFilter: any, branchId?: string | null) {
  const branchFilter = branchId && branchId !== 'all' 
    ? [{ $match: { 'items.branchId': new mongoose.Types.ObjectId(branchId) } }]
    : []
  const [salesOverview, productStats, customerStats] = await Promise.all([
    getSalesOverview(dateFilter, branchId),
    getProductPerformance(dateFilter, branchId),
    getCustomerAnalytics(dateFilter, branchId)
  ])
  
  return {
    sales: salesOverview,
    products: {
      topSelling: productStats.topSellingProducts.slice(0, 5),
      lowStock: productStats.lowStockProducts.slice(0, 5)
    },
    customers: {
      new: customerStats.newCustomers,
      retention: customerStats.customerRetention,
      topSpenders: customerStats.topCustomers.slice(0, 5)
    }
  }
}
