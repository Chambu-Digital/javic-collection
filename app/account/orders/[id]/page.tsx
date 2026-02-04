'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft,
  Package, 
  Truck,
  MapPin,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react'

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

interface ShippingAddress {
  name: string
  phone: string
  county: string
  area: string
}

interface Order {
  _id: string
  orderNumber: string
  customerEmail: string
  customerPhone?: string
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  shippingAddress: ShippingAddress
  billingAddress?: ShippingAddress
  status: string
  paymentStatus: string
  paymentMethod: string
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
  customerNotes?: string
  createdAt: string
  updatedAt: string
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchOrder(params.id as string)
    }
  }, [params.id])

  const fetchOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const orderData = await response.json()
        setOrder(orderData)
      } else if (response.status === 404) {
        setError('Order not found')
      } else {
        setError('Failed to load order details')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'confirmed':
      case 'processing':
        return <Package className="h-5 w-5 text-blue-600" />
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-600" />
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'cancelled':
      case 'returned':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Package className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
      case 'returned':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'refunded':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Order not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/account/orders">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Order #{order.orderNumber}
          </h1>
          <p className="text-gray-600 mt-2">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {getStatusIcon(order.status)}
          <Badge 
            variant="outline" 
            className={`${getStatusColor(order.status)}`}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
          <Badge 
            variant="outline" 
            className={`${getPaymentStatusColor(order.paymentStatus)}`}
          >
            Payment {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.productName}</h4>
                      {item.variantDetails && (
                        <p className="text-sm text-gray-500">
                          {item.variantDetails.type}: {item.variantDetails.value}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">KSH {item.totalPrice.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">
                        KSH {item.price.toLocaleString()} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p className="text-gray-600 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {order.shippingAddress.phone}
                </p>
                <p className="text-gray-600 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {order.shippingAddress.area}, {order.shippingAddress.county}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>KSH {order.subtotal.toLocaleString()}</span>
              </div>
              
              {order.shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>KSH {order.shippingCost.toLocaleString()}</span>
                </div>
              )}
              
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>KSH {order.taxAmount.toLocaleString()}</span>
                </div>
              )}
              
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-KSH {order.discountAmount.toLocaleString()}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>KSH {order.totalAmount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium capitalize">
                  {order.paymentMethod.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status</span>
                <Badge 
                  variant="outline" 
                  className={`${getPaymentStatusColor(order.paymentStatus)}`}
                >
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{order.customerEmail}</span>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{order.customerPhone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Notes */}
          {order.customerNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">{order.customerNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}