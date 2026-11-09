'use client'

import { useState, useEffect } from 'react'
import { MapPin, Loader2, Package2 } from 'lucide-react'
import { ProductFormData, ProductVariant } from './product-modal'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Vendor {
  _id: string
  name: string
  vendorCode: string
  isHouseStock: boolean
}

interface Branch {
  _id: string
  name: string
  branchCode: string
}

interface StockTabProps {
  formData: ProductFormData
  errors: Record<string, string>
  onChange: (updates: Partial<ProductFormData>) => void
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductModalStockTab({
  formData,
  errors,
  onChange,
}: StockTabProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [branch, setBranch] = useState<Branch | null>(null)
  const [loadingVendors, setLoadingVendors] = useState(false)

  // Fetch branch details for display
  useEffect(() => {
    if (!formData.branchId) return
    fetch(`/api/admin/branches`)
      .then(r => r.json())
      .then(data => {
        const found = (data.branches || []).find((b: Branch) => b._id === formData.branchId)
        if (found) setBranch(found)
      })
      .catch(console.error)
  }, [formData.branchId])

  // Fetch vendors for this branch
  useEffect(() => {
    if (!formData.branchId) return
    setLoadingVendors(true)
    fetch(`/api/admin/vendors?activeOnly=true&branchId=${formData.branchId}`)
      .then(r => r.json())
      .then(data => {
        const active = (data.vendors || []).filter((v: Vendor) => v.isActive)
        setVendors(active)
        // Auto-select house stock vendor if no vendor selected yet
        if (!formData.vendorId) {
          const house = active.find((v: Vendor) => v.isHouseStock)
          const defaultVendor = house || active[0]
          if (defaultVendor) onChange({ vendorId: defaultVendor._id })
        }
      })
      .catch(console.error)
      .finally(() => setLoadingVendors(false))
  }, [formData.branchId])

  // Calculate total stock across all variants
  const totalStock = formData.images.reduce((sum, img) => {
    if (img.sizeStock) {
      return sum + Object.values(img.sizeStock as Record<string, number>).reduce((s, v) => s + v, 0)
    }
    return sum + (img.stock || 0)
  }, 0)

  const getVariantStock = (variant: ProductVariant): number => {
    if (variant.sizeStock) {
      return Object.values(variant.sizeStock as Record<string, number>).reduce((s, v) => s + v, 0)
    }
    return variant.stock || 0
  }

  const inp = 'w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition'

  return (
    <div className="px-6 py-5 space-y-6">

      {/* Branch — read only */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch</label>
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {branch ? branch.name : 'Loading...'}
            </p>
            {branch && (
              <p className="text-xs text-gray-500">{branch.branchCode}</p>
            )}
          </div>
          <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
            Selected
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Branch is set from your POS sidebar selection
        </p>
      </div>

      {/* Vendor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Vendor <span className="text-red-500">*</span>
        </label>
        {loadingVendors ? (
          <div className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading vendors...
          </div>
        ) : vendors.length === 0 ? (
          <div className="px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
            No vendors assigned to this branch. Please assign a vendor in admin settings first.
          </div>
        ) : (
          <select
            value={formData.vendorId}
            onChange={e => onChange({ vendorId: e.target.value })}
            className={errors.vendorId ? `${inp} border-red-400` : inp}
          >
            <option value="">Select vendor</option>
            {vendors.map(v => (
              <option key={v._id} value={v._id}>
                {v.name} ({v.vendorCode}){v.isHouseStock ? ' — House Stock' : ''}
              </option>
            ))}
          </select>
        )}
        {errors.vendorId && (
          <p className="text-xs text-red-600 mt-1">{errors.vendorId}</p>
        )}
      </div>

      {/* Stock Summary */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">Stock Summary</label>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            {totalStock} total units
          </span>
        </div>

        {formData.images.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400">
            <Package2 className="w-5 h-5 opacity-40" />
            No variants yet — add images in the Variants tab
          </div>
        ) : (
          <div className="space-y-2">
            {formData.images.map((variant, idx) => {
              const stock = getVariantStock(variant)
              const sizes = variant.sizes || []

              return (
                <div key={variant._tempId || idx} className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    <img
                      src={variant.url}
                      alt={`Variant ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Variant {idx + 1}</p>
                    {sizes.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sizes.map(size => (
                          <span key={size} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-600">
                            {size}: {(variant.sizeStock as Record<string, number>)?.[size] ?? 0}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-0.5">No sizes</p>
                    )}
                  </div>

                  {/* Total stock */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-gray-900">{stock}</p>
                    <p className="text-xs text-gray-400">units</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
