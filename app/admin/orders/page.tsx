'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Package, 
  Search, 
  Filter, 
  Eye, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle,
  MoreHorizontal,
  Download,
  RefreshCw,
  MessageCircle
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Order {
  _id: string
  orderNumber: string
  customerEmail: string
  customerPhone?: string
  totalAmount: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: 'mpesa' | 'card' | 'bank_transfer' | 'cash_on_delivery'
  items: Array<{
    productName: string
    quantity: number
    price: number
    totalPrice: number
  }>
  shippingAddress: {
    name: string
    phone: string
    county: string
    area: string
  }
  adminNotes?: string
  customerNotes?: string
  createdAt: string
  updatedAt: string
}

interface OrderStats {
  total: number
  pending: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
  totalRevenue: number
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [currentPage, statusFilter, paymentFilter, searchTerm])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentFilter !== 'all' && { paymentStatus: paymentFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/admin/orders?${params}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setTotalPages(data.pagination?.pages || 1)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/orders/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      confirmed: { variant: 'default' as const, icon: CheckCircle, color: 'text-blue-600' },
      processing: { variant: 'default' as const, icon: Package, color: 'text-purple-600' },
      shipped: { variant: 'default' as const, icon: Truck, color: 'text-orange-600' },
      delivered: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      returned: { variant: 'outline' as const, icon: RefreshCw, color: 'text-gray-600' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary' as const,
      paid: 'default' as const,
      failed: 'destructive' as const,
      refunded: 'outline' as const
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const isWhatsAppOrder = (order: Order) => {
    return (
      order.customerEmail === 'whatsapp@electromatt.co.ke' ||
      order.adminNotes?.includes('WhatsApp Order') ||
      order.customerNotes?.includes('Order placed via WhatsApp')
    )
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentFilter !== 'all' && { paymentStatus: paymentFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/admin/orders/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting orders:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-2">
            Manage and track all customer orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchOrders} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.processing}</div>
              <p className="text-xs text-muted-foreground">Processing</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.shipped}</div>
              <p className="text-xs text-muted-foreground">Shipped</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
              <p className="text-xs text-muted-foreground">Delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">KSH {stats.totalRevenue.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setPaymentFilter('all')
                setCurrentPage(1)
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({orders.length})</CardTitle>
          <CardDescription>
            Recent orders from your customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Orders will appear here when customers place them'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Order</th>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Items</th>
                    <th className="text-left p-4 font-medium">Total</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Payment</th>
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-muted-foreground">
                                {order.paymentMethod.replace('_', ' ').toUpperCase()}
                              </p>
                              {isWhatsAppOrder(order) && (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  WhatsApp
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{order.customerEmail}</p>
                          {order.customerPhone && (
                            <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {order.shippingAddress.area}, {order.shippingAddress.county}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{order.items.length} items</p>
                          <p className="text-sm text-muted-foreground">
                            {order.items.slice(0, 2).map(item => item.productName).join(', ')}
                            {order.items.length > 2 && '...'}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">KSH {order.totalAmount.toFixed(2)}</p>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="p-4">
                        {getPaymentStatusBadge(order.paymentStatus)}
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.createdAt), 'HH:mm')}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/orders/${order._id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}