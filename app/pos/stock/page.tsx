'use client'

import { useState, useEffect } from 'react'
import { Package, Search, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IProduct } from '@/models/Product'
import { getProductDisplayImage } from '@/lib/product-utils'
import StockManagementModal from '@/components/admin/stock-management-modal'
import { usePosAuthStore } from '@/lib/pos/pos-auth-store'
import { usePosCartStore } from '@/lib/pos/cart-store'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createPosPermissionChecker, POS_PERMISSIONS } from '@/lib/pos/permissions'

export default function PosStockPage() {
  const { user } = usePosAuthStore()
  const { currentBranchId, currentBranchCode } = usePosCartStore()
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [categories, setCategories] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage] = useState(50)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [branches, setBranches] = useState<Array<{ _id: string; name: string; branchCode: string }>>([])

  // Check permissions
  const permissionChecker = user ? createPosPermissionChecker(user) : null
  const canView = permissionChecker?.hasPosPermission(POS_PERMISSIONS.INVENTORY_VIEW)
  const canAdjust = permissionChecker?.hasPosPermission(POS_PERMISSIONS.INVENTORY_ADJUST)

  useEffect(() => {
    if (canView) {
      fetchProducts()
      fetchCategories()
      fetchBranches()
    }
  }, [canView])

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/pos/branches')
      if (response.ok) {
        const data = await response.json()
        setBranches(data.branches || [])
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      // Fetch only active products for POS
      const response = await fetch('/api/products?includeInactive=false&limit=9999')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        console.error('Failed to fetch products:', response.status)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        const categoryNames = data.map((cat: any) => cat.name)
        setCategories(categoryNames)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const getStockLevel = (product: IProduct): number => {
    return product.stockQuantity || 0
  }

  const getStockStatus = (stock: number): 'out' | 'low' | 'good' => {
    if (stock === 0) return 'out'
    if (stock <= 10) return 'low'
    return 'good'
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = !categoryFilter || 
                           product.category.toLowerCase() === categoryFilter.toLowerCase()
    
    const stock = getStockLevel(product)
    const stockStatus = getStockStatus(stock)
    const matchesStock = stockFilter === 'all' ||
                        (stockFilter === 'out' && stockStatus === 'out') ||
                        (stockFilter === 'low' && stockStatus === 'low') ||
                        (stockFilter === 'good' && stockStatus === 'good')
    
    return matchesSearch && matchesCategory && matchesStock
  })

  // Stock statistics
  const stats = {
    total: products.length,
    outOfStock: products.filter(p => getStockLevel(p) === 0).length,
    lowStock: products.filter(p => {
      const stock = getStockLevel(p)
      return stock > 0 && stock <= 10
    }).length,
    inStock: products.filter(p => getStockLevel(p) > 10).length,
  }

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, stockFilter])

  if (!canView) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view stock information. Contact your manager.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!currentBranchId) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No branch selected. Please ensure a branch is selected in the POS system.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-6 w-6" />
          Stock Management
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {canAdjust ? 'View and adjust product stock levels' : 'View product stock levels'}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Total Products</p>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium">Out of Stock</p>
          <p className="text-2xl font-bold text-red-900">{stats.outOfStock}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600 font-medium">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-900">{stats.lowStock}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">In Stock</p>
          <p className="text-2xl font-bold text-green-900">{stats.inStock}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm bg-white"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm bg-white"
          >
            <option value="all">All Stock Levels</option>
            <option value="out">Out of Stock</option>
            <option value="low">Low Stock</option>
            <option value="good">In Stock</option>
          </select>

          <div className="text-sm text-gray-500 flex items-center justify-center sm:justify-start">
            <span>
              {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length}
            </span>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedProducts.map((product) => {
          const displayImage = getProductDisplayImage(product)
          const stock = getStockLevel(product)
          const stockStatus = getStockStatus(stock)
          
          return (
            <div
              key={product._id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
              onClick={() => {
                setSelectedProductId(product._id!)
                setStockModalOpen(true)
              }}
            >
              <div className="relative">
                <img
                  src={displayImage}
                  alt={product.name}
                  className="w-full h-32 object-cover"
                />
                {/* Stock Badge */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-bold ${
                  stockStatus === 'out' 
                    ? 'bg-red-600 text-white'
                    : stockStatus === 'low'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-green-600 text-white'
                }`}>
                  {stock} units
                </div>
              </div>
              
              <div className="p-3">
                <h3 className="font-medium text-sm text-gray-900 truncate mb-1">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {product.images.length > 1 && (
                      <span className="text-xs text-gray-500">
                        {product.images.length} variants
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedProductId(product._id!)
                      setStockModalOpen(true)
                    }}
                  >
                    <Package className="h-3 w-3 mr-1" />
                    {canAdjust ? 'Adjust' : 'View'}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            {searchTerm || categoryFilter || stockFilter !== 'all' 
              ? 'No products match your filters' 
              : 'No products found'}
          </p>
          {(searchTerm || categoryFilter || stockFilter !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setCategoryFilter('')
                setStockFilter('all')
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {filteredProducts.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Stock Management Modal */}
      {selectedProductId && currentBranchId && (
        <StockManagementModal
          isOpen={stockModalOpen}
          onClose={() => {
            setStockModalOpen(false)
            setSelectedProductId(null)
            // Refresh products to get updated stock quantities
            fetchProducts()
          }}
          productId={selectedProductId}
          userBranchId={currentBranchId}
          userPosRole={user?.posRole}
          isPosContext={true}
          branchName={branches.find(b => b._id === currentBranchId)?.name || 'Unknown Branch'}
          branchCode={currentBranchCode || 'N/A'}
          restrictToBranch={true}
        />
      )}
    </div>
  )
}
