'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Users,
  DollarSign,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/lib/user-store'

export default function PosDashboardPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate brief loading
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome to JAVIC POS
        </h1>
        <p className="text-emerald-50 text-lg">
          Hello, {user?.firstName}! Ready to make some sales?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-emerald-500">
          <Link href="/pos/make-sale">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <ShoppingCart className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Make Sale</CardTitle>
                    <CardDescription>Start a new transaction</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sell products, process payments, and generate receipts
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
          <Link href="/pos/inventory">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Inventory</CardTitle>
                    <CardDescription>View stock levels</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Check product availability and stock status
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Stats Overview - Placeholder */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh 0</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Orders completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Served today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Sale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh 0</div>
            <p className="text-xs text-muted-foreground">
              Average transaction value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Features */}
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Additional features will be available in future updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-white rounded-md">
                <ShoppingCart className="h-4 w-4 text-gray-500" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">Held Orders</p>
                <p className="text-gray-500">Suspend and resume sales</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-white rounded-md">
                <Users className="h-4 w-4 text-gray-500" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">Customer Management</p>
                <p className="text-gray-500">Create and manage customers</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-white rounded-md">
                <DollarSign className="h-4 w-4 text-gray-500" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">Credit Accounts</p>
                <p className="text-gray-500">Customer credit tracking</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-white rounded-md">
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">Reports & Analytics</p>
                <p className="text-gray-500">Sales reports and insights</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-white rounded-md">
                <Package className="h-4 w-4 text-gray-500" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">Split Payments</p>
                <p className="text-gray-500">Cash, M-Pesa, Credit</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-white rounded-md">
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">Offline Mode</p>
                <p className="text-gray-500">Work without internet</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• Select your branch from the dropdown in the sidebar</p>
          <p>• Click "Make Sale" to start processing transactions</p>
          <p>• Use "Inventory" to check product availability</p>
          <p>• More features will be added in upcoming phases</p>
        </CardContent>
      </Card>
    </div>
  )
}
