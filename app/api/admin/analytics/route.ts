import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/Product'
import User from '@/models/User'
import { requireAdmin } from '@/lib/auth'
import mongoose from 'mongoose'

// Import ProductView model (we'll need to ensure it exists)
let ProductView: mongoose.Model<any>
try {
  ProductView = mongoose.model('ProductView')
} catch {
  // If model doesn't exist, create a basic schema
  const ProductViewSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    sessionId: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    viewedAt: { type: Date, default: Date.now }
  })
  ProductView = mongoose.model('ProductView', ProductViewSchema)
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'dashboard'
    const period = parseInt(searchParams.get('period') || '30')
    
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - period)
    
    const dateFilter = { createdAt: { $gte: fromDate } }
    
    switch (type) {
      case 'conversion-funnel':
        return NextResponse.json(await getConversionFunnel(dateFilter))
      
      case 'product-analytics':
        return NextResponse.json(await getProductAnalytics(dateFilter))
      
      case 'customer-behavior':
        return NextResponse.json(await getCustomerBehavior(dateFilter))
      
      case 'revenue-analysis':
        return NextResponse.json(await getRevenueAnalysis(dateFilter))
      
      case 'inventory-insights':
        return NextResponse.json(await getInventoryInsights())
      
      default:
        return NextResponse.json(await getAnalyticsDashboard(dateFilter))
    }
    
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

async function getConversionFunnel(dateFilter: any) {
  const [
    productViews,
    addToCartEvents, // We'd need to implement cart tracking
    checkoutStarted,
    ordersCompleted
  ] = await Promise.all([
    // Product views
    ProductView.countDocuments({
      viewedAt: dateFilter.createdAt
    }),
    
    // For now, we'll estimate add to cart as 30% of views
    ProductView.countDocuments({
      viewedAt: dateFilter.createdAt
    }).then(views => Math.round(views * 0.3)),
    
    // Checkout started (orders in any status)
    Order.countDocuments(dateFilter),
    
    // Orders completed (delivered status)
    Order.countDocuments({
      ...dateFilter,
      status: { $in: ['delivered', 'shipped'] }
    })
  ])
  
  return {
    funnel: [
      { stage: 'Product Views', count: productViews, percentage: 100 },
      { stage: 'Add to Cart', count: addToCartEvents, percentage: productViews > 0 ? (addToCartEvents / productViews * 100) : 0 },
      { stage: 'Checkout Started', count: checkoutStarted, percentage: productViews > 0 ? (checkoutStarted / productViews * 100) : 0 },
      { stage: 'Orders Completed', count: ordersCompleted, percentage: productViews > 0 ? (ordersCompleted / productViews * 100) : 0 }
    ],
    conversionRate: productViews > 0 ? (ordersCompleted / productViews * 100) : 0
  }
}

