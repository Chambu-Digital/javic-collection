'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, Package2 } from 'lucide-react'

export interface BulkEditProduct {
  productId: string
  name: string
  price: number
  buyingPrice: number
  category: string
  barcode?: string
  lowStockThreshold?: number
  isActive?: boolean
}

interface Category {
  _id: string
  name: string
}

interface Props {
  open: boolean
  onClose: () => void
  products: BulkEditProduct[]
  categories: Category[]
  onSuccess: () => void
}

type FieldKey =
  | 'name'
  | 'categoryId'
  | 'buyingPrice'
  | 'price'
  | 'barcode'
  | 'lowStockThreshold'
  | 'isActive'

const FIELDS: { key: FieldKey; label: string; hint?: string }[] = [
  { key: 'name', label: 'Product Name' },
  { key: 'categoryId', label: 'Category' },
  { key: 'buyingPrice', label: 'Buying Price' },
  { key: 'price', label: 'Selling Price' },
  { key: 'barcode', label: 'Barcode', hint: 'Unique — can only be applied to one product at a time' },
  { key: 'lowStockThreshold', label: 'Minimum Stock Level' },
  { key: 'isActive', label: 'Product Status' },
]

export default function BulkEditDialog({ open, onClose, products, categories, onSuccess }: Props) {
  const [enabled, setEnabled] = useState<Record<FieldKey, boolean>>({
    name: false,
    categoryId: false,
    buyingPrice: false,
    price: false,
    barcode: false,
    lowStockThreshold: false,
    isActive: false,
  })
  const [values, setValues] = useState<Record<string, any>>({
    name: '',
    categoryId: '',
    buyingPrice: '',
    price: '',
    barcode: '',
    lowStockThreshold: 10,
    isActive: true,
  })
  const [step, setStep] = useState<'edit' | 'preview'>('edit')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const selectedCount = products.length

  const reset = () => {
    setEnabled({
      name: false,
      categoryId: false,
      buyingPrice: false,
      price: false,
      barcode: false,
      lowStockThreshold: false,
      isActive: false,
    })
    setValues({
      name: '',
      categoryId: '',
      buyingPrice: '',
      price: '',
      barcode: '',
      lowStockThreshold: 10,
      isActive: true,
    })
    setStep('edit')
    setError('')
    setDone(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const toggleField = (key: FieldKey) => {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const enabledFields = FIELDS.filter((f) => enabled[f.key])

  // Client-side validation before moving to preview
  const canPreview = () => {
    if (enabledFields.length === 0) return false
    if (enabled.name && !values.name.trim()) return false
    if (enabled.price && (values.price === '' || Number(values.price) <= 0)) return false
    if (enabled.buyingPrice && (values.buyingPrice === '' || Number(values.buyingPrice) < 0)) return false
    if (enabled.lowStockThreshold && (values.lowStockThreshold === '' || Number(values.lowStockThreshold) < 0)) return false
    if (enabled.categoryId && !values.categoryId) return false
    // Barcode rule: non-empty barcode only allowed for a single product
    if (enabled.barcode && values.barcode.trim() !== '' && selectedCount > 1) return false
    return true
  }

  const buildUpdates = () => {
    const updates: Record<string, unknown> = {}
    if (enabled.name) updates.name = values.name.trim()
    if (enabled.categoryId) updates.categoryId = values.categoryId
    if (enabled.buyingPrice) updates.buyingPrice = Number(values.buyingPrice)
    if (enabled.price) updates.price = Number(values.price)
    if (enabled.barcode) updates.barcode = values.barcode.trim()
    if (enabled.lowStockThreshold) updates.lowStockThreshold = Number(values.lowStockThreshold)
    if (enabled.isActive) updates.isActive = values.isActive
    return updates
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/pos/inventory/bulk-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: products.map((p) => p.productId),
          updates: buildUpdates(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to apply bulk edit')
      }
      setDone(true)
      onSuccess()
      setTimeout(() => {
        handleClose()
      }, 1200)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const oldValueFor = (product: BulkEditProduct, key: FieldKey): string => {
    switch (key) {
      case 'name':
        return product.name
      case 'categoryId':
        return product.category
      case 'buyingPrice':
        return product.buyingPrice > 0 ? `KSh ${product.buyingPrice.toLocaleString()}` : '—'
      case 'price':
        return `KSh ${product.price.toLocaleString()}`
      case 'barcode':
        return product.barcode || '—'
      case 'lowStockThreshold':
        return String(product.lowStockThreshold ?? 10)
      case 'isActive':
        return product.isActive === false ? 'Inactive' : 'Active'
    }
  }

  const newValueFor = (key: FieldKey): string => {
    switch (key) {
      case 'name':
        return values.name.trim()
      case 'categoryId': {
        const cat = categories.find((c) => c._id === values.categoryId)
        return cat ? cat.name : '—'
      }
      case 'buyingPrice':
        return `KSh ${Number(values.buyingPrice).toLocaleString()}`
      case 'price':
        return `KSh ${Number(values.price).toLocaleString()}`
      case 'barcode':
        return values.barcode.trim() || '(cleared)'
      case 'lowStockThreshold':
        return String(values.lowStockThreshold)
      case 'isActive':
        return values.isActive ? 'Active' : 'Inactive'
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto flex flex-col">
        <SheetHeader>
          <SheetTitle>Bulk Edit</SheetTitle>
          <SheetDescription>
            {selectedCount} product{selectedCount !== 1 ? 's' : ''} selected · update only the fields you tick
          </SheetDescription>
        </SheetHeader>

        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mb-3" />
            <p className="text-lg font-semibold text-gray-900">Changes applied</p>
            <p className="text-sm text-gray-500 mt-1">Inventory will refresh shortly</p>
          </div>
        ) : step === 'edit' ? (
          <div className="flex-1 overflow-y-auto px-1 pb-6">
            {/* Field cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {FIELDS.map((field) => (
                <Card
                  key={field.key}
                  className={`border transition ${
                    enabled[field.key] ? 'border-emerald-400 ring-1 ring-emerald-100' : 'border-gray-200'
                  }`}
                >
                  <CardContent className="pt-4 pb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled[field.key]}
                        onChange={() => toggleField(field.key)}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-semibold text-gray-800">{field.label}</span>
                    </label>
                    {field.hint && (
                      <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
                    )}

                    {enabled[field.key] && (
                      <div className="mt-3">
                        {field.key === 'categoryId' ? (
                          <select
                            value={values.categoryId}
                            onChange={(e) => setValues({ ...values, categoryId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          >
                            <option value="">Select category…</option>
                            {categories.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        ) : field.key === 'isActive' ? (
                          <select
                            value={values.isActive ? 'active' : 'inactive'}
                            onChange={(e) =>
                              setValues({ ...values, isActive: e.target.value === 'active' })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        ) : (
                          <input
                            type={field.key === 'buyingPrice' || field.key === 'price' || field.key === 'lowStockThreshold' ? 'number' : 'text'}
                            value={values[field.key]}
                            onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                            placeholder={field.key === 'barcode' ? 'Scan or type barcode' : ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        )}
                        {field.key === 'barcode' && values.barcode.trim() !== '' && selectedCount > 1 && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Apply to one product at a time
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setError('')
                  setStep('preview')
                }}
                disabled={!canPreview()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                Preview <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Preview step */
          <div className="flex-1 overflow-y-auto px-1 pb-6">
            <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800">
                <span className="font-semibold">{selectedCount}</span> product{selectedCount !== 1 ? 's' : ''} will be updated with{' '}
                <span className="font-semibold">{enabledFields.length}</span> field{enabledFields.length !== 1 ? 's' : ''}.
              </p>
            </div>

            {/* Summary of new values */}
            <div className="mt-4 space-y-2">
              {enabledFields.map((f) => (
                <div key={f.key} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-500">{f.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{newValueFor(f.key)}</span>
                </div>
              ))}
            </div>

            {/* Per-product old → new */}
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-5 mb-2">
              Affected products
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {products.map((product) => (
                <div key={product.productId} className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-2">
                    <Package2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {product.name}
                  </p>
                  <div className="mt-1.5 space-y-1 pl-5">
                    {enabledFields.map((f) => (
                      <div key={f.key} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400 w-32 flex-shrink-0">{f.label}:</span>
                        <span className="text-gray-500 line-through">{oldValueFor(product, f.key)}</span>
                        <span className="text-gray-300">→</span>
                        <span className="font-medium text-emerald-700">{newValueFor(f.key)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setStep('edit')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Applying…' : 'Apply changes'}
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
