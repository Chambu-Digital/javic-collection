'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { ProductFormData } from './product-modal'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  _id: string
  name: string
}

interface DetailsTabProps {
  formData: ProductFormData
  errors: Record<string, string>
  onChange: (updates: Partial<ProductFormData>) => void
}

// ─── Quick Create Category Modal ──────────────────────────────────────────────

function QuickCategoryPopover({
  onCreated,
  onClose,
}: {
  onCreated: (cat: Category) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Category name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), isActive: true }),
      })
      const data = await res.json()
      if (res.ok) {
        onCreated(data)
        onClose()
      } else {
        setError(data.error || 'Failed to create category')
      }
    } catch {
      setError('Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-10 p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">New Category</h4>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleCreate()}
        placeholder="Category name"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent mb-3"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={saving}
          className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          Create
        </button>
      </div>
    </div>
  )
}

// ─── Field Component ──────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition'
const inputErrorCls = 'w-full px-3 py-2.5 border border-red-400 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent transition'

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductModalDetailsTab({
  formData,
  errors,
  onChange,
}: DetailsTabProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [showCatPopover, setShowCatPopover] = useState(false)

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoadingCats(false))
  }, [])

  const handleCategoryChange = (id: string) => {
    const cat = categories.find(c => c._id === id)
    onChange({ categoryId: id, category: cat?.name || '' })
  }

  const handleCategoryCreated = (cat: Category) => {
    setCategories(prev => [...prev, cat])
    onChange({ categoryId: cat._id, category: cat.name })
  }

  return (
    <div className="px-6 py-5 space-y-5">

      {/* Name */}
      <Field label="Product Name" required error={errors.name}>
        <input
          type="text"
          value={formData.name}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g. Classic Cotton T-Shirt"
          className={errors.name ? inputErrorCls : inputCls}
          autoFocus
        />
      </Field>

      {/* Category */}
      <Field label="Category" required error={errors.category}>
        <div className="relative">
          <div className="flex gap-2">
            <select
              value={formData.categoryId}
              onChange={e => handleCategoryChange(e.target.value)}
              disabled={loadingCats}
              className={`flex-1 ${errors.category ? inputErrorCls : inputCls} ${loadingCats ? 'opacity-50' : ''}`}
            >
              <option value="">
                {loadingCats ? 'Loading...' : 'Select category'}
              </option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowCatPopover(v => !v)}
              className="flex-shrink-0 px-3 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 hover:border-emerald-400 transition"
              title="Create new category"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {showCatPopover && (
            <QuickCategoryPopover
              onCreated={handleCategoryCreated}
              onClose={() => setShowCatPopover(false)}
            />
          )}
        </div>
      </Field>

      {/* Description */}
      <Field label="Description" required error={errors.description}>
        <textarea
          value={formData.description}
          onChange={e => onChange({ description: e.target.value })}
          placeholder="Brief product description..."
          rows={3}
          className={`${errors.description ? inputErrorCls : inputCls} resize-none`}
        />
      </Field>

      {/* Pricing Row */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Buying Price (KSh)">
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.buyingPrice || ''}
            onChange={e => onChange({ buyingPrice: e.target.value })}
            placeholder="Cost price"
            className={inputCls}
          />
        </Field>

        <Field label="Retail Price (KSh)" required error={errors.price}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={e => onChange({ price: e.target.value })}
            placeholder="0.00"
            className={errors.price ? inputErrorCls : inputCls}
          />
        </Field>
      </div>

      {/* Compare price row */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Compare Price (KSh)">
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.oldPrice}
            onChange={e => onChange({ oldPrice: e.target.value })}
            placeholder="Optional"
            className={inputCls}
          />
        </Field>
        <div /> {/* spacer */}
      </div>

      {/* Wholesale Row */}
      <div className="rounded-xl border border-gray-200 p-4 space-y-4 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Wholesale Pricing (Optional)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Wholesale Price (KSh)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.wholesalePrice}
              onChange={e => onChange({ wholesalePrice: e.target.value })}
              placeholder="0.00"
              className={inputCls}
            />
          </Field>
          <Field label="Min Qty for Wholesale" error={errors.wholesaleThreshold}>
            <input
              type="number"
              min="1"
              value={formData.wholesaleThreshold}
              onChange={e => onChange({ wholesaleThreshold: e.target.value })}
              placeholder="e.g. 10"
              className={errors.wholesaleThreshold ? inputErrorCls : inputCls}
              disabled={!formData.wholesalePrice}
            />
          </Field>
        </div>
      </div>

      {/* SKU */}
      <Field label="Product SKU (Optional)">
        <input
          type="text"
          value={formData.sku}
          onChange={e => onChange({ sku: e.target.value })}
          placeholder="e.g. JVC-001"
          className={inputCls}
        />
      </Field>

    </div>
  )
}
