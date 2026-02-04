'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Eye,
  ArrowRight
} from 'lucide-react'

interface ReportsWidgetData {
  sales?: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
  }
  customers?: {
    new: number
    retention: {
      retentionRate: number
    }
  }
  products?: {
    topSelling: Array<{
      productName: string
      totalQuantity: number
      totalRevenue: number
    }>
  }
}

export default function ReportsWidget() {
  const [data, setData] = useState<ReportsWidgetData>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummaryData()
  }, [])

  const fetchSummaryData = async () => {
    try {
      const response = await fetch('/api/admin/reports?type=dashboard-summary&period=30')
      
      if (response.ok) {
        const summaryData = await response.json()
        setData(summaryData)
      }
    } catch (error) {
      console.error('Error fetching summary data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading reports...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Quick Reports</CardTitle>
        <Link href="/admin/reports">
          <Button variant="outline" size="sm">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded">
            <DollarSign className="w-6 h-6 mx-auto mb-1 text-green-600" />
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(data.sales?.totalRevenue || 0)}
            </div>
            <div className="text-xs text-gray-600">Revenue (30d)</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded">
            <ShoppingCart className="w-6 h-6 mx-auto mb-1 text-blue-600" />
            <div className="text-lg font-bold text-blue-600">
              {formatNumber(data.sales?.totalOrders || 0)}
            </div>
            <div className="text-xs text-gray-600">Orders (30d)</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded">
            <Users className="w-6 h-6 mx-auto mb-1 text-purple-600" />
            <div className="text-lg font-bold text-purple-600">
              {formatNumber(data.customers?.new || 0)}
            </div>
            <div className="text-xs text-gray-600">New Customers</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded">
            <TrendingUp className="w-6 h-6 mx-auto mb-1 text-orange-600" />
            <div className="text-lg font-bold text-orange-600">
              {formatCurrency(data.sales?.averageOrderValue || 0)}
            </div>
            <div className="text-xs text-gray-600">Avg Order Value</div>
          </div>
        </div>

        {/* Top Product */}
        {data.products?.topSelling && data.products.topSelling.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Top Selling Product</h4>
            <div className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{data.products.topSelling[0].productName}</p>
                  <p className="text-xs text-gray-600">
                    {formatNumber(data.products.topSelling[0].totalQuantity)} sold
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {formatCurrency(data.products.topSelling[0].totalRevenue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Retention */}
        {data.customers?.retention && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Customer Retention</h4>
            <div className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between items-center">
                <span className="text-sm">Repeat Customer Rate</span>
                <span className="font-semibold text-sm">
                  {data.customers.retention.retentionRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}