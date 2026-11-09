'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Edit,
  Package2,
  Plus,
  Upload,
  Download,
  List,
  ArrowLeftRight,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  Tag,
  ClipboardList,
} from 'lucide-react'
import ProductModal from '@/components/pos/product-modal'
import BulkEditDialog from '@/components/inventory/bulk-edit-dialog'
import ImportItemsDialog from '@/components/inventory/import-items-dialog'
import ManageCategoriesDialog from '@/components/inventory/manage-categories-dialog'
import { useRouter } from 'next/navigation'

interface InventoryStats {
  totalItems: number
  totalStock: number
  stockValue: number
  estimatedProfit: number
}

interface InventoryItem {
  productId: string
  name: string
  sku: string
  image: string | null
  price: number
  buyingPrice: number
  wholesalePrice: number | null
  wholesaleThreshold: number | null
  category: string
  totalQuantity: number
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
  barcode?: string
  lowStockThreshold?: number
  isActive?: boolean
  variants: Array<{
    stockId: string
    variantIndex: number
    size: string
    quantity: number
    stockIdentifier: string
    vendor: { id: string; name: string; code: string }
  }>
}

interface Category {
  _id: string
  name: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function InventoryPage() {
  const [branchId, setBranchId] = useState<string>('')
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Modal state
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProductId, setEditProductId] = useState<string | undefined>(undefined)

  const router = useRouter()

  // Bulk edit state
  const [bulkMode, setBulkMode]   = useState(false)
  const [selected, setSelected]   = useState<Record<string, InventoryItem>>({})
  const [bulkEditOpen, setBulkEditOpen]     = useState(false)
  const [importOpen, setImportOpen]         = useState(false)
  const [manageCatOpen, setManageCatOpen]   = useState(false)

  const selectedCount = Object.keys(selected).length
  const selectedProducts = Object.values(selected)

  const openCreate = () => {
    setModalMode('create')
    setEditProductId(undefined)
    setModalOpen(true)
  }

  const openEdit = (productId: string) => {
    setModalMode('edit')
    setEditProductId(productId)
    setModalOpen(true)
  }

  const toggleSelect = (item: InventoryItem) => {
    setSelected((prev) => {
      const next = { ...prev }
      if (next[item.productId]) delete next[item.productId]
      else next[item.productId] = item
      return next
    })
  }

  const allOnPageSelected = items.length > 0 && items.every((i) => selected[i.productId])

  const toggleSelectAllOnPage = () => {
    setSelected((prev) => {
      const next = { ...prev }
      if (allOnPageSelected) {
        items.forEach((i) => delete next[i.productId])
      } else {
        items.forEach((i) => { next[i.productId] = i })
      }
      return next
    })
  }

  const exitBulkMode = () => {
    setBulkMode(false)
    setSelected({})
  }

  const refreshAfterBulkEdit = useCallback(() => {
    setSelected({})
    setBulkMode(false)
    setPagination((prev) => ({ ...prev, page: 1 }))
    if (branchId) {
      fetch(`/api/pos/inventory/stats?branchId=${branchId}`)
        .then((r) => r.json())
        .then((data) => setStats(data))
        .catch(console.error)
    }
  }, [branchId])

  const handleModalSaved = useCallback(() => {
    // Refresh inventory list and stats
    setModalOpen(false)
    // Trigger re-fetch by resetting pagination
    setPagination(prev => ({ ...prev, page: 1 }))
    if (branchId) {
      fetch(`/api/pos/inventory/stats?branchId=${branchId}`)
        .then(r => r.json())
        .then(data => setStats(data))
        .catch(console.error)
    }
  }, [branchId])

