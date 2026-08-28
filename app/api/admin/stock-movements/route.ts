import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import LedgerEntry from '@/models/LedgerEntry'
import { requireAuth } from '@/lib/auth'

// GET /api/admin/stock-movements - Fetch stock movement history
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await connectDB()

    const searchParams = request.nextUrl.searchParams
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Filters
    const eventType = searchParams.get('eventType')
    const branchId = searchParams.get('branchId')
    const productId = searchParams.get('productId')
    const vendorId = searchParams.get('vendorId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const searchQuery = searchParams.get('search')

    // Build query
    const query: any = {
      eventType: { 
        $in: ['inventory_added', 'inventory_removed', 'inventory_adjusted', 'stock_transferred'] 
      }
    }

    // Apply filters
    if (eventType && eventType !== 'all') {
      query.eventType = eventType
    }

    if (branchId && branchId !== 'all') {
      query.branchId = branchId
    }

    if (productId) {
      query.productId = productId
    }

    if (vendorId && vendorId !== 'all') {
      query['metadata.vendorId'] = vendorId
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) {
        query.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        // Add 1 day to include the entire end date
        const end = new Date(endDate)
        end.setDate(end.getDate() + 1)
        query.createdAt.$lt = end
      }
    }

    // Search by product name or entry number
    if (searchQuery) {
      query.$or = [
        { productName: { $regex: searchQuery, $options: 'i' } },
        { entryNumber: { $regex: searchQuery, $options: 'i' } }
      ]
    }

    // Fetch movements with pagination
    const [movements, totalCount] = await Promise.all([
      LedgerEntry.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('branchId', 'name branchCode')
        .populate('productId', 'name images')
        .populate('userId', 'firstName lastName')
        .lean(),
      LedgerEntry.countDocuments(query)
    ])

    // Get summary statistics for today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const todayStats = await LedgerEntry.aggregate([
      {
        $match: {
          eventType: { 
            $in: ['inventory_added', 'inventory_removed', 'inventory_adjusted', 'stock_transferred'] 
          },
          createdAt: { $gte: todayStart }
        }
      },
      {
        $group: {
          _id: '$eventType',
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      }
    ])

    // Calculate today's statistics
    const todaySummary = {
      totalMovements: todayStats.reduce((sum, stat) => sum + stat.count, 0),
      added: todayStats.find(s => s._id === 'inventory_added')?.totalQuantity || 0,
      removed: todayStats.find(s => s._id === 'inventory_removed')?.totalQuantity || 0,
      adjusted: todayStats.find(s => s._id === 'inventory_adjusted')?.totalQuantity || 0,
      transferred: todayStats.find(s => s._id === 'stock_transferred')?.totalQuantity || 0,
    }

    // Get low stock count
    const BranchStock = (await import('@/models/BranchStock')).default
    const lowStockCount = await BranchStock.countDocuments({
      quantity: { $lte: 10, $gt: 0 }
    })

    // Format movements for response
    const formattedMovements = movements.map((movement: any) => ({
      _id: movement._id,
      entryNumber: movement.entryNumber,
      eventType: movement.eventType,
      productId: movement.productId?._id,
      productName: movement.productName,
      productImage: movement.variantImageUrl || movement.productId?.images?.[0]?.url,
      size: movement.size,
      quantity: movement.quantity,
      branchId: movement.branchId?._id,
      branchName: movement.branchId?.name,
      branchCode: movement.branchCode || movement.branchId?.branchCode,
      vendorName: movement.metadata?.vendorName,
      vendorCode: movement.metadata?.vendorCode,
      userName: movement.userName || (movement.userId ? `${movement.userId.firstName} ${movement.userId.lastName}` : 'System'),
      notes: movement.notes,
      createdAt: movement.createdAt,
    }))

    return NextResponse.json({
      movements: formattedMovements,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
      summary: {
        today: todaySummary,
        lowStockCount,
      }
    })
  } catch (error: any) {
    console.error('Error fetching stock movements:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock movements' },
      { status: 500 }
    )
  }
}
