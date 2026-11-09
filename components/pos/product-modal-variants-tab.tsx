'use client'

import { useState, useRef } from 'react'
import { Upload, X, Plus, Loader2, ImageOff, ChevronDown, ChevronUp } from 'lucide-react'
import { ProductVariant } from './product-modal'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VariantsTabProps {
  variants: ProductVariant[]
  defaultSizes: string[]
  errors: Record<string, string>
  onChange: (variants: ProductVariant[]) => void
}

// ─── Size Chips ───────────────────────────────────────────────────────────────

function SizeChips({
  sizes,
  sizeStock,
  onAddSize,
  onRemoveSize,
  onStockChange,
}: {
  sizes: string[]
  sizeStock: Record<string, number>
  onAddSize: (size: string) => void
  onRemoveSize: (size: string) => void
  onStockChange: (size: string, qty: number) => void
}) {
  const [input, setInput] = useState('')

  const handleAdd = () => {
    const trimmed = input.trim().toUpperCase()
    if (!trimmed || sizes.includes(trimmed)) return
    onAddSize(trimmed)
    setInput('')
  }

  return (
    <div className="space-y-3">
      {/* Existing size chips with stock */}
      {sizes.length > 0 && (
        <div className="space-y-2">
          {sizes.map(size => (
            <div key={size} className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 min-w-[56px] justify-center">
                <span className="text-xs font-bold text-emerald-700">{size}</span>
                <button
                  onClick={() => onRemoveSize(size)}
                  className="text-emerald-400 hover:text-emerald-600 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <input
                type="number"
                min="0"
                value={sizeStock[size] ?? 0}
                onChange={e => onStockChange(size, parseInt(e.target.value) || 0)}
                className="w-24 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center"
                placeholder="Qty"
              />
              <span className="text-xs text-gray-400">units</span>
            </div>
          ))}
        </div>
      )}

      {/* Add size input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          placeholder="e.g. S, M, L, XL, 38..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <button
          onClick={handleAdd}
          type="button"
          className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>
    </div>
  )
}

// ─── Variant Card ─────────────────────────────────────────────────────────────

function VariantCard({
  variant,
  index,
  canRemove,
  onUpdate,
  onRemove,
}: {
  variant: ProductVariant
  index: number
  canRemove: boolean
  onUpdate: (updated: Partial<ProductVariant>) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(true)

  const sizes = variant.sizes || []
  const sizeStock: Record<string, number> = variant.sizeStock
    ? Object.fromEntries(Object.entries(variant.sizeStock as Record<string, number>))
    : {}

  const handleAddSize = (size: string) => {
    const newSizes = [...sizes, size]
    const newSizeStock = { ...sizeStock, [size]: 0 }
    onUpdate({
      sizes: newSizes,
      sizeStock: newSizeStock,
      stock: Object.values(newSizeStock).reduce((s, v) => s + v, 0),
    })
  }

  const handleRemoveSize = (size: string) => {
    const newSizes = sizes.filter(s => s !== size)
    const newSizeStock = { ...sizeStock }
    delete newSizeStock[size]
    onUpdate({
      sizes: newSizes,
      sizeStock: Object.keys(newSizeStock).length > 0 ? newSizeStock : undefined,
      stock: Object.values(newSizeStock).reduce((s, v) => s + v, 0),
    })
  }

  const handleSizeStockChange = (size: string, qty: number) => {
    const newSizeStock = { ...sizeStock, [size]: qty }
    onUpdate({
      sizeStock: newSizeStock,
      stock: Object.values(newSizeStock).reduce((s, v) => s + v, 0),
    })
  }

  const totalStock = sizes.length > 0
    ? Object.values(sizeStock).reduce((s, v) => s + v, 0)
    : (variant.stock || 0)

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent'

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-200">
          <img
            src={variant.url}
            alt={`Variant ${index + 1}`}
            className="w-full h-full object-cover"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>

        {/* Label & stock summary */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Variant {index + 1}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {sizes.length > 0
              ? `${sizes.length} size${sizes.length !== 1 ? 's' : ''} · ${totalStock} units`
              : `${totalStock} units`
            }
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {canRemove && (
            <button
              onClick={onRemove}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Remove variant"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Fields */}
      {expanded && (
        <div className="px-4 py-4 space-y-4 bg-white">
          {/* Price + SKU row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Price Override (KSh)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={variant.price ?? ''}
                onChange={e => onUpdate({ price: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Use base price"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                SKU Override
              </label>
              <input
                type="text"
                value={variant.sku ?? ''}
                onChange={e => onUpdate({ sku: e.target.value || undefined })}
                placeholder="Use product SKU"
                className={inp}
              />
            </div>
          </div>

          {/* Wholesale row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Wholesale Price (KSh)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={variant.wholesalePrice ?? ''}
                onChange={e => onUpdate({ wholesalePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Override"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Min Qty (Wholesale)
              </label>
              <input
                type="number"
                min="1"
                value={variant.wholesaleThreshold ?? ''}
                onChange={e => onUpdate({ wholesaleThreshold: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Override"
                className={inp}
                disabled={!variant.wholesalePrice}
              />
            </div>
          </div>

          {/* Sizes + Stock */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Sizes & Stock
            </label>
            {sizes.length === 0 ? (
              // Flat stock when no sizes
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="number"
                  min="0"
                  value={variant.stock ?? 0}
                  onChange={e => onUpdate({ stock: parseInt(e.target.value) || 0 })}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center"
                  placeholder="Qty"
                />
                <span className="text-xs text-gray-500">units (no sizes)</span>
              </div>
            ) : null}
            <SizeChips
              sizes={sizes}
              sizeStock={sizeStock}
              onAddSize={handleAddSize}
              onRemoveSize={handleRemoveSize}
              onStockChange={handleSizeStockChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductModalVariantsTab({
  variants,
  defaultSizes,
  errors,
  onChange,
}: VariantsTabProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return
    setUploading(true)
    try {
      // Fetch watermark settings
      const settingsRes = await fetch('/api/admin/settings')
      const settings = settingsRes.ok ? await settingsRes.json() : null
      const wmText = settings?.watermarkEnabled && settings?.watermarkText ? settings.watermarkText : ''
      const wmPosition = settings?.watermarkPosition || 'bottom-right'
      const wmOpacity = settings?.watermarkOpacity ?? 0.7

      const newVariants = await Promise.all(
        files.map(async (file, i) => {
          const fd = new FormData()
          fd.append('file', file)
          if (wmText) {
            fd.append('watermark_text', wmText)
            fd.append('watermark_position', wmPosition)
            fd.append('watermark_opacity', String(wmOpacity))
          }
          const res = await fetch('/api/upload', { method: 'POST', body: fd })
          if (!res.ok) throw new Error('Upload failed')
          const data = await res.json()
          return {
            url: data.url,
            _tempId: `new-${Date.now()}-${i}`,
            stock: 0,
            sizes: [],
          } as ProductVariant
        })
      )

      onChange([...variants, ...newVariants])
    } catch {
      alert('Failed to upload one or more images')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length) uploadFiles(files)
    // Reset input so same file can be re-uploaded if needed
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length) uploadFiles(files)
  }

  const updateVariant = (index: number, updates: Partial<ProductVariant>) => {
    const updated = variants.map((v, i) => i === index ? { ...v, ...updates } : v)
    onChange(updated)
  }

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index))
  }

  return (
    <div className="px-6 py-5 space-y-5">

      {/* Error */}
      {errors.images && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {errors.images}
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition cursor-pointer group"
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm text-emerald-600 font-medium">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition">
              <Upload className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Click to upload or drag & drop
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                PNG, JPG, WebP · Each image becomes a variant
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Variant Cards */}
      {variants.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-gray-400">
          <ImageOff className="w-10 h-10 opacity-30" />
          <p className="text-sm">No variants yet — upload an image above</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {variants.length} Variant{variants.length !== 1 ? 's' : ''}
          </p>
          {variants.map((variant, index) => (
            <VariantCard
              key={variant._tempId}
              variant={variant}
              index={index}
              canRemove={variants.length > 1}
              onUpdate={updates => updateVariant(index, updates)}
              onRemove={() => removeVariant(index)}
            />
          ))}
        </div>
      )}

      {/* Add another variant shortcut */}
      {variants.length > 0 && (
        <button
          onClick={() => !uploading && fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/30 transition disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Another Variant
        </button>
      )}
    </div>
  )
}
