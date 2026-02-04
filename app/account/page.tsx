'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Package, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  Plus,
  ArrowRight,
  Calendar,
  DollarSign
} from 'lucide-react'
import { useUserStore } from '@/lib/user-store'

interface OrderStats {
  total: number
  pending: number
  shipped: number
  delivered: number
  cancelled: number
}

interface RecentOrder {
  _id: string
  orderNumber: string
  totalAmount: number
  status: string
  createdAt: string
  items: Array<{
    productName: string
    quantity: number
  }>
}

export default function AccountDashboard() {
  const { user } = useUserStore()
  const [orderStats, setOrderStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch order statistics
      const statsResponse = await fetch('/api/orders/stats')
      if (statsResponse.ok) {
        const stats = await statsResponse.json()
        setOrderStats(stats)
      }

      // Fetch recent orders
      const ordersResponse = await fetch('/api/orders?limit=5')
      if (ordersResponse.ok) {
        const orders = await ordersResponse.json()
        setRecentOrders(orders.orders || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'confirmed':
      case 'processing':
        return <Package className="h-4 w-4" />
      case 'shipped':
        return <Truck className="h-4 w-4" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
      case 'returned':
        return <XCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
      case 'returned':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!user) return null

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's an overview of your account and recent activity.
        </p>
      </div>

      {/* Order Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.pending}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.delivered}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.shipped}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Your latest orders and their current status
              </CardDescription>
            </div>
            <Link href="/account/orders">
              <Button variant="outline" size="sm">
                View All Orders
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <div>
                          <p className="font-medium text-gray-900">
                            Order #{order.orderNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          KSH {order.totalAmount.toLocaleString()}
                        </p>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getStatusColor(order.status)}`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      <Link href={`/account/orders/${order._id}`}>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-6">
                Start shopping to see your orders here
              </p>
              <Link href="/">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Start Shopping
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Management
            </CardTitle>
            <CardDescription>
              Track and manage your orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/account/orders" className="block">
              <Button variant="outline" className="w-full justify-start">
                View All Orders
              </Button>
            </Link>
            <Link href="/account/orders?status=pending" className="block">
              <Button variant="outline" className="w-full justify-start">
                Track Pending Orders
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Account Settings
            </CardTitle>
            <CardDescription>
              Manage your profile and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/account/profile" className="block">
              <Button variant="outline" className="w-full justify-start">
                Edit Profile
              </Button>
            </Link>
            <Link href="/account/profile#addresses" className="block">
              <Button variant="outline" className="w-full justify-start">
                Manage Addresses
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}