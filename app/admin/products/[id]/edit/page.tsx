'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { IProduct, IProductImage } from '@/models/Product'
import { ICategory } from '@/models/Category'
import ImageEditModal from '@/components/admin/image-edit-modal'
import QuickCategoryModal from '@/components/admin/quick-category-modal'

// ─── helpers ──────────────────────────────────────────────────────────────────

function imageBadge(img: IProductImage): string {
  const parts: string[] = []
  if (img.sizeStock && Object.keys(img.sizeStock).length) {
    const total = Object.values(img.sizeStock).reduce((s, v) => s + v, 0)
    parts.push(`${total} in stock (${Object.keys(img.sizeStock).join(', ')})`)
  } else if (img.stock != null) {
    parts.push(`${img.stock} in stock`)
  }
  if (img.price != null) parts.push(`KSH ${img.price.toLocaleString()}`)
  if (img.sku) parts.push(img.sku)
  return parts.join(' · ')
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()

  const [loading, setLoading]               = useState(true)
  const [saving, setSaving]                 = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [categories, setCategories]         = useState<ICategory[]>([])
  const [product, setProduct]               = useState<IProduct | null>(null)

  // Modal state
  const [editModalIndex, setEditModalIndex]       = useState<number | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  const [newTag, setNewTag]   = useState('')
  const [newSize, setNewSize] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    oldPrice: 0,
    wholesalePrice: 0,
    wholesaleThreshold: 0,
    category: '',
    categoryId: '',
    stockQuantity: 0,
    images: [] as IProductImage[],
    sizes: [] as string[],
    tags: [] as string[],
    isFeatured: false,
    isFlashDeal: false,
    flashDealDiscount: 0,
    isNewProduct: false,
    isBestseller: false,
    isActive: true,
  })

  useEffect(() => {
    fetchProduct()
    fetchCategories()
  }, [resolvedParams.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${resolvedParams.id}`)
      if (res.ok) {
        const data = await res.json()
        setProduct(data)
        setFormData({
          name: data.name || '',
          description: data.description || '',
          price: data.price || 0,
          oldPrice: data.oldPrice || 0,
          wholesalePrice: data.wholesalePrice || 0,
          wholesaleThreshold: data.wholesaleThreshold || 0,
          category: data.category || '',
          categoryId: data.categoryId || '',
          stockQuantity: data.stockQuantity || 0,
          images: (data.images || []).map((img: any) =>
            typeof img === 'string' ? { url: img } : img
          ),
          sizes: data.sizes || [],
          tags: data.tags || [],
          isFeatured: data.isFeatured || false,
          isFlashDeal: data.isFlashDeal || false,
          flashDealDiscount: data.flashDealDiscount || 0,
          isNewProduct: data.isNewProduct || false,
          isBestseller: data.isBestseller || false,
          isActive: data.isActive !== undefined ? data.isActive : true,
        })
      } else {
        alert('Product not found')
        router.push('/admin/products')
      }
    } catch {
      alert('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?includeInactive=true')
      if (res.ok) setCategories(await res.json())
    } catch { /* silent */ }
  }

  const handleCategoryCreated = (cat: ICategory) => {
    setCategories(prev => [...prev, cat])
    setFormData(prev => ({ ...prev, categoryId: cat._id!, category: cat.name }))
  }

  // ── Image upload ──────────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setImageUploading(true)
    try {
      const settingsRes = await fetch('/api/admin/settings')
      const settings    = settingsRes.ok ? await settingsRes.json() : null
      const wmText      = settings?.watermarkEnabled && settings?.watermarkText ? settings.watermarkText : ''
      const wmPosition  = settings?.watermarkPosition || 'bottom-right'
      const wmOpacity   = settings?.watermarkOpacity ?? 0.7

      const urls = await Promise.all(files.map(async file => {
        const fd = new FormData()
        fd.append('file', file)
        if (wmText) {
          fd.append('watermark_text', wmText)
          fd.append('watermark_position', wmPosition)
          fd.append('watermark_opacity', String(wmOpacity))
        }
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (res.ok) return (await res.json()).url as string
        throw new Error('Upload failed')
      }))
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...urls.map(url => ({ url }))],
      }))
    } catch {
      alert('Failed to upload some images')
    } finally {
      setImageUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
    if (editModalIndex === index) setEditModalIndex(null)
  }

  const handleImageSave = (index: number, updated: IProductImage) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? updated : img),
    }))
  }

  // ── Tags / sizes ──────────────────────────────────────────────────────────────
  const addTag = (value: string) => {
    const items = value.split(',').map(s => s.trim()).filter(Boolean)
    if (!items.length) return
    setFormData(prev => ({ ...prev, tags: [...new Set([...prev.tags, ...items])] }))
    setNewTag('')
  }

  const addSize = (value: string) => {
    const items = value.split(',').map(s => s.trim()).filter(Boolean)
    if (!items.length) return
    setFormData(prev => ({ ...prev, sizes: [...new Set([...prev.sizes, ...items])] }))
    setNewSize('')
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.images.length === 0) {
      alert('Please upload at least one image.')
      return
    }
    setSaving(true)

    // Derive total stock from per-image stock if any image has it set
    const imagesWithStock = formData.images.filter(img => img.stock != null)
    const derivedStock = imagesWithStock.length > 0
      ? formData.images.reduce((sum, img) => sum + (img.stock ?? 0), 0)
      : formData.stockQuantity

    const updateData = {
      ...formData,
      stockQuantity: derivedStock,
      inStock: derivedStock > 0,
    }

    try {
      const res = await fetch(`/api/products/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
      if (res.ok) {
        router.push('/admin/products')
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to update product')
      }
    } catch {
      alert('Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading / not-found states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
        {Array(6).fill(0).map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded" />)}
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <Link href="/admin/products"><Button>Back to Products</Button></Link>
      </div>
    )
  }

  const inp = 'w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <Link href="/admin/products" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-sm sm:text-base">Back to Products</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">Edit Product</h1>
        <p className="text-sm text-gray-600 mt-1">Update product information and settings.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Basic Information ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
              <input type="text" required value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={inp} />
            </div>

            {/* ── Category + quick-create ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Category *</label>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Category
                </button>
              </div>
              <select
                required
                value={formData.categoryId || formData.category}
                onChange={e => {
                  const selected = categories.find(c => c._id === e.target.value)
                  setFormData(prev => ({
                    ...prev,
                    categoryId: selected?._id || '',
                    category: selected?.name || e.target.value,
                  }))
                }}
                className={`${inp} bg-white`}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 sm:mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Description *</label>
            <textarea required rows={4} value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={`${inp} resize-none`} placeholder="Describe your product..." />
          </div>
        </div>

        {/* ── Pricing ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-1">Base Pricing</h2>
          <p className="text-xs text-gray-500 mb-4">
            Product defaults. Individual images can override these in the image modal below.
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Retail Price (KSH) *</label>
                <input type="number" step="0.01" required value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className={inp} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Old / Compare Price (KSH)</label>
                <input type="number" step="0.01" value={formData.oldPrice}
                  onChange={e => setFormData(prev => ({ ...prev, oldPrice: parseFloat(e.target.value) || 0 }))}
                  className={inp} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Stock
                  <span className="ml-1 text-xs font-normal text-gray-400">(or set per-image below)</span>
                </label>
                <input type="number" value={formData.stockQuantity}
                  onChange={e => setFormData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                  className={inp} placeholder="0" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Wholesale Pricing (Optional)</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Wholesale Price (KSH)</label>
                  <input type="number" step="0.01" value={formData.wholesalePrice}
                    onChange={e => setFormData(prev => ({ ...prev, wholesalePrice: parseFloat(e.target.value) || 0 }))}
                    className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Quantity for Wholesale</label>
                  <input type="number" value={formData.wholesaleThreshold}
                    onChange={e => setFormData(prev => ({ ...prev, wholesaleThreshold: parseInt(e.target.value) || 0 }))}
                    className={inp} placeholder="10" />
                </div>
              </div>
              {formData.price > 0 && formData.wholesalePrice > 0 && formData.wholesaleThreshold > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-xs sm:text-sm text-green-800">
                    <strong>Wholesale Savings:</strong> KSH {(formData.price - formData.wholesalePrice).toFixed(2)} per unit
                    ({Math.round(((formData.price - formData.wholesalePrice) / formData.price) * 100)}% off)
                    when buying {formData.wholesaleThreshold}+ units
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Base Sizes ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-1">Base Sizes</h2>
          <p className="text-xs text-gray-500 mb-4">
            Default sizes. Each image can define its own per-size stock in the image modal.
          </p>
          <div className="flex gap-2 mb-3">
            <input type="text" value={newSize}
              onChange={e => setNewSize(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSize(newSize) } }}
              className={`flex-1 ${inp}`}
              placeholder="e.g. S, M, L, XL  (comma-separated)" />
            <Button type="button" onClick={() => addSize(newSize)} disabled={!newSize.trim()} className="flex-shrink-0">
              Add
            </Button>
          </div>
          {formData.sizes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.sizes.map((size, i) => (
                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {size}
                  <button type="button"
                    onClick={() => setFormData(prev => ({ ...prev, sizes: prev.sizes.filter((_, j) => j !== i) }))}
                    className="ml-1.5 text-purple-600 hover:text-purple-900 leading-none">×</button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No sizes set — leave blank for free-size products</p>
          )}
        </div>

        {/* ── Product Images ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-1">Product Images</h2>
          <p className="text-xs text-gray-500 mb-4">
            Each image is a selectable design variant. Click the <strong>edit</strong> icon to set per-image
            stock (including per-size), pricing, and SKU.
          </p>

          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
              {formData.images.map((img, index) => {
                const badge = imageBadge(img)
                return (
                  <div key={index} className="group relative">
                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-blue-400 transition-all">
                      <img src={img.url} alt={`Design ${index + 1}`} className="h-full w-full object-cover" />

                      {/* Remove */}
                      <button type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow">
                        <X className="h-3 w-3" />
                      </button>

                      {/* Edit */}
                      <button type="button"
                        onClick={() => setEditModalIndex(index)}
                        className="absolute bottom-1 right-1 bg-white/90 text-gray-700 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 hover:text-white shadow"
                        title="Edit image settings">
                        <Pencil className="h-3 w-3" />
                      </button>

                      {/* Main badge */}
                      {index === 0 && (
                        <div className="absolute top-1 left-1 bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                          Main
                        </div>
                      )}

                      {/* Override summary */}
                      {badge && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-xs font-medium text-center py-0.5 px-1 leading-tight truncate">
                          {badge}
                        </div>
                      )}
                    </div>

                    <button type="button"
                      onClick={() => setEditModalIndex(index)}
                      className="mt-1 w-full text-xs text-blue-600 hover:text-blue-800 text-center hover:underline">
                      Edit settings
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Upload zone */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-400 transition-colors"
            onDrop={e => { e.preventDefault(); handleImageUpload({ target: { files: e.dataTransfer.files } } as any) }}
            onDragOver={e => e.preventDefault()}
          >
            {imageUploading ? (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                <p className="text-sm text-blue-600">Uploading images...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500 font-medium text-sm">Click to upload</span>
                  <span className="text-gray-500 text-sm"> or drag and drop</span>
                  <input type="file" className="sr-only" multiple accept="image/*"
                    onChange={handleImageUpload} disabled={imageUploading} />
                </label>
                <p className="text-xs text-gray-500">PNG, JPG, WebP up to 10MB · First image is the main image</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Tags ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-1">Tags</h2>
          <p className="text-xs text-gray-500 mb-4">Used for search and filtering. Separate with commas.</p>
          <div className="flex gap-2 mb-3">
            <input type="text" value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(newTag) } }}
              className={`flex-1 ${inp}`}
              placeholder="e.g. silk, lace, sleepwear (comma-separated)" />
            <Button type="button" onClick={() => addTag(newTag)} disabled={!newTag.trim()} className="flex-shrink-0">
              Add
            </Button>
          </div>
          {formData.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {formData.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {tag}
                  <button type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, j) => j !== i) }))}
                    className="ml-1.5 text-blue-600 hover:text-blue-900 leading-none">×</button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No tags set</p>
          )}
        </div>

        {/* ── Product Settings ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Product Settings</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
            {([
              ['isActive', 'Active'],
              ['isFeatured', 'Featured'],
              ['isNewProduct', 'New Product'],
              ['isBestseller', 'Bestseller'],
            ] as [keyof typeof formData, string][]).map(([field, label]) => (
              <label key={field} className="flex items-center">
                <input type="checkbox" checked={formData[field] as boolean}
                  onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.checked }))}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded mr-2 flex-shrink-0" />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>

          <label className="flex items-center mb-4">
            <input type="checkbox" checked={formData.isFlashDeal}
              onChange={e => setFormData(prev => ({ ...prev, isFlashDeal: e.target.checked }))}
              className="h-5 w-5 text-blue-600 border-gray-300 rounded mr-2 flex-shrink-0" />
            <span className="text-sm">Flash Deal</span>
          </label>
          {formData.isFlashDeal && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Flash Deal Discount (%)</label>
              <input type="number" min="0" max="100" value={formData.flashDealDiscount}
                onChange={e => setFormData(prev => ({ ...prev, flashDealDiscount: parseInt(e.target.value) || 0 }))}
                className={inp} />
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white p-4 sm:p-6 shadow-lg border-t border-gray-200 -mx-4 sm:-mx-6">
          <Link href="/admin/products" className="w-full sm:w-auto">
            <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? 'Updating...' : 'Update Product'}
          </Button>
        </div>

      </form>

      {/* ── Image Edit Modal ── */}
      <ImageEditModal
        open={editModalIndex !== null}
        image={editModalIndex !== null ? formData.images[editModalIndex] : null}
        imageIndex={editModalIndex ?? 0}
        defaultPrice={formData.price || undefined}
        defaultWholesalePrice={formData.wholesalePrice || undefined}
        defaultWholesaleThreshold={formData.wholesaleThreshold || undefined}
        defaultSizes={formData.sizes}
        onSave={handleImageSave}
        onClose={() => setEditModalIndex(null)}
      />

      {/* ── Quick Category Modal ── */}
      <QuickCategoryModal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCreated={handleCategoryCreated}
      />
    </div>
  )
}