  useEffect(() => {
    const savedBranch = localStorage.getItem('pos-selected-branch')
    if (savedBranch) setBranchId(savedBranch)
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) setCategories(await res.json())
      } catch (e) {
        console.error('Error fetching categories:', e)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    if (!branchId) return
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/pos/inventory/stats?branchId=${branchId}`)
        if (res.ok) setStats(await res.json())
      } catch (e) {
        console.error('Error fetching stats:', e)
      }
    }
    fetchStats()
  }, [branchId])

  useEffect(() => {
    if (!branchId) return
    const fetchInventory = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          branchId,
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        })
        if (searchQuery) params.set('search', searchQuery)
        if (categoryFilter) params.set('category', categoryFilter)

        const res = await fetch(`/api/pos/inventory?${params}`)
        if (res.ok) {
          const data = await res.json()
          setItems(data.items)
          setPagination(data.pagination)
        }
      } catch (e) {
        console.error('Error fetching inventory:', e)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchInventory, 300)
    return () => clearTimeout(debounce)
  }, [branchId, pagination.page, searchQuery, categoryFilter])

  const handleDownload = () => {
    if (!branchId) return
    window.open(`/api/pos/inventory/export?branchId=${branchId}`, '_blank')
  }

  const toggleRow = (productId: string) => {
    const next = new Set(expandedRows)
    next.has(productId) ? next.delete(productId) : next.add(productId)
    setExpandedRows(next)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <span className="px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full whitespace-nowrap">In Stock</span>
      case 'low_stock':
        return <span className="px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full whitespace-nowrap">Low Stock</span>
      case 'out_of_stock':
        return <span className="px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full whitespace-nowrap">Out of Stock</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-muted-foreground mt-1">Manage by Admin User</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 pb-6">
            <p className="text-sm font-medium text-gray-500">Items</p>
            <p className="text-4xl font-bold text-gray-900 mt-1">{stats?.totalItems?.toLocaleString() || 0}</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-500">Estimated Profit</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                KES {(stats?.estimatedProfit || 0).toLocaleString()}
              </p>
              {!stats?.estimatedProfit && (
                <p className="text-xs text-gray-400 mt-1">Set buying prices to calculate</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-6">
            <p className="text-sm font-medium text-gray-500">Total Stock</p>
            <p className="text-4xl font-bold text-gray-900 mt-1">{stats?.totalStock?.toLocaleString() || 0}</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-500">Stock Value At Cost</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">KES {stats?.stockValue?.toLocaleString() || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setBulkMode((v) => !v)}
              className={`rounded-full px-4 py-2 text-sm font-medium inline-flex items-center gap-2 border transition ${
                bulkMode
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-emerald-400'
              }`}
            >
              <Edit className="w-4 h-4" /> {bulkMode ? 'Stop Bulk Edit' : 'Bulk Edit'}
            </button>
            <button disabled className="rounded-full px-4 py-2 text-sm font-medium inline-flex items-center gap-2 bg-emerald-600 text-white opacity-50 cursor-not-allowed">
              <ArrowLeftRight className="w-4 h-4" /> Import from Branch
            </button>
            <button
              onClick={() => router.push('/pos/stock-in')}
              className="rounded-full px-4 py-2 text-sm font-medium inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-emerald-400 transition"
            >
              <Plus className="w-4 h-4" /> Stock In
            </button>
            <button
              onClick={() => router.push('/pos/stock-count')}
              className="rounded-full px-4 py-2 text-sm font-medium inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-emerald-400 transition"
            >
              <ClipboardList className="w-4 h-4" /> Stock Count
            </button>
            <button
              onClick={() => router.push('/pos/stock-out')}
              className="rounded-full px-4 py-2 text-sm font-medium inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-emerald-400 transition"
            >
              <ArrowLeftRight className="w-4 h-4" /> Stock Out
            </button>
            <button onClick={openCreate} className="rounded-full px-4 py-2 text-sm font-medium inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-emerald-400 transition">
              <Plus className="w-4 h-4" /> Create Item
            </button>
            <button
              onClick={() => setImportOpen(true)}
              className="rounded-full px-4 py-2 text-sm font-medium inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-emerald-400 transition"
            >
              <Upload className="w-4 h-4" /> Import Items
            </button>
            <button onClick={handleDownload} className="rounded-full px-4 py-2 text-sm font-medium inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
              <Download className="w-4 h-4" /> Download Stock
            </button>
            <button
              onClick={() => setManageCatOpen(true)}
              className="rounded-full px-4 py-2 text-sm font-medium inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-emerald-400 transition"
            >
              <List className="w-4 h-4" /> Manage Categories
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-w-[200px]"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Bulk Edit selection bar */}
      {bulkMode && (
        <div className="flex flex-wrap items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={allOnPageSelected}
              onChange={toggleSelectAllOnPage}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            Select all on page
          </label>
          <span className="text-sm text-gray-600">
            <span className="font-semibold text-emerald-700">{selectedCount}</span> selected
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setBulkEditOpen(true)}
            disabled={selectedCount === 0}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <Edit className="w-4 h-4" /> Apply Bulk Edit
          </button>
          <button
            onClick={exitBulkMode}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Inventory List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Package2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No inventory found</h3>
          <p className="text-sm text-gray-500">
            {searchQuery || categoryFilter ? 'Try adjusting your filters' : 'No stock records for this branch yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Main Row */}
                <div
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => (bulkMode ? toggleSelect(item) : openEdit(item.productId))}
                >
                  {bulkMode && (
                    <input
                      type="checkbox"
                      checked={!!selected[item.productId]}
                      onChange={() => toggleSelect(item)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 flex-shrink-0"
                    />
                  )}
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package2 className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Name, Category, SKU */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Tag className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-500 truncate">{item.category}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400 truncate">SKU: {item.sku}</span>
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Buying</p>
                      <p className="text-sm font-semibold text-gray-500">
                        {item.buyingPrice > 0 ? `KSh ${item.buyingPrice.toLocaleString()}` : <span className="text-gray-300">—</span>}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Selling</p>
                      <p className="text-sm font-bold text-gray-900">KSh {item.price.toLocaleString()}</p>
                    </div>
                    {item.wholesalePrice && (
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-0.5">Wholesale</p>
                        <p className="text-sm font-semibold text-blue-600">KSh {item.wholesalePrice.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">Qty</p>
                    <p className="text-sm font-bold text-emerald-600">{item.totalQuantity}</p>
                  </div>

                  {/* Status */}
                  <div className="hidden md:block flex-shrink-0">
                    {getStatusBadge(item.stockStatus)}
                  </div>

                  {/* Expand */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleRow(item.productId) }}
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400"
                  >
                    {expandedRows.has(item.productId) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Expanded Variants */}
                {expandedRows.has(item.productId) && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Variants</p>
                    {item.variants.map((variant) => (
                      <div key={variant.stockId} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">Variant {variant.variantIndex + 1}</span>
                          <span className="text-xs font-medium text-gray-700">{variant.size}</span>
                          <span className="text-xs text-gray-500">{variant.vendor.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{variant.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} items
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Product Modal */}
      {modalOpen && (
        <ProductModal
          mode={modalMode}
          productId={editProductId}
          branchId={branchId}
          onClose={() => setModalOpen(false)}
          onSaved={handleModalSaved}
        />
      )}

      {/* Bulk Edit Dialog */}
      {bulkEditOpen && (
        <BulkEditDialog
          open={bulkEditOpen}
          onClose={() => setBulkEditOpen(false)}
          products={selectedProducts}
          categories={categories}
          onSuccess={refreshAfterBulkEdit}
        />
      )}

      {/* Import Items Dialog */}
      <ImportItemsDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        branchId={branchId}
        onSuccess={() => {
          setImportOpen(false)
          setPagination(prev => ({ ...prev, page: 1 }))
          if (branchId) {
            fetch(`/api/pos/inventory/stats?branchId=${branchId}`)
              .then(r => r.json())
              .then(data => setStats(data))
              .catch(console.error)
          }
        }}
      />

      {/* Manage Categories Dialog */}
      <ManageCategoriesDialog
        open={manageCatOpen}
        onClose={() => setManageCatOpen(false)}
        onChanged={() => {
          // Refresh category filter list and inventory (category names may have changed)
          fetch('/api/categories')
            .then(r => r.json())
            .then(data => setCategories(Array.isArray(data) ? data : []))
            .catch(console.error)
          setPagination(prev => ({ ...prev, page: 1 }))
        }}
      />
    </div>
  )
}