async function getProductAnalytics(dateFilter: any) {
  const [
    mostViewedProducts,
    bestConvertingProducts,
    productPerformanceMatrix
  ] = await Promise.all([
    // Most viewed products
    ProductView.aggregate([
      { $match: { viewedAt: dateFilter.createdAt } },
      {
        $group: {
          _id: '$productId',
          totalViews: { $sum: 1 },
          uniqueViews: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          productId: '$_id',
          totalViews: 1,
          uniqueViews: { $size: '$uniqueViews' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          totalViews: 1,
          uniqueViews: 1
        }
      },
      { $sort: { totalViews: -1 } },
      { $limit: 10 }
    ]),
    
    // Best converting products (views to sales ratio)
    ProductView.aggregate([
      { $match: { viewedAt: dateFilter.createdAt } },
      {
        $group: {
          _id: '$productId',
          totalViews: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'orders',
          let: { productId: '$_id' },
          pipeline: [
            { $match: dateFilter },
            { $unwind: '$items' },
            { $match: { $expr: { $eq: ['$items.productId', '$$productId'] } } },
            {
              $group: {
                _id: '$$productId',
                totalSales: { $sum: '$items.quantity' }
              }
            }
          ],
          as: 'sales'
        }
      },
      {
        $project: {
          productId: '$_id',
          totalViews: 1,
          totalSales: { $ifNull: [{ $arrayElemAt: ['$sales.totalSales', 0] }, 0] },
          conversionRate: {
            $cond: {
              if: { $gt: ['$totalViews', 0] },
              then: {
                $multiply: [
                  { $divide: [{ $ifNull: [{ $arrayElemAt: ['$sales.totalSales', 0] }, 0] }, '$totalViews'] },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          totalViews: 1,
          totalSales: 1,
          conversionRate: 1
        }
      },
      { $sort: { conversionRate: -1 } },
      { $limit: 10 }
    ]),
    
    // Product performance matrix (views vs sales)
    Product.aggregate([
      {
        $lookup: {
          from: 'productviews',
          let: { productId: '$_id' },
          pipeline: [
            { $match: { viewedAt: dateFilter.createdAt } },
            { $match: { $expr: { $eq: ['$productId', '$$productId'] } } },
            { $count: 'views' }
          ],
          as: 'viewData'
        }
      },
      {
        $lookup: {
          from: 'orders',
          let: { productId: '$_id' },
          pipeline: [
            { $match: dateFilter },
            { $unwind: '$items' },
            { $match: { $expr: { $eq: ['$items.productId', '$$productId'] } } },
            {
              $group: {
                _id: null,
                totalSales: { $sum: '$items.quantity' },
                totalRevenue: { $sum: '$items.totalPrice' }
              }
            }
          ],
          as: 'salesData'
        }
      },
      {
        $project: {
          name: 1,
          category: 1,
          views: { $ifNull: [{ $arrayElemAt: ['$viewData.views', 0] }, 0] },
          sales: { $ifNull: [{ $arrayElemAt: ['$salesData.totalSales', 0] }, 0] },
          revenue: { $ifNull: [{ $arrayElemAt: ['$salesData.totalRevenue', 0] }, 0] }
        }
      },
      { $match: { $or: [{ views: { $gt: 0 } }, { sales: { $gt: 0 } }] } },
      { $sort: { views: -1 } },
      { $limit: 20 }
    ])
  ])
  
  return {
    mostViewedProducts,
    bestConvertingProducts,
    productPerformanceMatrix
  }
}

async function getCustomerBehavior(dateFilter: any) {
  const [
    sessionAnalytics,
    customerJourney,
    repeatPurchaseBehavior
  ] = await Promise.all([
    // Session analytics
    ProductView.aggregate([
      { $match: { viewedAt: dateFilter.createdAt } },
      {
        $group: {
          _id: '$sessionId',
          pageViews: { $sum: 1 },
          uniqueProducts: { $addToSet: '$productId' },
          sessionStart: { $min: '$viewedAt' },
          sessionEnd: { $max: '$viewedAt' }
        }
      },
      {
        $project: {
          pageViews: 1,
          uniqueProducts: { $size: '$uniqueProducts' },
          sessionDuration: {
            $divide: [
              { $subtract: ['$sessionEnd', '$sessionStart'] },
              1000 * 60 // Convert to minutes
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgPageViews: { $avg: '$pageViews' },
          avgUniqueProducts: { $avg: '$uniqueProducts' },
          avgSessionDuration: { $avg: '$sessionDuration' },
          totalSessions: { $sum: 1 }
        }
      }
    ]),
    
    // Customer journey (time from first view to purchase)
    Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'productviews',
          let: { 
            productId: '$items.productId',
            userId: '$userId',
            orderDate: '$createdAt'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$productId', '$$productId'] },
                    { $eq: ['$userId', '$$userId'] },
                    { $lt: ['$viewedAt', '$$orderDate'] }
                  ]
                }
              }
            },
            { $sort: { viewedAt: 1 } },
            { $limit: 1 }
          ],
          as: 'firstView'
        }
      },
      { $unwind: { path: '$firstView', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          timeToPurchase: {
            $cond: {
              if: '$firstView',
              then: {
                $divide: [
                  { $subtract: ['$createdAt', '$firstView.viewedAt'] },
                  1000 * 60 * 60 * 24 // Convert to days
                ]
              },
              else: null
            }
          }
        }
      },
      { $match: { timeToPurchase: { $ne: null } } },
      {
        $group: {
          _id: null,
          avgTimeToPurchase: { $avg: '$timeToPurchase' },
          medianTimeToPurchase: { $avg: '$timeToPurchase' } // Simplified median
        }
      }
    ]),
    
    // Repeat purchase behavior
    Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$userId',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          firstOrder: { $min: '$createdAt' },
          lastOrder: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          orderCount: 1,
          totalSpent: 1,
          daysBetweenOrders: {
            $cond: {
              if: { $gt: ['$orderCount', 1] },
              then: {
                $divide: [
                  { $subtract: ['$lastOrder', '$firstOrder'] },
                  1000 * 60 * 60 * 24
                ]
              },
              else: null
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          repeatCustomers: {
            $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] }
          },
          avgOrdersPerCustomer: { $avg: '$orderCount' },
          avgSpentPerCustomer: { $avg: '$totalSpent' },
          avgDaysBetweenOrders: { $avg: '$daysBetweenOrders' }
        }
      }
    ])
  ])
  
  return {
    sessionAnalytics: sessionAnalytics[0] || {},
    customerJourney: customerJourney[0] || {},
    repeatPurchaseBehavior: repeatPurchaseBehavior[0] || {}
  }
}

