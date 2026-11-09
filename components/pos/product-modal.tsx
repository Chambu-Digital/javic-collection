'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { IProductImage } from '@/models/Product'
import ProductModalDetailsTab from './product-modal-details-tab'
import ProductModalVariantsTab from './product-modal-variants-tab'
import ProductModalStockTab from './product-modal-stock-tab'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductVariant extends IProductImage {
  // Extends IProductImage with UI-only fields
  _tempId: string  // temp ID for React key (not saved to DB)
}

export interface ProductFormData {
  // Details
  name: string
  description: string
  price: string
  oldPrice: string
  buyingPrice: string
  wholesalePrice: string
  wholesaleThreshold: string
  sku: string
  category: string
  categoryId: string
  // Variants
  images: ProductVariant[]
  sizes: string[]  // product-level default sizes
  // Stock (Task 4)
  vendorId: string
  branchId: string
}

interface ProductModalProps {
  mode: 'create' | 'edit'
  productId?: string
  branchId: string
  onClose: () => void
  onSaved: () => void
}

type Tab = 'details' | 'variants' | 'stock'

const TABS: { id: Tab; label: string }[] = [
  { id: 'details', label: 'Details' },
  { id: 'variants', label: 'Variants' },
  { id: 'stock', label: 'Stock' },
]

const EMPTY_FORM: ProductFormData = {
  name: '',
  description: '',
  price: '',
  oldPrice: '',
  buyingPrice: '',
  wholesalePrice: '',
  wholesaleThreshold: '',
  sku: '',
  category: '',
  categoryId: '',
  images: [],
  sizes: [],
  vendorId: '',
  branchId: '',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductModal({
  mode,
  productId,
  branchId,
  onClose,
  onSaved,
}: ProductModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [formData, setFormData] = useState<ProductFormData>({ ...EMPTY_FORM, branchId })
  const [saving, setSaving] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(mode === 'edit')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState('')

  // Load existing product for edit mode
  useEffect(() => {
    if (mode === 'edit' && productId) {
      loadProduct(productId)
    }
  }, [mode, productId])

  const loadProduct = async (id: string) => {
    setLoadingProduct(true)
    try {
      const res = await fetch(`/api/products/${id}`)
      if (res.ok) {
        const product = await res.json()
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price?.toString() || '',
          oldPrice: product.oldPrice?.toString() || '',
          buyingPrice: product.buyingPrice?.toString() || '0',
          wholesalePrice: product.wholesalePrice?.toString() || '',
          wholesaleThreshold: product.wholesaleThreshold?.toString() || '',
          sku: product.sku || '',
          category: product.category || '',
          categoryId: product.categoryId?.toString() || '',
          images: (product.images || []).map((img: IProductImage, i: number) => ({
            ...img,
            _tempId: `existing-${i}`,
          })),
          sizes: product.sizes || [],
          vendorId: product.vendorId?.toString() || '',
          branchId,
        })
      }
    } catch (e) {
      setGlobalError('Failed to load product')
    } finally {
      setLoadingProduct(false)
    }
  }

  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    // Clear relevant errors
    const clearedErrors = { ...errors }
    Object.keys(updates).forEach(k => delete clearedErrors[k])
    setErrors(clearedErrors)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Price must be greater than 0'
    if (!formData.categoryId) newErrors.category = 'Category is required'
    if (formData.images.length === 0) newErrors.images = 'At least one variant image is required'
    if (!formData.vendorId) newErrors.vendorId = 'Vendor is required'
    if (formData.wholesalePrice && !formData.wholesaleThreshold) {
      newErrors.wholesaleThreshold = 'Minimum quantity required when wholesale price is set'
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      // Switch to the tab that has the first error
      if (newErrors.name || newErrors.price || newErrors.category) {
        setActiveTab('details')
      } else if (newErrors.images) {
        setActiveTab('variants')
      } else if (newErrors.vendorId) {
        setActiveTab('stock')
      }
      return false
    }
    return true
  }

  const handleSave = async () => {
    setGlobalError('')
    if (!validate()) return

    setSaving(true)
    try {
      // Build images array — strip _tempId before sending
      const images = formData.images.map(({ _tempId, ...img }) => img)

      // Calculate derived stock
      const derivedStock = images.reduce((sum, img) => {
        if (img.sizeStock) {
          return sum + Object.values(img.sizeStock as Record<string, number>).reduce((s, v) => s + v, 0)
        }
        return sum + (img.stock || 0)
      }, 0)

      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : undefined,
        buyingPrice: formData.buyingPrice ? parseFloat(formData.buyingPrice) : 0,
        wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : undefined,
        wholesaleThreshold: formData.wholesaleThreshold ? parseInt(formData.wholesaleThreshold) : undefined,
        sku: formData.sku.trim() || undefined,
        category: formData.category,
        categoryId: formData.categoryId,
        images,
        sizes: formData.sizes,
        stockQuantity: derivedStock,
        inStock: derivedStock > 0,
        rating: 0,
        reviews: 0,
        isActive: true,
      }

      let res: Response

      if (mode === 'create') {
        payload.branchId = formData.branchId
        payload.vendorId = formData.vendorId
        payload.initialStock = derivedStock
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`/api/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (res.ok) {
        onSaved()
        onClose()
      } else {
        setGlobalError(data.error || 'Failed to save product')
      }
    } catch {
      setGlobalError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Popover */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {mode === 'create' ? 'New Product' : 'Edit Product'}
              </h2>
              {mode === 'edit' && formData.name && (
                <p className="text-sm text-gray-500 mt-0.5 truncate max-w-sm">{formData.name}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Bar */}
          <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition -mb-px ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {/* Error dot */}
                {((tab.id === 'details' && (errors.name || errors.price || errors.category)) ||
                  (tab.id === 'variants' && errors.images) ||
                  (tab.id === 'stock' && errors.vendorId)) && (
                  <span className="ml-1.5 w-1.5 h-1.5 bg-red-500 rounded-full inline-block" />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loadingProduct ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : (
              <>
                {activeTab === 'details' && (
                  <ProductModalDetailsTab
                    formData={formData}
                    errors={errors}
                    onChange={updateFormData}
                  />
                )}
                {activeTab === 'variants' && (
                  <ProductModalVariantsTab
                    variants={formData.images}
                    defaultSizes={formData.sizes}
                    errors={errors}
                    onChange={images => updateFormData({ images })}
                  />
                )}
                {activeTab === 'stock' && (
                  <ProductModalStockTab
                    formData={formData}
                    errors={errors}
                    onChange={updateFormData}
                  />
                )}
              </>
            )}
          </div>

          {/* Global Error */}
          {globalError && (
            <div className="flex items-center gap-2 mx-6 mb-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex-shrink-0">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {globalError}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-gray-50">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loadingProduct}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
