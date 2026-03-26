'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Package, Search, Clock, CheckCircle, XCircle, RefreshCw, MessageCircle, Download } from 'lucide-react'
import { format } from 'date-fns'

interface Order {
  _id: string
  orderNumber: string
  customerEmail: string
  customerPhone?: string
  whatsapp_phone?: string
  totalAmount: number
  status: 'pending' | 'completed' | 'cancelled' | string
  review_request_status: 'not_requested' | 'requested'
  items: Array<{ productName: string; quantity: number; price: number; totalPrice: number }>
  shippingAddress: { name: string; phone: string; county: string; area: string }
  adminNotes?: string
  customerNotes?: string
  createdAt: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => { fetchOrders() }, [currentPage, statusFilter, searchTerm])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })
      const res = await fetch(`/api/admin/orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
        setTotalPages(data.pagination?.pages || 1)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: 'completed' | 'cancelled') => {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) fetchOrders()
      else alert('Failed to update order status')
    } catch {
      alert('Failed to update order status')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRequestReview = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/request-review`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Failed to request review'); return }
      window.open(data.whatsappUrl, '_blank')
      fetchOrders()
    } catch {
      alert('Failed to request review')
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })
      const res = await fetch(`/api/admin/orders/export?${params}`)
      if (res.ok) {
        const blob = await res.blob()
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

  const getStatusBadge = (status: string) => {
    if (status === 'completed') return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
    if (status === 'cancelled') return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>
    if (status === 'pending') return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    // legacy statuses
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length
  const completedCount = orders.filter(o => o.status === 'completed').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{pendingCount} pending · {completedCount} completed</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by order #, name, phone..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCurrentPage(1) }}>
          Clear
        </Button>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />Loading...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              No orders found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3 font-medium">Order</th>
                    <th className="p-3 font-medium">Customer</th>
                    <th className="p-3 font-medium">Items</th>
                    <th className="p-3 font-medium">Total</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id} className="border-b hover:bg-muted/40">
                      <td className="p-3">
                        <p className="font-medium">{order.orderNumber}</p>
                        {(order.customerNotes?.includes('WhatsApp') || order.adminNotes?.includes('WhatsApp')) && (
                          <Badge variant="outline" className="text-green-600 border-green-400 text-xs mt-1">
                            <MessageCircle className="w-3 h-3 mr-1" />WhatsApp
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{order.shippingAddress.name}</p>
                        <p className="text-muted-foreground text-xs">{order.whatsapp_phone || order.customerPhone}</p>
                        <p className="text-muted-foreground text-xs">{order.shippingAddress.area}, {order.shippingAddress.county}</p>
                      </td>
                      <td className="p-3">
                        <p>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                        <p className="text-muted-foreground text-xs truncate max-w-[160px]">
                          {order.items.map(i => i.productName).join(', ')}
                        </p>
                      </td>
                      <td className="p-3 font-semibold">KSH {order.totalAmount.toLocaleString()}</td>
                      <td className="p-3">{getStatusBadge(order.status)}</td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <Button size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={updatingId === order._id}
                              onClick={() => handleStatusChange(order._id, 'completed')}>
                              Mark Completed
                            </Button>
                          )}
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <Button size="sm" variant="destructive"
                              disabled={updatingId === order._id}
                              onClick={() => handleStatusChange(order._id, 'cancelled')}>
                              Cancel
                            </Button>
                          )}
                          {order.status === 'completed' && order.review_request_status === 'not_requested' && (
                            <Button size="sm" variant="outline"
                              className="text-green-600 border-green-500 hover:bg-green-50"
                              onClick={() => handleRequestReview(order._id)}>
                              <MessageCircle className="w-3 h-3 mr-1" />Request Review
                            </Button>
                          )}
                          {order.review_request_status === 'requested' && (
                            <Badge variant="outline" className="text-blue-600 border-blue-300">Review Sent</Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
