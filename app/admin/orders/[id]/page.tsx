'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  CreditCard, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle,
  Edit,
  Save,
  Phone,
  Mail
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import Image from 'next/image'
import { toast } from 'sonner'

interface OrderItem {
  productId: string
  productName: string
  productImage: string
  variantId?: string
  variantDetails?: {
    type: string
    value: string
    sku: string
  }
  quantity: number
  price: number
  totalPrice: number
}

interface Order {
  _id: string
  orderNumber: string
  userId: string
  customerEmail: string
  customerPhone?: string
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  shippingAddress: {
    name: string
    phone: string
    county: string
    area: string
  }
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: 'mpesa' | 'card' | 'bank_transfer' | 'cash_on_delivery'
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
  customerNotes?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
}

export default function AdminOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editingStatus, setEditingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [newPaymentStatus, setNewPaymentStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
        setNewStatus(data.order.status)
        setNewPaymentStatus(data.order.paymentStatus)
        setTrackingNumber(data.order.trackingNumber || '')
        setAdminNotes(data.order.adminNotes || '')
      } else {
        toast.error('Order not found')
        router.push('/admin/orders')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const updateOrder = async () => {
    if (!order) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          paymentStatus: newPaymentStatus,
          trackingNumber: trackingNumber || undefined,
          adminNotes: adminNotes || undefined
        })
      })

      if (response.ok) {
        toast.success('Order updated successfully')
        setEditingStatus(false)
        fetchOrder()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update order')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
    } finally {
      setUpdating(false)
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
      returned: { variant: 'outline' as const, icon: Package, color: 'text-gray-600' }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p>Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Order not found</h3>
        <p className="text-gray-500 mb-4">The order you're looking for doesn't exist.</p>
        <Button asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/orders">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order {order.orderNumber}</h1>
            <p className="text-gray-600 mt-1">
              Placed on {format(new Date(order.createdAt), 'MMMM dd, yyyy \'at\' HH:mm')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(order.status)}
          {getPaymentStatusBadge(order.paymentStatus)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="relative w-16 h-16 shrink-0">
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{item.productName}</h3>
                    {item.variantDetails && (
                      <p className="text-sm text-muted-foreground">
                        {item.variantDetails.type}: {item.variantDetails.value}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} × KSH {item.price.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold">KSH {item.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              ))}

              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>KSH {order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{order.shippingCost > 0 ? `KSH ${order.shippingCost.toFixed(2)}` : 'FREE'}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-KSH {order.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>KSH {order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Notes */}
          {order.customerNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.customerNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Management */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{order.customerEmail}</span>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{order.customerPhone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.area}, {order.shippingAddress.county}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Payment Method</Label>
                <p className="text-sm capitalize">
                  {order.paymentMethod.replace('_', ' ')}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Payment Status</Label>
                <div className="mt-1">
                  {getPaymentStatusBadge(order.paymentStatus)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Order Management
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingStatus(!editingStatus)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingStatus ? (
                <>
                  <div>
                    <Label htmlFor="status">Order Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Select value={newPaymentStatus} onValueChange={setNewPaymentStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tracking">Tracking Number</Label>
                    <input
                      id="tracking"
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter tracking number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Admin Notes</Label>
                    <Textarea
                      id="notes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add internal notes..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={updateOrder} disabled={updating} className="flex-1">
                      {updating ? (
                        <>
                          <Package className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingStatus(false)}
                      disabled={updating}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-sm font-medium">Current Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {order.trackingNumber && (
                    <div>
                      <Label className="text-sm font-medium">Tracking Number</Label>
                      <p className="text-sm font-mono">{order.trackingNumber}</p>
                    </div>
                  )}

                  {order.adminNotes && (
                    <div>
                      <Label className="text-sm font-medium">Admin Notes</Label>
                      <p className="text-sm">{order.adminNotes}</p>
                    </div>
                  )}

                  {order.shippedAt && (
                    <div>
                      <Label className="text-sm font-medium">Shipped At</Label>
                      <p className="text-sm">{format(new Date(order.shippedAt), 'MMM dd, yyyy HH:mm')}</p>
                    </div>
                  )}

                  {order.deliveredAt && (
                    <div>
                      <Label className="text-sm font-medium">Delivered At</Label>
                      <p className="text-sm">{format(new Date(order.deliveredAt), 'MMM dd, yyyy HH:mm')}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}