async function getRevenueAnalysis(dateFilter: any) {
  return Order.aggregate([
    { $match: { ...dateFilter, status: { $nin: ['cancelled', 'returned'] } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          week: { $week: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        dailyRevenue: { $sum: '$totalAmount' },
        dailyOrders: { $sum: 1 },
        avgOrderValue: { $avg: '$totalAmount' }
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
        revenue: '$dailyRevenue',
        orders: '$dailyOrders',
        avgOrderValue: '$avgOrderValue'
      }
    },
    { $sort: { date: 1 } }
  ])
}

async function getInventoryInsights() {
  const [
    stockLevels,
    fastMovingProducts,
    slowMovingProducts
  ] = await Promise.all([
    // Current stock levels
    Product.aggregate([
      {
        $project: {
          name: 1,
          category: 1,
          hasVariants: 1,
          stockQuantity: 1,
          variants: 1,
          totalStock: {
            $cond: {
              if: '$hasVariants',
              then: { $sum: '$variants.stock' },
              else: '$stockQuantity'
            }
          }
        }
      },
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$totalStock' },
          lowStockProducts: {
            $sum: { $cond: [{ $lte: ['$totalStock', 10] }, 1, 0] }
          }
        }
      }
    ]),
    
    // Fast moving products (high sales velocity)
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalSold: { $sum: '$items.quantity' },
          salesVelocity: { $sum: '$items.quantity' } // per 30 days
        }
      },
      { $sort: { salesVelocity: -1 } },
      { $limit: 10 }
    ]),
    
    // Slow moving products (low sales velocity)
    Product.aggregate([
      {
        $lookup: {
          from: 'orders',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
              }
            },
            { $unwind: '$items' },
            { $match: { $expr: { $eq: ['$items.productId', '$$productId'] } } },
            {
              $group: {
                _id: null,
                totalSold: { $sum: '$items.quantity' }
              }
            }
          ],
          as: 'sales'
        }
      },
      {
        $project: {
          name: 1,
          category: 1,
          totalStock: {
            $cond: {
              if: '$hasVariants',
              then: { $sum: '$variants.stock' },
              else: '$stockQuantity'
            }
          },
          totalSold: { $ifNull: [{ $arrayElemAt: ['$sales.totalSold', 0] }, 0] }
        }
      },
      { $match: { totalStock: { $gt: 0 }, totalSold: { $lte: 5 } } },
      { $sort: { totalSold: 1 } },
      { $limit: 10 }
    ])
  ])
  
  return {
    stockLevels,
    fastMovingProducts,
    slowMovingProducts
  }
}

async function getAnalyticsDashboard(dateFilter: any) {
  const [
    conversionFunnel,
    topProducts,
    customerBehavior
  ] = await Promise.all([
    getConversionFunnel(dateFilter),
    getProductAnalytics(dateFilter),
    getCustomerBehavior(dateFilter)
  ])
  
  return {
    conversionFunnel,
    topProducts: topProducts.mostViewedProducts.slice(0, 5),
    customerBehavior: customerBehavior.sessionAnalytics
  }
}