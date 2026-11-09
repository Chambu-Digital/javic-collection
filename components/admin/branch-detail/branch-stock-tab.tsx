'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Package,
  Search,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface StockItem {
  _id: string
  productId: {
    _id: string
    name: string
    images: Array<{ url: string }>
  }
  vendorId: {
    _id: string
    name: string
    vendorCode: string
  }
  imageIndex: number
  selectedSize?: string
  quantity: number
  stockIdentifier: string
}

interface BranchStockTabProps {
  branchId: string
  branchName: string
}

export default function BranchStockTab({ branchId, branchName }: BranchStockTabProps) {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchStock()
  }, [branchId])

  const fetchStock = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/stock/branch/${branchId}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setStockItems(data.stock || [])
      } else {
        toast.error('Failed to fetch stock')
      }
    } catch (error) {
      console.error('Error fetching stock:', error)
      toast.error('Error loading stock')
    } finally {
      setLoading(false)
    }
  }

  const filteredStock = stockItems.filter(item => {
    const query = searchQuery.toLowerCase()
    return (
      item.productId.name.toLowerCase().includes(query) ||
      item.vendorId.name.toLowerCase().includes(query) ||
      item.vendorId.vendorCode.toLowerCase().includes(query) ||
      item.stockIdentifier.toLowerCase().includes(query)
    )
  })

  const totalQuantity = filteredStock.reduce((sum, item) => sum + item.quantity, 0)
  const uniqueProducts = new Set(filteredStock.map(item => item.productId._id)).size
  const uniqueVendors = new Set(filteredStock.map(item => item.vendorId._id)).size

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalQuantity}</div>
            <p className="text-sm text-muted-foreground">Total Units</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{uniqueProducts}</div>
            <p className="text-sm text-muted-foreground">Unique Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{uniqueVendors}</div>
            <p className="text-sm text-muted-foreground">Active Vendors</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Inventory at {branchName}</CardTitle>
          <CardDescription>
            View all products and quantities available at this branch
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Search */}
      {stockItems.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product, vendor, or stock ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Stock List */}
      {filteredStock.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">
              {searchQuery ? 'No stock found' : 'No stock at this branch'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Try a different search term'
                : `Start adding inventory to ${branchName} through product stock management`}
            </p>
            {!searchQuery && (
              <Button variant="outline" asChild>
                <Link href="/admin/products">
                  Go to Products
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredStock.map((item) => (
            <Card key={item._id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  {item.productId.images?.[item.imageIndex] && (
                    <img
                      src={item.productId.images[item.imageIndex].url}
                      alt={item.productId.name}
                      className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                    />
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold truncate">{item.productId.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Variant {item.imageIndex + 1}
                          {item.selectedSize && ` • Size: ${item.selectedSize}`}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          item.quantity === 0
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : item.quantity <= 10
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                            : 'bg-green-100 text-green-800 border-green-300'
                        }
                      >
                        {item.quantity} units
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>Vendor: {item.vendorId.name} ({item.vendorId.vendorCode})</span>
                      <span>•</span>
                      <span className="font-mono text-xs">{item.stockIdentifier}</span>
                    </div>

                    <div className="mt-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/products/${item.productId._id}/stock`}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Manage Stock
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Low Stock Alert */}
      {stockItems.some(item => item.quantity > 0 && item.quantity <= 10) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">Low Stock Items</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  {stockItems.filter(item => item.quantity > 0 && item.quantity <= 10).length} items 
                  have 10 or fewer units in stock at this branch
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
