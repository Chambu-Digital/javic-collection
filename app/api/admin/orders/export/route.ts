import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import { requireAuth } from '@/lib/auth'
import { format } from 'date-fns'

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
    
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const search = searchParams.get('search')
    
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
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } }
      ]
    }
    
    // Get all matching orders
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .lean()
    
    // Generate CSV content
    const csvHeaders = [
      'Order Number',
      'Customer Email',
      'Customer Phone',
      'Customer Name',
      'Items Count',
      'Subtotal',
      'Shipping',
      'Tax',
      'Total Amount',
      'Status',
      'Payment Status',
      'Payment Method',
      'County',
      'Area',
      'Tracking Number',
      'Order Date',
      'Shipped Date',
      'Delivered Date'
    ].join(',')
    
    const csvRows = orders.map(order => [
      order.orderNumber,
      order.customerEmail,
      order.customerPhone || '',
      order.shippingAddress.name,
      order.items.length,
      order.subtotal.toFixed(2),
      order.shippingCost.toFixed(2),
      order.taxAmount.toFixed(2),
      order.totalAmount.toFixed(2),
      order.status,
      order.paymentStatus,
      order.paymentMethod,
      order.shippingAddress.county,
      order.shippingAddress.area,
      order.trackingNumber || '',
      format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      order.shippedAt ? format(new Date(order.shippedAt), 'yyyy-MM-dd HH:mm:ss') : '',
      order.deliveredAt ? format(new Date(order.deliveredAt), 'yyyy-MM-dd HH:mm:ss') : ''
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    
    const csvContent = [csvHeaders, ...csvRows].join('\n')
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orders-${format(new Date(), 'yyyy-MM-dd')}.csv"`
      }
    })
    
  } catch (error: any) {
    console.error('Error exporting orders:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    )
  }
}