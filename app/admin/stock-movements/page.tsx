'use client'

import { useState, useEffect } from 'react'
import { History, Search, Download, TrendingUp, TrendingDown, Package, AlertTriangle, Calendar, Filter, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import BranchDropdown from '@/components/admin/branch-dropdown'
import Link from 'next/link'

interface StockMovement {
  _id: string
  entryNumber: string
  eventType: string
  productId: string
  productName: string
  productImage?: string
  size?: string
  quantity: number
  branchId: string
  branchName: string
  branchCode: string
  vendorName?: string
  vendorCode?: string
  userName: string
  notes?: string
  createdAt: string
}

interface Summary {
  today: {
    totalMovements: number
    added: number
    removed: number
    adjusted: number
    transferred: number
  }
  lowStockCount: number
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<Summary | null>(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [limit] = useState(50)

  // Filters
  const [eventType, setEventType] = useState('all')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedVendor, setSelectedVendor] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Vendors list
  const [vendors, setVendors] = useState<Array<{ _id: string; name: string; vendorCode: string }>>([])

  useEffect(() => {
    fetchMovements()
    fetchVendors()
  }, [currentPage, eventType, selectedBranch, selectedVendor, startDate, endDate])

  useEffect(() => {
    // Reset to page 1 when filters change
    if (currentPage !== 1) {
      setCurrentPage(1)
    } else {
      fetchMovements()
    }
  }, [searchQuery])

  const fetchMovements = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      })

      if (eventType && eventType !== 'all') params.append('eventType', eventType)
      if (selectedBranch && selectedBranch !== 'all') params.append('branchId', selectedBranch)
      if (selectedVendor && selectedVendor !== 'all') params.append('vendorId', selectedVendor)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/admin/stock-movements?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setMovements(data.movements || [])
        setSummary(data.summary)
        setTotalPages(data.pagination.totalPages)
        setTotalCount(data.pagination.totalCount)
      }
    } catch (error) {
      console.error('Error fetching stock movements:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/admin/vendors?activeOnly=true')
      if (res.ok) {
        const data = await res.json()
        setVendors(data.vendors || [])
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
  }

  const handleSearch = () => {
    fetchMovements()
  }

  const handleReset = () => {
    setEventType('all')
    setSelectedBranch('all')
    setSelectedVendor('all')
    setStartDate('')
    setEndDate('')
    setSearchQuery('')
    setCurrentPage(1)
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'inventory_added':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'inventory_removed':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'inventory_adjusted':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'stock_transferred':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'inventory_added':
        return 'Added'
      case 'inventory_removed':
        return 'Removed'
      case 'inventory_adjusted':
        return 'Adjusted'
      case 'stock_transferred':
        return 'Transferred'
      default:
        return type
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'inventory_added':
        return <TrendingUp className="h-4 w-4" />
      case 'inventory_removed':
        return <TrendingDown className="h-4 w-4" />
      case 'inventory_adjusted':
        return <RefreshCw className="h-4 w-4" />
      case 'stock_transferred':
        return <Package className="h-4 w-4" />
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (loading && movements.length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <History className="h-6 w-6" />
              Stock Movement History
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Track all inventory additions, removals, and adjustments
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button
              variant="outline"
              onClick={fetchMovements}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today's Movements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.today.totalMovements}</div>
              <p className="text-xs text-gray-500 mt-1">Total transactions</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                Stock Added Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{summary.today.added}</div>
              <p className="text-xs text-green-600 mt-1">Units added</p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700">
                Stock Removed Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{summary.today.removed}</div>
              <p className="text-xs text-red-600 mt-1">Units removed</p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{summary.lowStockCount}</div>
              <p className="text-xs text-yellow-600 mt-1">Items need restocking</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Product name or entry number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="inventory_added">Added</option>
                  <option value="inventory_removed">Removed</option>
                  <option value="inventory_adjusted">Adjusted</option>
                  <option value="stock_transferred">Transferred</option>
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch
                </label>
                <BranchDropdown
                  value={selectedBranch}
                  onChange={setSelectedBranch}
                  includeAllOption={true}
                  activeOnly={false}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                />
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor
                </label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="all">All Vendors</option>
                  {vendors.map((vendor) => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.name} ({vendor.vendorCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {movements.length > 0 ? ((currentPage - 1) * limit + 1) : 0} - {Math.min(currentPage * limit, totalCount)} of {totalCount} movements
        </p>
      </div>

      {/* Movements Table */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map((movement) => (
                  <tr key={movement._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {movement.entryNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {movement.productImage && (
                          <img
                            src={movement.productImage}
                            alt={movement.productName}
                            className="h-10 w-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {movement.productName}
                          </div>
                          {movement.size && (
                            <div className="text-xs text-gray-500">Size: {movement.size}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className={getEventTypeColor(movement.eventType)}>
                        <span className="flex items-center gap-1">
                          {getEventTypeIcon(movement.eventType)}
                          {getEventTypeLabel(movement.eventType)}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-bold ${
                        movement.eventType === 'inventory_added' 
                          ? 'text-green-600' 
                          : movement.eventType === 'inventory_removed'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}>
                        {movement.eventType === 'inventory_added' ? '+' : movement.eventType === 'inventory_removed' ? '-' : ''}
                        {movement.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{movement.branchName}</div>
                      <div className="text-xs text-gray-500">{movement.branchCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {movement.vendorName ? (
                        <div>
                          <div className="text-sm text-gray-900">{movement.vendorName}</div>
                          {movement.vendorCode && (
                            <div className="text-xs text-gray-500">{movement.vendorCode}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(movement.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {movements.map((movement) => (
              <div key={movement._id} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {movement.productImage && (
                    <img
                      src={movement.productImage}
                      alt={movement.productName}
                      className="h-16 w-16 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {movement.productName}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {movement.entryNumber}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={`${getEventTypeColor(movement.eventType)} text-xs`}>
                        {getEventTypeLabel(movement.eventType)}
                      </Badge>
                      <span className={`text-sm font-bold ${
                        movement.eventType === 'inventory_added' 
                          ? 'text-green-600' 
                          : movement.eventType === 'inventory_removed'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}>
                        {movement.eventType === 'inventory_added' ? '+' : movement.eventType === 'inventory_removed' ? '-' : ''}
                        {movement.quantity} units
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Branch:</span>
                    <div className="font-medium">{movement.branchName}</div>
                  </div>
                  {movement.vendorName && (
                    <div>
                      <span className="text-gray-500">Vendor:</span>
                      <div className="font-medium">{movement.vendorName}</div>
                    </div>
                  )}
                  {movement.size && (
                    <div>
                      <span className="text-gray-500">Size:</span>
                      <div className="font-medium">{movement.size}</div>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">User:</span>
                    <div className="font-medium">{movement.userName}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {formatDate(movement.createdAt)}
                </div>
                {movement.notes && (
                  <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                    {movement.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {movements.length === 0 && !loading && (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No movements found</h3>
              <p className="text-sm text-gray-500">
                {searchQuery || eventType !== 'all' || selectedBranch !== 'all' || startDate || endDate
                  ? 'Try adjusting your filters'
                  : 'Stock movements will appear here'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
