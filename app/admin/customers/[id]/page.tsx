'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShoppingCart,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react'

interface CustomerOrder {
  _id: string
  orderNumber: string
  totalAmount: number
  status: string
  paymentStatus: string
  paymentMethod: string
  createdAt: string
  items: Array<{
    productName: string
    quantity: number
    price: number
  }>
}

interface CustomerDetails {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  isActive: boolean
  isEmailVerified: boolean
  addresses: Array<{
    type: string
    name: string
    phone: string
    county: string
    area: string
    isDefault: boolean
  }>
  createdAt: string
}

interface CustomerStats {
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  completedOrders: number
  pendingOrders: number
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerDetails | null>(null)
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [customerId, setCustomerId] = useState<string>('')

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setCustomerId(resolvedParams.id)
    }
    initializeParams()
  }, [params])

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails()
    }
  }, [customerId])

  const fetchCustomerDetails = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}/details`)
      if (response.ok) {
        const data = await response.json()
        setCustomer(data.customer)
        setOrders(data.orders)
        setStats(data.stats)
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to fetch customer details')
      }
    } catch (error) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return `KSH ${amount.toFixed(2)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-orange-100 text-orange-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading customer details...</p>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Button>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-red-600 mb-4">{error || 'Customer not found'}</p>
            <Button onClick={() => router.push('/admin/customers')}>
              Return to Customers
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="text-gray-600 mt-1">Customer Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge 
            variant={customer.isActive ? 'default' : 'secondary'}
            className={customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
          >
            {customer.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {customer.isEmailVerified && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              Verified
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed Orders</p>
                  <p className="text-2xl font-bold">{stats.completedOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customer Profile */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              </div>

              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="font-medium">{formatDate(customer.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Addresses ({customer.addresses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer.addresses.length > 0 ? (
                <div className="space-y-4">
                  {customer.addresses.map((address, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {address.type}
                        </Badge>
                        {address.isDefault && (
                          <Badge variant="default" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium">{address.name}</p>
                      <p className="text-sm text-gray-600">{address.phone}</p>
                      <p className="text-sm text-gray-600">
                        {address.area}, {address.county}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No addresses saved</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Orders ({orders.length})
              </CardTitle>
              <CardDescription>
                Latest orders from this customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">#{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(order.totalAmount)}</p>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Payment Method:</span>
                          <span className="capitalize">{order.paymentMethod.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Payment Status:</span>
                          <Badge variant="outline" className="text-xs">
                            {order.paymentStatus}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Items: </span>
                          <span>
                            {order.items.map(item => `${item.productName} (${item.quantity})`).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No orders found</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}