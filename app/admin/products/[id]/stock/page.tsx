'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Package, Building2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { IProduct } from '@/models/Product'
import BranchDropdown from '@/components/admin/branch-dropdown'
import ProductBranchStock from '@/components/admin/product-branch-stock'
import { toast } from 'sonner'

export default function ProductStockPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [product, setProduct] = useState<IProduct | null>(null)
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedVendor, setSelectedVendor] = useState('')
  const [vendors, setVendors] = useState<Array<{ _id: string; name: string; vendorCode: string; isHouseStock: boolean }>>([])
  const [loadingVendors, setLoadingVendors] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [quantityToAdd, setQuantityToAdd] = useState(0)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchProduct()
    fetchVendors()
  }, [resolvedParams.id])

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${resolvedParams.id}`)
      if (res.ok) {
        const data = await res.json()
        setProduct(data)
      } else {
        toast.error('Failed to fetch product')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Error loading product')
    } finally {
      setLoading(false)
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
      toast.error('Failed to load vendors')
    } finally {
      setLoadingVendors(false)
    }
  }

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedBranch) {
      toast.error('Please select a branch')
      return
    }

    if (!selectedVendor) {
      toast.error('Please select a vendor')
      return
    }

    if (quantityToAdd <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }

    try {
      setSaving(true)
      
      const response = await fetch('/api/admin/products/add-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId: resolvedParams.id,
          branchId: selectedBranch,
          vendorId: selectedVendor,
          imageIndex: selectedImageIndex,
          selectedSize: selectedSize || undefined,
          quantity: quantityToAdd,
          notes
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Added ${quantityToAdd} units to stock`)
        
        // Reset form
        setQuantityToAdd(0)
        setNotes('')
        
        // Refresh product data
        await fetchProduct()
      } else {
        toast.error(data.error || 'Failed to add stock')
      }
    } catch (error) {
      console.error('Error adding stock:', error)
      toast.error('Error adding stock')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
        {Array(3).fill(0).map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded" />)}
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <Link href="/admin/products">
          <Button>Back to Products</Button>
        </Link>
      </div>
    )
  }

  // Get available sizes for selected image
  const selectedImage = product.images?.[selectedImageIndex]
  const availableSizes = selectedImage?.sizes || product.sizes || []
  const hasSizes = availableSizes.length > 0

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link 
          href={`/admin/products/${resolvedParams.id}/edit`} 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Product
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-600 mt-1">Manage branch-specific inventory</p>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            SKU: {product.sku || 'N/A'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Stock Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Stock
            </CardTitle>
            <CardDescription>
              Add inventory to a specific branch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddStock} className="space-y-4">
              {/* Branch Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch *
                </label>
                <BranchDropdown
                  value={selectedBranch}
                  onChange={setSelectedBranch}
                  required
                  activeOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select which branch this stock belongs to
                </p>
              </div>

              {/* Vendor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor *
                </label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  required
                  disabled={loadingVendors || vendors.length === 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingVendors ? 'Loading vendors...' : vendors.length === 0 ? 'No vendors available' : 'Select vendor...'}
                  </option>
                  {vendors.map((vendor) => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.name} ({vendor.vendorCode}) {vendor.isHouseStock ? '- House Stock' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select which vendor this stock is from
                </p>
              </div>

              {/* Image/Variant Selection */}
              {product.images && product.images.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Design/Variant
                  </label>
                  <select
                    value={selectedImageIndex}
                    onChange={(e) => {
                      setSelectedImageIndex(parseInt(e.target.value))
                      setSelectedSize('') // Reset size when image changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    {product.images.map((img, index) => (
                      <option key={index} value={index}>
                        Design {index + 1} {img.sku ? `(${img.sku})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Size Selection */}
              {hasSizes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size {hasSizes ? '*' : '(Optional)'}
                  </label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    required={hasSizes}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="">Select size...</option>
                    {availableSizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Add *
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(parseInt(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter quantity"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  placeholder="Add any notes about this stock addition..."
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={saving || !selectedBranch || !selectedVendor || quantityToAdd <= 0}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Save className="w-4 h-4 mr-2 animate-spin" />
                    Adding Stock...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add {quantityToAdd || 0} Units
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Current Stock Display */}
        <div>
          <ProductBranchStock
            productId={resolvedParams.id}
            productName={product.name}
            lowStockThreshold={10}
          />
        </div>
      </div>
    </div>
  )
}
