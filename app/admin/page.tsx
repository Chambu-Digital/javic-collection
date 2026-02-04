'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  FolderOpen, 
  ShoppingCart, 
  Users, 
  DollarSign,
  Star,
  FileText,
  AlertTriangle,
  Clock,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PermissionGuard, { PermissionCheck } from '@/components/admin/permission-guard'
import { PERMISSIONS } from '@/lib/permissions'
import { useUserStore } from '@/lib/user-store'

interface DashboardStats {
  products: {
    total: number
    active: number
    outOfStock: number
    categories: number
  }
  // customers: {
  //   total: number
  //   active: number
  //   newThisMonth: number
  //   recentWeek: number
  // }
  orders: {
    total: number
    pending: number
    processing: number
    delivered: number
    cancelled: number
    recentWeek: number
  }
  revenue: {
    total: number
    thisMonth: number
    averageOrderValue: number
  }
  // reviews: {
  //   total: number
  //   pending: number
  //   approved: number
  //   recentWeek: number
  // }
  // blog: {
  //   total: number
  //   published: number
  //   draft: number
  // }
  activity: {
    ordersThisWeek: number
    // customersThisWeek: number
    // reviewsThisWeek: number
  }
}

export default function AdminDashboard() {
  const { user, isLoaded } = useUserStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Only fetch stats when user is loaded and is an admin
    if (isLoaded && user && ['admin', 'super_admin'].includes(user.role)) {
      fetchStats()
    } else if (isLoaded && (!user || !['admin', 'super_admin'].includes(user.role))) {
      setLoading(false)
      setError('Access denied')
    }
  }, [user, isLoaded])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/admin/dashboard/stats', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else if (response.status === 401) {
        setError('Authentication required')
      } else if (response.status === 403) {
        setError('Access denied')
      } else {
        setError('Failed to load dashboard statistics')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <PermissionGuard permissions={[PERMISSIONS.DASHBOARD_VIEW]}>
        <div className="space-y-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">Loading dashboard statistics...</p>
          </div>
          
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-muted rounded-lg"></div>
                      <div className="ml-4 flex-1">
                        <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                        <div className="h-6 bg-muted rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PermissionGuard>
    )
  }

  if (error) {
    return (
      <PermissionGuard permissions={[PERMISSIONS.DASHBOARD_VIEW]}>
        <div className="space-y-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
          
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <p className="text-lg font-semibold mb-2">Failed to Load Dashboard</p>
                <p className="text-muted-foreground mb-4">{error}</p>
                <button 
                  onClick={fetchStats}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Try Again
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <PermissionGuard permissions={[PERMISSIONS.DASHBOARD_VIEW]}>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome to your admin dashboard. Here's an overview of your store.
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <PermissionCheck permissions={[PERMISSIONS.PRODUCTS_VIEW]}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="shrink-0">
                   
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                    <p className="text-2xl font-bold">{stats.products.total}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.products.outOfStock} out of stock
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PermissionCheck>

          <PermissionCheck permissions={[PERMISSIONS.ORDERS_VIEW]}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="shrink-0">
                   
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{stats.orders.total}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.orders.pending} pending
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PermissionCheck>

          {/* COMMENTED OUT - Not using customers
          <PermissionCheck permissions={[PERMISSIONS.CUSTOMERS_VIEW]}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <div className="bg-purple-500 rounded-lg p-3">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                    <p className="text-2xl font-bold">{stats.customers.total}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.customers.newThisMonth} new this month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PermissionCheck>
          */}

          <PermissionCheck permissions={[PERMISSIONS.REPORTS_VIEW]}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="shrink-0">
                   
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">KSH {stats.revenue.total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      KSH {stats.revenue.thisMonth.toLocaleString()} this month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PermissionCheck>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <PermissionCheck permissions={[PERMISSIONS.CATEGORIES_VIEW]}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.products.categories}</div>
                <p className="text-xs text-muted-foreground">Product categories</p>
              </CardContent>
            </Card>
          </PermissionCheck>

          {/* COMMENTED OUT - Not using reviews
          <PermissionCheck permissions={[PERMISSIONS.REVIEWS_VIEW]}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.reviews.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.reviews.pending} pending approval
                </p>
              </CardContent>
            </Card>
          </PermissionCheck>
          */}

          {/* COMMENTED OUT - Not using blog
          <PermissionCheck permissions={[PERMISSIONS.BLOG_VIEW]}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Blog Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.blog.published}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.blog.draft} drafts
                </p>
              </CardContent>
            </Card>
          </PermissionCheck>
          */}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Recent Activity (Last 7 Days)
            </CardTitle>
            <CardDescription>
              Overview of recent activity across your store
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <PermissionCheck permissions={[PERMISSIONS.ORDERS_VIEW]}>
                <div className="flex items-center p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-2xl font-bold">{stats.activity.ordersThisWeek}</p>
                    <p className="text-sm text-muted-foreground">New Orders</p>
                  </div>
                </div>
              </PermissionCheck>

              {/* COMMENTED OUT - Not using customers
              <PermissionCheck permissions={[PERMISSIONS.CUSTOMERS_VIEW]}>
                <div className="flex items-center p-4 bg-muted/50 rounded-lg">
                  <Users className="w-8 h-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{stats.activity.customersThisWeek}</p>
                    <p className="text-sm text-muted-foreground">New Customers</p>
                  </div>
                </div>
              </PermissionCheck>
              */}

              {/* COMMENTED OUT - Not using reviews
              <PermissionCheck permissions={[PERMISSIONS.REVIEWS_VIEW]}>
                <div className="flex items-center p-4 bg-muted/50 rounded-lg">
                  <Star className="w-8 h-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{stats.activity.reviewsThisWeek}</p>
                    <p className="text-sm text-muted-foreground">New Reviews</p>
                  </div>
                </div>
              </PermissionCheck>
              */}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts for managing your store
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <PermissionCheck permissions={[PERMISSIONS.PRODUCTS_CREATE]}>
                <a
                  href="/admin/products/new"
                  className="relative group bg-card p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                      <Package className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" />
                      Add New Product
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Create a new product listing with images and details.
                    </p>
                  </div>
                </a>
              </PermissionCheck>

              <PermissionCheck permissions={[PERMISSIONS.CATEGORIES_MANAGE]}>
                <a
                  href="/admin/categories/new"
                  className="relative group bg-card p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                      <FolderOpen className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" />
                      Add New Category
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Create a new product category with icon and description.
                    </p>
                  </div>
                </a>
              </PermissionCheck>

              <PermissionCheck permissions={[PERMISSIONS.PRODUCTS_VIEW]}>
                <a
                  href="/admin/products"
                  className="relative group bg-card p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700 ring-4 ring-white">
                      <ShoppingCart className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" />
                      Manage Inventory
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Update stock levels and product availability.
                    </p>
                  </div>
                </a>
              </PermissionCheck>

              <PermissionCheck permissions={[PERMISSIONS.ORDERS_VIEW]}>
                <a
                  href="/admin/orders"
                  className="relative group bg-card p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                      <Clock className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" />
                      Process Orders
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      View and manage pending customer orders.
                    </p>
                  </div>
                </a>
              </PermissionCheck>

              <PermissionCheck permissions={[PERMISSIONS.REVIEWS_MODERATE]}>
                <a
                  href="/admin/reviews"
                  className="relative group bg-card p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-orange-50 text-orange-700 ring-4 ring-white">
                      <Star className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" />
                      Moderate Reviews
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Review and approve customer feedback.
                    </p>
                  </div>
                </a>
              </PermissionCheck>

              <PermissionCheck permissions={[PERMISSIONS.BLOG_CREATE]}>
                <a
                  href="/admin/blog/new"
                  className="relative group bg-card p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                      <FileText className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" />
                      Write Blog Post
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Create engaging content for your customers.
                    </p>
                  </div>
                </a>
              </PermissionCheck>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  )
}