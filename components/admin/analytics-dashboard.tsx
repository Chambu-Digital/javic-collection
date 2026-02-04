'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  ShoppingCart, 
  Users, 
  Clock,
  Target,
  Zap,
  AlertTriangle
} from 'lucide-react'

interface AnalyticsData {
  conversionFunnel?: {
    funnel: Array<{
      stage: string
      count: number
      percentage: number
    }>
    conversionRate: number
  }
  topProducts?: Array<{
    productName: string
    totalViews: number
    uniqueViews: number
  }>
  customerBehavior?: {
    avgPageViews: number
    avgUniqueProducts: number
    avgSessionDuration: number
    totalSessions: number
  }
}

interface AnalyticsDashboardProps {
  period?: string
  onPeriodChange?: (period: string) => void
}

export default function AnalyticsDashboard({ 
  period = '30', 
  onPeriodChange 
}: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData>({})
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('overview')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async (type = 'dashboard') => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?type=${type}&period=${period}`)
      
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num))
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`
    }
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conversion Funnel */}
      {data.conversionFunnel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {data.conversionFunnel.conversionRate.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-600">Overall Conversion Rate</div>
              </div>
              
              <div className="space-y-3">
                {data.conversionFunnel.funnel.map((stage, index) => (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{stage.stage}</span>
                      <div className="text-right">
                        <div className="font-semibold">{formatNumber(stage.count)}</div>
                        <div className="text-sm text-gray-600">{stage.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                    <Progress value={stage.percentage} className="h-2" />
                    {data.conversionFunnel && index < data.conversionFunnel.funnel.length - 1 && (
                      <div className="text-center text-sm text-gray-500">
                        ↓ {((data.conversionFunnel.funnel[index + 1].count / stage.count) * 100).toFixed(1)}% conversion
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Behavior */}
        {data.customerBehavior && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer Behavior
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(data.customerBehavior.totalSessions)}
                    </div>
                    <div className="text-sm text-gray-600">Total Sessions</div>
                  </div>
                  
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {data.customerBehavior.avgPageViews?.toFixed(1) || '0'}
                    </div>
                    <div className="text-sm text-gray-600">Avg Page Views</div>
                  </div>
                  
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <div className="text-2xl font-bold text-purple-600">
                      {data.customerBehavior.avgUniqueProducts?.toFixed(1) || '0'}
                    </div>
                    <div className="text-sm text-gray-600">Avg Products Viewed</div>
                  </div>
                  
                  <div className="text-center p-3 bg-orange-50 rounded">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatDuration(data.customerBehavior.avgSessionDuration || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Session Duration</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Viewed Products */}
        {data.topProducts && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Most Viewed Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-500">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-sm text-gray-600">
                          {formatNumber(product.uniqueViews)} unique views
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatNumber(product.totalViews)}</div>
                      <div className="text-sm text-gray-600">total views</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          variant={activeView === 'overview' ? 'default' : 'outline'}
          onClick={() => {
            setActiveView('overview')
            fetchAnalytics('dashboard')
          }}
        >
          Overview
        </Button>
        <Button 
          variant={activeView === 'conversion' ? 'default' : 'outline'}
          onClick={() => {
            setActiveView('conversion')
            fetchAnalytics('conversion-funnel')
          }}
        >
          Conversion Analysis
        </Button>
        <Button 
          variant={activeView === 'products' ? 'default' : 'outline'}
          onClick={() => {
            setActiveView('products')
            fetchAnalytics('product-analytics')
          }}
        >
          Product Analytics
        </Button>
        <Button 
          variant={activeView === 'behavior' ? 'default' : 'outline'}
          onClick={() => {
            setActiveView('behavior')
            fetchAnalytics('customer-behavior')
          }}
        >
          Customer Behavior
        </Button>
      </div>
    </div>
  )
}