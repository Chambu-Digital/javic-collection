'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Package, Building2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import BranchSelector from '@/components/admin/branch-selector'
import Link from 'next/link'

interface LowStockItem {
  productId: string
  productName: string
  branchCode: string
  branchName: string
  quantity: number
}

interface LowStockAlertProps {
  threshold?: number
  maxItems?: number
  showBranchFilter?: boolean
}

export default function LowStockAlert({ 
  threshold = 10, 
  maxItems = 10,
  showBranchFilter = true 
}: LowStockAlertProps) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [summary, setSummary] = useState<any[]>([])

  useEffect(() => {
    fetchLowStock()
  }, [selectedBranch, threshold])

  const fetchLowStock = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        threshold: threshold.toString()
      })
      
      if (selectedBranch && selectedBranch !== 'all') {
        params.append('branchId', selectedBranch)
      }

      const response = await fetch(`/api/admin/low-stock?${params}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setLowStockItems(data.lowStockProducts || [])
        setSummary(data.summary || [])
      }
    } catch (error) {
      console.error('Error fetching low stock:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchLowStock()
  }

  if (loading && !refreshing) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const displayItems = lowStockItems.slice(0, maxItems)
  const hasMore = lowStockItems.length > maxItems

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alert
            </CardTitle>
            <CardDescription>
              Products with stock at or below {threshold} units
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Branch Filter */}
        {showBranchFilter && (
          <div className="mb-4">
            <BranchSelector
              value={selectedBranch}
              onChange={setSelectedBranch}
              includeAllOption={true}
              className="w-full"
            />
          </div>
        )}

        {/* Alert Summary */}
        {lowStockItems.length > 0 ? (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm font-medium text-orange-900">
              {lowStockItems.length} low stock {lowStockItems.length === 1 ? 'item' : 'items'} across {summary.length} {summary.length === 1 ? 'product' : 'products'}
            </p>
          </div>
        ) : (
          <div className="p-6 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-600">All products have sufficient stock</p>
          </div>
        )}

        {/* Low Stock Items */}
        {displayItems.length > 0 && (
          <div className="space-y-2">
            {displayItems.map((item, index) => (
              <Link 
                key={`${item.productId}-${item.branchCode}-${index}`}
                href={`/admin/products/${item.productId}/stock`}
              >
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {item.productName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="w-3 h-3 text-gray-500" />
                        <p className="text-xs text-gray-600">
                          {item.branchName} ({item.branchCode})
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <Badge 
                        variant="outline" 
                        className={`${
                          item.quantity === 0
                            ? 'bg-red-100 text-red-700 border-red-300'
                            : item.quantity <= 5
                            ? 'bg-orange-100 text-orange-700 border-orange-300'
                            : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                        }`}
                      >
                        {item.quantity} left
                      </Badge>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {hasMore && (
              <div className="text-center pt-2">
                <p className="text-xs text-gray-500">
                  +{lowStockItems.length - maxItems} more items
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
