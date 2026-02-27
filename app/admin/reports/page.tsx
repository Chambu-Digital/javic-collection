'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  MapPin,
  Download,
  RefreshCw
} from 'lucide-react'
import { useUserStore } from '@/lib/user-store'

interface ReportData {
  dashboard_summary?: {
    sales?: {
      totalRevenue: number
      totalOrders: number
      averageOrderValue: number
    }
    products?: {
      topSelling: Array<{
        _id: string
        productName: string
        totalQuantity: number
        totalRevenue: number
      }>
      lowStock: Array<{
        _id: string
        name: string
        stockQuantity: number
        hasVariants: boolean
      }>
    }
    customers?: {
      new: number
      retention: {
        totalCustomers: number
        repeatCustomers: number
        retentionRate: number
      }
    }
  }
  sales_overview?: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    paymentMethods: Array<{
      _id: string
      count: number
      revenue: number
    }>
    revenueByStatus: Array<{
      _id: string
      count: number
      revenue: number
    }>
  }
  product_performance?: {
    topSellingProducts: Array<{
      _id: string
      productName: string
      totalQuantity: number
      totalRevenue: number
      averagePrice: number
    }>
    categoryPerformance: Array<{
      _id: string
      category: string
      totalQuantity: number
      totalRevenue: number
      uniqueProducts: number
    }>
    lowStockProducts: Array<{
      _id: string
      name: string
      stockQuantity: number
      hasVariants: boolean
    }>
    topRatedProducts: Array<{
      _id: string
      productName: string
      averageRating: number
      totalReviews: number
    }>
  }
  customer_analytics?: {
    newCustomers: number
    topCustomers: Array<{
      _id: string
      customerEmail: string
      totalOrders: number
      totalSpent: number
      lastOrderDate: string
    }>
    geographicDistribution: Array<{
      county: string
      orderCount: number
      revenue: number
      customerCount: number
    }>
    customerRetention: {
      totalCustomers: number
      repeatCustomers: number
      retentionRate: number
    }
  }
  geographic_distribution?: Array<{
    county: string
    area: string
    orderCount: number
    revenue: number
    customerCount: number
  }>
}

