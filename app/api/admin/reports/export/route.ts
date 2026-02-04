import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/Product'
import User from '@/models/User'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30'
    const format = searchParams.get('format') || 'csv'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
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
    
    if (format === 'csv') {
      return await exportCSV(dateFilter)
    }
    
    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    
  } catch (error: any) {
    console.error('Error exporting report:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    )
  }
}

async function exportCSV(dateFilter: any) {
  try {
    // Get orders data for export
    const orders = await Order.find(dateFilter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(1000) // Limit to prevent memory issues
    
    // Create CSV headers
    const headers = [
      'Order ID',
      'Date',
      'Customer Email',
      'Customer Name',
      'Status',
      'Payment Method',
      'Total Amount',
      'Items Count',
      'County',
      'Area'
    ]
    
    // Create CSV rows
    const rows = orders.map(order => [
      order._id.toString(),
      order.createdAt.toISOString().split('T')[0],
      order.customerEmail || 'N/A',
      order.customerName || 'N/A',
      order.status,
      order.paymentMethod || 'N/A',
      order.totalAmount.toString(),
      order.items.length.toString(),
      order.shippingAddress?.county || 'N/A',
      order.shippingAddress?.area || 'N/A'
    ])
    
    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    // Return CSV response
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="electromatt-orders-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
    
  } catch (error) {
    console.error('Error generating CSV:', error)
    throw error
  }
}
