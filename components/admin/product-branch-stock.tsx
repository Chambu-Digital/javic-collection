'use client'

import { useState, useEffect } from 'react'
import { Building2, AlertTriangle, Package } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface BranchStockInfo {
  branchId: string
  branchCode: string
  branchName: string
  quantity: number
  isActive: boolean
}

interface ProductBranchStockProps {
  productId: string
  productName: string
  lowStockThreshold?: number
}

export default function ProductBranchStock({ 
  productId, 
  productName,
  lowStockThreshold = 10 
}: ProductBranchStockProps) {
  const [loading, setLoading] = useState(true)
  const [totalStock, setTotalStock] = useState(0)
  const [branchStocks, setBranchStocks] = useState<BranchStockInfo[]>([])
  const [lowStockBranches, setLowStockBranches] = useState<string[]>([])

  useEffect(() => {
    fetchBranchStock()
  }, [productId])

  const fetchBranchStock = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/products/branch-stock?productId=${productId}`,
        { credentials: 'include' }
      )

      if (response.ok) {
        const data = await response.json()
        setTotalStock(data.totalStock || 0)
        setBranchStocks(data.branchStocks || [])
        setLowStockBranches(data.lowStockBranches || [])
      }
    } catch (error) {
      console.error('Error fetching branch stock:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Branch Stock - {productName}
        </CardTitle>
        <CardDescription>
          Stock distribution across all branches
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Total Stock Summary */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Stock (All Branches)</p>
              <p className="text-2xl font-bold text-blue-900">{totalStock} units</p>
            </div>
            {totalStock <= lowStockThreshold && totalStock > 0 && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Low Stock
              </Badge>
            )}
            {totalStock === 0 && (
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                Out of Stock
              </Badge>
            )}
          </div>
        </div>

        {/* Branch Breakdown */}
        {branchStocks.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 mb-3">By Branch:</p>
            {branchStocks.map((branch) => {
              const isLowStock = branch.quantity > 0 && branch.quantity <= lowStockThreshold
              const isOutOfStock = branch.quantity === 0

              return (
                <div
                  key={branch.branchId}
                  className={`p-3 rounded-lg border ${
                    isOutOfStock
                      ? 'bg-red-50 border-red-200'
                      : isLowStock
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className={`w-4 h-4 ${
                        isOutOfStock
                          ? 'text-red-600'
                          : isLowStock
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {branch.branchName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Code: {branch.branchCode}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        isOutOfStock
                          ? 'text-red-700'
                          : isLowStock
                          ? 'text-yellow-700'
                          : 'text-green-700'
                      }`}>
                        {branch.quantity}
                      </p>
                      <p className="text-xs text-gray-500">units</p>
                      {isLowStock && (
                        <Badge variant="outline" className="mt-1 text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                          Low Stock
                        </Badge>
                      )}
                      {isOutOfStock && (
                        <Badge variant="outline" className="mt-1 text-xs bg-red-100 text-red-700 border-red-300">
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No branch stock records found</p>
            <p className="text-xs mt-1">Stock may need to be migrated to branch system</p>
          </div>
        )}

        {/* Low Stock Warning */}
        {lowStockBranches.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Low Stock Alert
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  {lowStockBranches.join(', ')} {lowStockBranches.length === 1 ? 'has' : 'have'} low stock
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