export default function AdminReportsPage() {
  const { user } = useUserStore()
  const [reportData, setReportData] = useState<ReportData>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('30')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      fetchReportData()
    }
  }, [user, dateRange, customStartDate, customEndDate])

  const fetchReportData = async (reportType = 'dashboard-summary') => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        type: reportType,
        period: dateRange
      })
      
      if (customStartDate && customEndDate) {
        params.append('startDate', customStartDate)
        params.append('endDate', customEndDate)
      }
      
      const response = await fetch(`/api/admin/reports?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const key = reportType.replace('-', '_') as keyof ReportData
        setReportData(prev => ({ ...prev, [key]: data }))
      } else {
        console.error('Failed to fetch report data:', response.status)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    const reportType = activeTab === 'overview' ? 'dashboard-summary' : activeTab.replace('-', '_')
    await fetchReportData(reportType)
    setRefreshing(false)
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

  const exportReport = async () => {
    try {
      const params = new URLSearchParams({
        type: 'export',
        period: dateRange,
        format: 'csv'
      })
      
      if (customStartDate && customEndDate) {
        params.append('startDate', customStartDate)
        params.append('endDate', customEndDate)
      }
      
      const response = await fetch(`/api/admin/reports/export?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `javic-collection-report-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Failed to export report:', response.status)
      }
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view reports.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <div className="flex gap-2">
          <Button onClick={refreshData} disabled={refreshing} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateRange === 'custom' && (
              <>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="text-center py-8">Loading overview...</div>
          ) : (
            <OverviewTab data={reportData.dashboard_summary} formatCurrency={formatCurrency} formatNumber={formatNumber} />
          )}
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <SalesTab 
            data={reportData.sales_overview} 
            formatCurrency={formatCurrency} 
            formatNumber={formatNumber}
            onLoad={() => fetchReportData('sales-overview')}
          />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ProductsTab 
            data={reportData.product_performance} 
            formatCurrency={formatCurrency} 
            formatNumber={formatNumber}
            onLoad={() => fetchReportData('product-performance')}
          />
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <CustomersTab 
            data={reportData.customer_analytics} 
            formatCurrency={formatCurrency} 
            formatNumber={formatNumber}
            onLoad={() => fetchReportData('customer-analytics')}
          />
        </TabsContent>

        <TabsContent value="geographic" className="space-y-6">
          <GeographicTab 
            data={reportData.geographic_distribution} 
            formatCurrency={formatCurrency} 
            formatNumber={formatNumber}
            onLoad={() => fetchReportData('geographic-distribution')}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface TabProps {
  data: any
  formatCurrency: (amount: number) => string
  formatNumber: (num: number) => string
  onLoad?: () => void
}

function OverviewTab({ data, formatCurrency, formatNumber }: TabProps) {
  if (!data) return <div className="text-center py-8">Loading overview data...</div>

  return (
    <>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(data.sales?.totalRevenue || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{formatNumber(data.sales?.totalOrders || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Customers</p>
                <p className="text-2xl font-bold">{formatNumber(data.customers?.new || 0)}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(data.sales?.averageOrderValue || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.products?.topSelling?.length > 0 ? (
              data.products.topSelling.map((product: any, index: number) => (
                <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-500">#{index + 1}</span>
                    <div>
                      <p className="font-medium">{product.productName}</p>
                      <p className="text-sm text-gray-600">{formatNumber(product.totalQuantity)} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(product.totalRevenue)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No product data available for this period
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function SalesTab({ data, formatCurrency, formatNumber, onLoad }: TabProps) {
  useEffect(() => {
    if (!data && onLoad) onLoad()
  }, [data, onLoad])

  if (!data) return <div className="text-center py-8">Loading sales data...</div>

  return (
    <>
      {/* Sales Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{formatNumber(data.totalOrders)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(data.averageOrderValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.paymentMethods?.length > 0 ? (
              data.paymentMethods.map((method: any) => (
                <div key={method._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium capitalize">{method._id?.replace('_', ' ') || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">{formatNumber(method.count)} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(method.revenue)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No payment method data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function ProductsTab({ data, formatCurrency, formatNumber, onLoad }: TabProps) {
  useEffect(() => {
    if (!data && onLoad) onLoad()
  }, [data, onLoad])

  if (!data) return <div className="text-center py-8">Loading product data...</div>

  return (
    <>
      {/* Top Selling Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topSellingProducts?.map((product: any, index: number) => (
              <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-500">#{index + 1}</span>
                  <div>
                    <p className="font-medium">{product.productName}</p>
                    <p className="text-sm text-gray-600">{formatNumber(product.totalQuantity)} sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(product.totalRevenue)}</p>
                  <p className="text-sm text-gray-600">{formatCurrency(product.averagePrice)} avg</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.categoryPerformance?.map((category: any) => (
              <div key={category._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{category.category}</p>
                  <p className="text-sm text-gray-600">
                    {formatNumber(category.totalQuantity)} items • {category.uniqueProducts} products
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(category.totalRevenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Low Stock Alert</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.lowStockProducts?.map((product: any) => (
              <div key={product._id} className="flex items-center justify-between p-3 bg-red-50 rounded">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-red-600">
                    {product.hasVariants ? 'Multiple variants low' : `${product.stockQuantity} remaining`}
                  </p>
                </div>
                <Badge variant="destructive">Low Stock</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function CustomersTab({ data, formatCurrency, formatNumber, onLoad }: TabProps) {
  useEffect(() => {
    if (!data && onLoad) onLoad()
  }, [data, onLoad])

  if (!data) return <div className="text-center py-8">Loading customer data...</div>

  return (
    <>
      {/* Customer Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Customers</p>
                <p className="text-2xl font-bold">{formatNumber(data.newCustomers)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Retention Rate</p>
                <p className="text-2xl font-bold">{data.customerRetention?.retentionRate?.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Repeat Customers</p>
                <p className="text-2xl font-bold">{formatNumber(data.customerRetention?.repeatCustomers || 0)}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topCustomers?.map((customer: any, index: number) => (
              <div key={customer._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-500">#{index + 1}</span>
                  <div>
                    <p className="font-medium">{customer.customerEmail}</p>
                    <p className="text-sm text-gray-600">{formatNumber(customer.totalOrders)} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(customer.totalSpent)}</p>
                  <p className="text-sm text-gray-600">
                    Last order: {new Date(customer.lastOrderDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function GeographicTab({ data, formatCurrency, formatNumber, onLoad }: TabProps) {
  useEffect(() => {
    if (!data && onLoad) onLoad()
  }, [data, onLoad])

  if (!data) return <div className="text-center py-8">Loading geographic data...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by Location</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data && data.length > 0 ? (
            data.map((location: any) => (
              <div key={`${location.county}-${location.area}`} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">{location.county} - {location.area}</p>
                    <p className="text-sm text-gray-600">
                      {formatNumber(location.orderCount)} orders • {formatNumber(location.customerCount)} customers
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(location.revenue)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              No geographic data available for this period
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}