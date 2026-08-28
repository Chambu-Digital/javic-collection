'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, Minus, Building2, Store, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import BranchDropdown from '@/components/admin/branch-dropdown'
import Link from 'next/link'

interface BranchStockInfo {
  branchId: string
  branchCode: string
  branchName: string
  vendorId: string
  vendorCode: string
  vendorName: string
  quantity: number
  isActive: boolean
  stockIdentifier: string
  imageIndex: number
  selectedSize?: string
}

interface ProductImage {
  url: string
  sku?: string
  stock?: number
  sizes?: string[]
  sizeStock?: Record<string, number>
}

interface ProductData {
  _id: string
  name: string
  sku?: string
  images: ProductImage[]
  sizes: string[]
}

interface StockManagementModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  userBranchId?: string // Auto-select this branch if provided
  userPosRole?: string // User's POS role for permission checking
  restrictToBranch?: boolean // If true, user cannot change branch
  isPosContext?: boolean // If true, hide branch selection UI (POS manages branch)
  branchName?: string // Display name for POS context
  branchCode?: string // Display code for POS context
}

export default function StockManagementModal({
  isOpen,
  onClose,
  productId,
  userBranchId,
  userPosRole,
  restrictToBranch = false,
  isPosContext = false,
  branchName,
  branchCode,
}: StockManagementModalProps) {
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<ProductData | null>(null)
  const [branchStocks, setBranchStocks] = useState<BranchStockInfo[]>([])
  const [totalStock, setTotalStock] = useState(0)
  
  // Global context state
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedVendor, setSelectedVendor] = useState('')
  
  // Vendors
  const [vendors, setVendors] = useState<Array<{ _id: string; name: string; vendorCode: string; isHouseStock: boolean }>>([])
  const [loadingVendors, setLoadingVendors] = useState(false)
  
  // Loading states per variant/size
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({})
  
  // Quantity input state per variant/size
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [focusedInput, setFocusedInput] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && productId) {
      fetchData()
    }
  }, [isOpen, productId])

  // Auto-select branch when user has assigned branch
  useEffect(() => {
    if (userBranchId && !selectedBranch) {
      setSelectedBranch(userBranchId)
    }
  }, [userBranchId, selectedBranch])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchProduct(),
        fetchBranchStock(),
        fetchVendors(),
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load stock data')
    } finally {
      setLoading(false)
    }
  }

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`)
      if (res.ok) {
        const data = await res.json()
        setProduct(data)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    }
  }

  const fetchBranchStock = async () => {
    try {
      const res = await fetch(`/api/admin/products/branch-stock?productId=${productId}`)
      if (res.ok) {
        const data = await res.json()
        setTotalStock(data.totalStock || 0)
        setBranchStocks(data.branchStocks || [])
      }
    } catch (error) {
      console.error('Error fetching branch stock:', error)
    }
  }

  const fetchVendors = async () => {
    setLoadingVendors(true)
    try {
      const res = await fetch('/api/admin/vendors?activeOnly=true')
      if (res.ok) {
        const data = await res.json()
        setVendors(data.vendors || [])
        
        // Auto-select house stock vendor if available
        const houseVendor = data.vendors.find((v: any) => v.isHouseStock)
        if (houseVendor) {
          setSelectedVendor(houseVendor._id)
        }
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setLoadingVendors(false)
    }
  }

  const getActionKey = (variantIndex: number, size?: string) => {
    return `${variantIndex}-${size || 'no-size'}`
  }

  const getQuantity = (variantIndex: number, size?: string) => {
    const key = getActionKey(variantIndex, size)
    const value = quantities[key]
    
    // If empty or invalid, default to 10
    if (!value || value === '') return 10
    
    const parsed = parseInt(value)
    return isNaN(parsed) || parsed <= 0 ? 10 : parsed
  }

  const setQuantity = (variantIndex: number, size: string | undefined, value: string) => {
    const key = getActionKey(variantIndex, size)
    setQuantities(prev => ({ ...prev, [key]: value }))
  }

  const handleStockAction = async (
    action: 'add' | 'remove',
    variantIndex: number,
    size?: string
  ) => {
    if (!selectedBranch) {
      toast.error('Please select a branch')
      return
    }

    if (!selectedVendor) {
      toast.error('Please select a vendor')
      return
    }

    const key = getActionKey(variantIndex, size)
    const quantity = getQuantity(variantIndex, size)

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }

    try {
      setLoadingActions(prev => ({ ...prev, [key]: true }))
      
      const endpoint = action === 'add' 
        ? '/api/admin/products/add-stock'
        : '/api/admin/products/remove-stock'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          branchId: selectedBranch,
          vendorId: selectedVendor,
          imageIndex: variantIndex,
          selectedSize: size || undefined,
          quantity,
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Successfully ${action === 'add' ? 'added' : 'removed'} ${quantity} units`)
        
        // Refresh data
        await fetchBranchStock()
        
        // Clear the input for this item
        setQuantities(prev => ({ ...prev, [key]: '' }))
      } else {
        toast.error(data.error || `Failed to ${action} stock`)
      }
    } catch (error) {
      console.error(`Error ${action}ing stock:`, error)
      toast.error(`Error ${action}ing stock`)
    } finally {
      setLoadingActions(prev => ({ ...prev, [key]: false }))
    }
  }

  const toggleCustomInput = (variantIndex: number, size?: string) => {
    const key = getActionKey(variantIndex, size)
    setShowCustomInput(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const setCustomQuantity = (variantIndex: number, size: string | undefined, value: number) => {
    const key = getActionKey(variantIndex, size)
    setCustomQuantities(prev => ({ ...prev, [key]: value }))
  }

  const getVariantStock = (variantIndex: number, size?: string) => {
    const filtered = branchStocks.filter(bs => {
      if (bs.imageIndex !== variantIndex) return false
      
      // If we're looking for a specific size, only match that size
      if (size !== undefined) {
        return bs.selectedSize === size
      }
      
      // If we're NOT looking for a specific size, sum all stock for this variant
      // (this means "get total stock for this variant regardless of size")
      return true
    })
    
    return filtered.reduce((sum, bs) => sum + bs.quantity, 0)
  }

  const getVariantStockByBranch = (variantIndex: number, size?: string) => {
    const filtered = branchStocks.filter(bs => {
      if (bs.imageIndex !== variantIndex) return false
      
      // If we're looking for a specific size, only match that size
      if (size !== undefined) {
        return bs.selectedSize === size
      }
      
      // If we're NOT looking for a specific size, include all stock for this variant
      return true
    })
    
    // Group by branch
    const byBranch: Record<string, { name: string; quantity: number }> = {}
    filtered.forEach(bs => {
      if (!byBranch[bs.branchId]) {
        byBranch[bs.branchId] = { name: bs.branchName, quantity: 0 }
      }
      byBranch[bs.branchId].quantity += bs.quantity
    })
    
    return Object.values(byBranch)
  }

  const getStockBadgeColor = (stock: number) => {
    if (stock === 0) return 'text-red-600'
    if (stock <= 10) return 'text-yellow-600'
    return 'text-green-600'
  }

  const renderStockActions = (variantIndex: number, size?: string) => {
    const key = getActionKey(variantIndex, size)
    const isLoading = loadingActions[key]
    const currentQty = quantities[key] || ''

    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-sm text-gray-500">Processing...</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleStockAction('remove', variantIndex, size)}
          disabled={!selectedBranch || !selectedVendor}
          className="h-8 w-8 p-0"
          title="Remove stock"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <input
          type="number"
          min="1"
          value={currentQty}
          onChange={(e) => setQuantity(variantIndex, size, e.target.value)}
          onFocus={() => setFocusedInput(key)}
          onBlur={() => setFocusedInput(null)}
          placeholder="10"
          className="w-16 h-8 px-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!selectedBranch || !selectedVendor}
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleStockAction('add', variantIndex, size)}
          disabled={!selectedBranch || !selectedVendor}
          className="h-8 w-8 p-0"
          title="Add stock"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Management</DialogTitle>
          </DialogHeader>
          <div className="animate-pulse space-y-4 py-8">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!product) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Not Found</DialogTitle>
          </DialogHeader>
          <p className="text-gray-500">Unable to load product information.</p>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Management - {product.name}
          </DialogTitle>
          <DialogDescription>
            Select branch and vendor, then adjust stock for each variant
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Total Stock Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Stock (All Branches)</p>
                  <p className="text-3xl font-bold text-blue-900">{totalStock} units</p>
                </div>
                <Badge variant="outline" className={
                  totalStock === 0 
                    ? "bg-red-100 text-red-800 border-red-300"
                    : totalStock <= 10
                    ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                    : "bg-green-100 text-green-800 border-green-300"
                }>
                  {totalStock === 0 ? 'Out of Stock' : totalStock <= 10 ? 'Low Stock' : 'In Stock'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Global Context: Branch & Vendor Selection */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                {isPosContext ? 'Current Branch & Vendor' : 'Select Branch & Vendor (applies to all adjustments below)'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Branch Selection or Display */}
                {isPosContext ? (
                  // POS Context: Show read-only branch info
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building2 className="inline h-4 w-4 mr-1" />
                      Current Branch
                    </label>
                    <div className="w-full px-3 py-2 border border-blue-300 bg-blue-50 rounded-md text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-blue-900">
                          {branchName} ({branchCode})
                        </span>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                          Active
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Stock adjustments will be made to this branch
                    </p>
                  </div>
                ) : (
                  // Admin Context: Show dropdown
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building2 className="inline h-4 w-4 mr-1" />
                      Branch *
                      {restrictToBranch && (
                        <span className="text-xs text-blue-600 ml-2">(Assigned Branch)</span>
                      )}
                    </label>
                    <BranchDropdown
                      value={selectedBranch}
                      onChange={setSelectedBranch}
                      required
                      activeOnly
                      disabled={restrictToBranch}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    {restrictToBranch && (
                      <p className="text-xs text-gray-500 mt-1">
                        You can only adjust stock for your assigned branch
                      </p>
                    )}
                  </div>
                )}

                {/* Vendor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Store className="inline h-4 w-4 mr-1" />
                    Vendor *
                  </label>
                  <select
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    required
                    disabled={loadingVendors || vendors.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-gray-50"
                  >
                    <option value="">
                      {loadingVendors ? 'Loading...' : vendors.length === 0 ? 'No vendors' : 'Select vendor...'}
                    </option>
                    {vendors.map((vendor) => (
                      <option key={vendor._id} value={vendor._id}>
                        {vendor.name} ({vendor.vendorCode}) {vendor.isHouseStock ? '- House Stock' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(!selectedBranch || !selectedVendor) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{isPosContext ? 'Select vendor to enable stock actions' : 'Select branch and vendor to enable stock actions'}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variants Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Variants & Stock Levels</h3>
            
            {product.images.map((image, variantIndex) => {
              const availableSizes = image.sizes || product.sizes || []
              const hasSizes = availableSizes.length > 0
              const variantStock = getVariantStock(variantIndex)
              const branchBreakdown = getVariantStockByBranch(variantIndex)

              return (
                <Card key={variantIndex}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Variant Image */}
                      <img
                        src={image.url}
                        alt={`Variant ${variantIndex + 1}`}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />

                      {/* Variant Info & Stock Actions */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              Variant {variantIndex + 1}
                            </h4>
                            {image.sku && (
                              <p className="text-xs text-gray-500">SKU: {image.sku}</p>
                            )}
                          </div>
                          <Badge variant="outline" className={
                            variantStock === 0 
                              ? "bg-red-100 text-red-800 border-red-300"
                              : variantStock <= 10
                              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                              : "bg-green-100 text-green-800 border-green-300"
                          }>
                            {variantStock} units total
                          </Badge>
                        </div>

                        {/* Stock by Size or Total */}
                        {hasSizes ? (
                          <div className="space-y-2">
                            {availableSizes.map((size) => {
                              const sizeStock = getVariantStock(variantIndex, size)
                              return (
                                <div
                                  key={size}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <span className="font-medium text-gray-900 w-12">{size}</span>
                                    <span className={`font-bold ${getStockBadgeColor(sizeStock)}`}>
                                      {sizeStock} units
                                    </span>
                                  </div>
                                  <div className="flex-shrink-0">
                                    {renderStockActions(variantIndex, size)}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                            <span className={`font-bold ${getStockBadgeColor(variantStock)}`}>
                              Total: {variantStock} units
                            </span>
                            <div className="flex-shrink-0">
                              {renderStockActions(variantIndex)}
                            </div>
                          </div>
                        )}

                        {/* Branch Breakdown */}
                        {branchBreakdown.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Stock by branch:</p>
                            <div className="flex flex-wrap gap-2">
                              {branchBreakdown.map((branch, idx) => (
                                <span key={idx} className="text-xs text-gray-600">
                                  {branch.name}: <span className="font-medium">{branch.quantity}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Link 
              href={`/admin/products/${productId}/stock`}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              View Full Stock Management Page →
            </Link>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
