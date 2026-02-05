'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin,
  Phone,
  Mail,
  Calendar,
  ShoppingBag
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/custom-toast'

interface OrderItem {
  productId: string
  productName: string
  productImage: string
  quantity: number
  price: number
  totalPrice: number
  variant?: string
}

interface Order {
  _id: string
  orderNumber: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  customerEmail: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  shippingAddress: {
    name: string
    phone: string
    county: string
    area: string
    address: string
  }
  createdAt: string
  updatedAt: string
  estimatedDelivery?: string
  trackingNumber?: string
}

export default function TrackOrderPage() {
  const { success: showSuccessToast, error: showErrorToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'order' | 'email'>('order')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [notFound, setNotFound] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) {
      showErrorToast('Please enter an order number or email')
      return
    }

    setLoading(true)
    setNotFound(false)
    setOrder(null)

    try {
      const params = new URLSearchParams({
        [searchType]: searchQuery.trim()
      })

      const response = await fetch(`/api/orders/track?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.order) {
          setOrder(data.order)
          showSuccessToast('Order found!')
        } else {
          setNotFound(true)
          showErrorToast('Order not found')
        }
      } else {
        setNotFound(true)
        showErrorToast('Order not found')
      }
    } catch (error) {
      console.error('Error tracking order:', error)
      showErrorToast('Error searching for order')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-purple-100 text-purple-800'
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'confirmed':
      case 'processing':
        return <Package className="w-4 h-4" />
      case 'shipped':
        return <Truck className="w-4 h-4" />
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary mb-4">
            JAVIC COLLECTION
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-600">Enter your order details to check the status</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Find Your Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setSearchType('order')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    searchType === 'order'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Order Number
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('email')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    searchType === 'email'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Email Address
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search">
                  {searchType === 'order' ? 'Order Number' : 'Email Address'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="search"
                    type={searchType === 'email' ? 'email' : 'text'}
                    placeholder={
                      searchType === 'order' 
                        ? 'Enter your order number (e.g., ORD-123456)' 
                        : 'Enter your email address'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Track Order'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Order Not Found */}
        {notFound && (
          <Card className="mb-8">
            <CardContent className="text-center py-8">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Not Found</h3>
              <p className="text-gray-600 mb-4">
                We couldn't find an order with the provided details. Please check and try again.
              </p>
              <div className="text-sm text-gray-500">
                <p>Need help? Contact us:</p>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <a href="tel:+254706512984" className="flex items-center gap-1 hover:text-primary">
                    <Phone className="w-4 h-4" />
                    +254 706 512 984
                  </a>
                  <a href="mailto:support@javiccollection.co.ke" className="flex items-center gap-1 hover:text-primary">
                    <Mail className="w-4 h-4" />
                    support@javiccollection.co.ke
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    Order #{order.orderNumber}
                  </CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="font-medium">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-medium">KSH {order.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium capitalize">{order.paymentMethod}</p>
                  </div>
                </div>

                {order.trackingNumber && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Tracking Number:</strong> {order.trackingNumber}
                    </p>
                  </div>
                )}

                {order.estimatedDelivery && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Estimated Delivery:</strong> {formatDate(order.estimatedDelivery)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer & Shipping Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{order.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{order.customerPhone}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="font-medium">{order.shippingAddress.name}</p>
                    <p>{order.shippingAddress.address}</p>
                    <p>{order.shippingAddress.area}, {order.shippingAddress.county}</p>
                    <p className="text-sm text-gray-600">{order.shippingAddress.phone}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Order Items ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center gap-4">
                        <img
                          src={item.productImage || '/placeholder-product.jpg'}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.productName}</h4>
                          {item.variant && (
                            <p className="text-sm text-gray-600">Variant: {item.variant}</p>
                          )}
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity} × KSH {item.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">KSH {item.totalPrice.toLocaleString()}</p>
                        </div>
                      </div>
                      {index < order.items.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-primary hover:underline font-medium"
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}