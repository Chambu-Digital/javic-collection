'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { IProductImage } from '@/models/Product'

interface ImageEditModalProps {
  image: IProductImage | null
  imageIndex: number
  allImages: IProductImage[]
  open: boolean
  defaultPrice?: number
  defaultWholesalePrice?: number
  defaultWholesaleThreshold?: number
  defaultSizes?: string[]
  branchStock?: number // Branch-specific stock quantity
  onSave: (index: number, updated: IProductImage) => void
  onClose: () => void
  onUngroup?: (index: number) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImageEditModal({
  image,
  imageIndex,
  allImages,
  open,
  defaultPrice,
  defaultWholesalePrice,
  defaultWholesaleThreshold,
  defaultSizes = [],
  branchStock,
  onSave,
  onClose,
  onUngroup,
}: ImageEditModalProps) {
  const [price, setPrice] = useState<string>('')
  const [wholesalePrice, setWholesalePrice] = useState<string>('')
  const [wholesaleThreshold, setWholesaleThreshold] = useState<string>('')
  const [sku, setSku] = useState<string>('')
  const [useSizeStock, setUseSizeStock] = useState(false)
  const [sizeStock, setSizeStock] = useState<Record<string, number>>({})
  const [flatStock, setFlatStock] = useState<string>('')
  const [newSizeName, setNewSizeName] = useState('')

  useEffect(() => {
    if (!open || !image) return
    setPrice(image.price != null ? String(image.price) : '')
    setWholesalePrice(image.wholesalePrice != null ? String(image.wholesalePrice) : '')
    setWholesaleThreshold(image.wholesaleThreshold != null ? String(image.wholesaleThreshold) : '')
    setSku(image.sku ?? '')

    // Initialize with branch stock if available
    if (branchStock !== undefined) {
      setFlatStock(String(branchStock))
    } else if (image.sizeStock && Object.keys(image.sizeStock).length > 0) {
      setUseSizeStock(true)
      setSizeStock({ ...image.sizeStock })
      setFlatStock('')
    } else {
      setUseSizeStock(false)
      setSizeStock({})
      setFlatStock(image.stock != null ? String(image.stock) : '')
    }
    setNewSizeName('')
  }, [open, image, imageIndex, branchStock])

  if (!open || !image) return null

  const addSizeRow = () => {
    const names = newSizeName.split(',').map(s => s.trim()).filter(Boolean)
    if (!names.length) return
    setSizeStock(prev => {
      const next = { ...prev }
      names.forEach(n => { if (!(n in next)) next[n] = 0 })
      return next
    })
    setNewSizeName('')
  }

  const updateSizeQty = (size: string, qty: number) => {
    setSizeStock(prev => ({ ...prev, [size]: Math.max(0, qty) }))
  }

  const removeSize = (size: string) => {
    setSizeStock(prev => {
      const next = { ...prev }
      delete next[size]
      return next
    })
  }

  const seedFromDefaults = () => {
    if (!defaultSizes.length) return
    setSizeStock(prev => {
      const next = { ...prev }
      defaultSizes.forEach(s => { if (!(s in next)) next[s] = 0 })
      return next
    })
  }

  const handleSave = () => {
    const updated: IProductImage = { ...image }

    // Price overrides
    updated.price = price !== '' ? parseFloat(price) : undefined
    updated.wholesalePrice = wholesalePrice !== '' ? parseFloat(wholesalePrice) : undefined
    updated.wholesaleThreshold = wholesaleThreshold !== '' ? parseInt(wholesaleThreshold) : undefined
    updated.sku = sku.trim() || undefined

    // Stock overrides (will be handled by branch-specific logic)
    if (useSizeStock && Object.keys(sizeStock).length > 0) {
      updated.sizeStock = { ...sizeStock }
      updated.sizes = Object.keys(sizeStock)
      updated.stock = Object.values(sizeStock).reduce((s, v) => s + v, 0)
    } else {
      updated.sizeStock = undefined
      updated.sizes = undefined
      updated.stock = flatStock !== '' ? parseInt(flatStock) : undefined
    }

    onSave(imageIndex, updated)
    onClose()
  }

  const getTotalStock = (sizeStock: Record<string, number>): number => {
    return Object.values(sizeStock).reduce((s, v) => s + (v || 0), 0)
  }

  const totalStock = useSizeStock
    ? getTotalStock(sizeStock)
    : flatStock !== '' ? parseInt(flatStock) : null

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const label = 'block text-xs font-medium text-gray-600 mb-1'

  function indexBadge(idx: number): string {
    if (idx === 0) return ' (Main)'
    return ''
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Edit image ${imageIndex + 1}`}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-3">
              <img src={image.url} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Edit Image {imageIndex + 1}
                  {indexBadge(imageIndex)}
                  {image.groupId && (
                    <span className="ml-2 text-xs font-normal bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                      Grouped
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Overrides apply to this image only — blank = use product default
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          {image.groupId && (
            <div className="px-5 py-3 bg-purple-50 border-b border-purple-100">
              <p className="text-xs font-semibold text-purple-800 mb-2">Group Members</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages
                  .map((img, originalIndex) => ({ img, originalIndex }))
                  .filter(({ img, originalIndex }) => img.groupId === image.groupId && originalIndex !== imageIndex)
                  .map(({ img, originalIndex }) => (
                    <div key={originalIndex} className="relative group flex-shrink-0">
                      <img src={img.url} alt={`Group member ${originalIndex}`} className="w-12 h-12 rounded-lg object-cover border border-purple-200" />
                      {onUngroup && (
                        <button
                          type="button"
                          onClick={() => onUngroup(originalIndex)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow"
                          title="Remove from group"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                {allImages.filter((img, i) => img.groupId === image.groupId && i !== imageIndex).length === 0 && (
                  <p className="text-xs text-purple-600 italic">No other images in this group</p>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            <div>
              <label className={label}>SKU / Item Code</label>
              <input type="text" value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. JVC-RED-001" className={inp} />
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 space-y-3">
              <p className="text-xs font-semibold text-blue-800">Price Overrides</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>
                    Retail Price (KSH)
                    {defaultPrice != null && <span className="text-gray-400 ml-1">default: {defaultPrice.toLocaleString()}</span>}
                  </label>
                  <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Leave blank to inherit" className={inp} />
                </div>
                <div>
                  <label className={label}>
                    Wholesale Price (KSH)
                    {defaultWholesalePrice != null && <span className="text-gray-400 ml-1">default: {defaultWholesalePrice.toLocaleString()}</span>}
                  </label>
                  <input type="number" min="0" step="0.01" value={wholesalePrice} onChange={e => setWholesalePrice(e.target.value)} placeholder="Leave blank to inherit" className={inp} />
                </div>
              </div>
              <div className="w-1/2 pr-1.5">
                <label className={label}>
                  Min Qty for Wholesale
                  {defaultWholesaleThreshold != null && <span className="text-gray-400 ml-1">default: {defaultWholesaleThreshold}</span>}
                </label>
                <input type="number" min="1" value={wholesaleThreshold} onChange={e => setWholesaleThreshold(e.target.value)} placeholder="Leave blank to inherit" className={inp} />
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Stock (Branch-Specific)</p>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs text-gray-600">Per-size stock</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={useSizeStock}
                    onClick={() => setUseSizeStock(v => !v)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      useSizeStock ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        useSizeStock ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              </div>

              {!useSizeStock ? (
                <div>
                  <label className={label}>Total stock for this design</label>
                  <input
                    type="number"
                    min="0"
                    value={flatStock}
                    onChange={e => setFlatStock(e.target.value)}
                    placeholder="Enter quantity"
                    className={inp}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.keys(sizeStock).length === 0 && (
                    <p className="text-xs text-gray-400 italic">
                      No sizes added yet. Add sizes below or seed from product defaults.
                    </p>
                  )}

                  {Object.entries(sizeStock).map(([size, qty]) => (
                    <div key={size} className="flex items-center gap-2">
                      <span className="w-16 text-sm font-medium text-gray-700 truncate">{size}</span>
                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={e => updateSizeQty(size, parseInt(e.target.value) || 0)}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                      <span className="text-xs text-gray-400 w-8">units</span>
                      <button
                        type="button"
                        onClick={() => removeSize(size)}
                        className="text-red-400 hover:text-red-600 transition-colors p-0.5"
                        aria-label={`Remove ${size}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {Object.keys(sizeStock).length > 0 && (
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
                      <span className="w-16 text-xs font-semibold text-gray-600">Total</span>
                      <span className="text-sm font-bold text-gray-900">{getTotalStock(sizeStock)} units</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newSizeName}
                      onChange={e => setNewSizeName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSizeRow() } }}
                      placeholder="e.g. S, M, L  (comma-separated)"
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addSizeRow}
                      disabled={!newSizeName.trim()}
                      className="px-3 py-1.5 bg-gray-700 text-white rounded-md text-sm font-medium hover:bg-gray-900 disabled:opacity-40 transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </button>
                  </div>

                  {defaultSizes.length > 0 && (
                    <button
                      type="button"
                      onClick={seedFromDefaults}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Seed from product sizes
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50 gap-3">
            <div className="text-xs text-gray-500 flex items-center gap-1">
              {totalStock != null && (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                  <span>{totalStock} units in stock</span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
