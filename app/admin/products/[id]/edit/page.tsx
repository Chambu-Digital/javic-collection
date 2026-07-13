'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { IProduct, IProductImage } from '@/models/Product'
import { ICategory } from '@/models/Category'

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [categories, setCategories] = useState<ICategory[]>([])
  const [product, setProduct] = useState<IProduct | null>(null)
  const [newTag, setNewTag] = useState('')
  const [newSize, setNewSize] = useState('')
  // index of the image whose price input is open (-1 = none)
  const [priceEditIndex, setPriceEditIndex] = useState(-1)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    oldPrice: 0,
    wholesalePrice: 0,
    wholesaleThreshold: 0,
    category: '',
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
  }, [resolvedParams.id])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
        setFormData({
          name: data.name || '',
          description: data.description || '',
          price: data.price || 0,
          oldPrice: data.oldPrice || 0,
          wholesalePrice: data.wholesalePrice || 0,
          wholesaleThreshold: data.wholesaleThreshold || 0,
          category: data.category || '',
          stockQuantity: data.stockQuantity || 0,
          // Normalise legacy string[] products → {url} objects
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
    } catch (error) {
      console.error('Error fetching product:', error)
      alert('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?includeInactive=true')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (formData.images.length === 0) {
      alert('Please upload at least one image.')
      setSaving(false)
      return
    }

    // If any image has a per-design stock override, sum them as the product total.
    // Images without an override contribute 0 to the sum (they inherit from the total).
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
      const response = await fetch(`/api/products/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        alert('Product updated successfully!')
        router.push('/admin/products')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update product')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setImageUploading(true)
    try {
      // Fetch watermark settings once before the loop so parallel uploads
      // all use the same settings without racing each other on the DB
      const settingsRes = await fetch('/api/admin/settings')
      const settings = settingsRes.ok ? await settingsRes.json() : null
      const wmText = settings?.watermarkEnabled && settings?.watermarkText ? settings.watermarkText : ''
      const wmPosition = settings?.watermarkPosition || 'bottom-right'
      const wmOpacity = settings?.watermarkOpacity ?? 0.7

      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
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
        })
      )
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls.map(url => ({ url }))],
      }))
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Failed to upload some images')
    } finally {
      setImageUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
    if (priceEditIndex === index) setPriceEditIndex(-1)
  }

  const setImagePrice = (index: number, field: keyof IProductImage, value: any) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) =>
        i === index ? { ...img, [field]: value } : img
      ),
    }))
  }

  const addTag = (value: string) => {
    if (!value.trim()) return
    const items = value.split(',').map(s => s.trim()).filter(Boolean)
    setFormData(prev => ({ ...prev, tags: [...new Set([...prev.tags, ...items])] }))
    setNewTag('')
  }

  const addSize = (value: string) => {
    if (!value.trim()) return
    const items = value.split(',').map(s => s.trim()).filter(Boolean)
    setFormData(prev => ({ ...prev, sizes: [...new Set([...prev.sizes, ...items])] }))
    setNewSize('')
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
        <div className="space-y-4">
          {Array(8).fill(0).map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded" />)}
        </div>
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

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <Link href="/admin/products" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-sm sm:text-base">Back to Products</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">Edit Product</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Update product information and settings</p>
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select required value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 sm:mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Description *</label>
            <textarea required rows={4} value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              placeholder="Describe your product..." />
          </div>
        </div>

        {/* ── Pricing ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Pricing</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Retail Price (KSH) *</label>
                <input type="number" step="0.01" required value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Old Price (KSH)</label>
                <input type="number" step="0.01" value={formData.oldPrice}
                  onChange={e => setFormData(prev => ({ ...prev, oldPrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
                <input type="number" required value={formData.stockQuantity}
                  onChange={e => setFormData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="0" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Wholesale Pricing (Optional)</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Wholesale Price (KSH)</label>
                  <input type="number" step="0.01" value={formData.wholesalePrice}
                    onChange={e => setFormData(prev => ({ ...prev, wholesalePrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Quantity for Wholesale</label>
                  <input type="number" value={formData.wholesaleThreshold}
                    onChange={e => setFormData(prev => ({ ...prev, wholesaleThreshold: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="10" />
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
            Default sizes available for this product. All image variants inherit these unless overridden later.
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newSize}
              onChange={e => setNewSize(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSize(newSize) } }}
              className="flex-1 px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g. S, M, L, XL  or  Free Size  (comma-separated)"
            />
            <Button type="button" onClick={() => addSize(newSize)} disabled={!newSize.trim()} className="flex-shrink-0">
              Add
            </Button>
          </div>
          {formData.sizes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.sizes.map((size, i) => (
                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {size}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, sizes: prev.sizes.filter((_, j) => j !== i) }))}
                    className="ml-1.5 text-purple-600 hover:text-purple-900 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No sizes set — add sizes above or leave blank for free-size products</p>
          )}
        </div>

        {/* ── Tags ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-1">Tags</h2>
          <p className="text-xs text-gray-500 mb-4">
            Used for search and filtering. Separate multiple tags with commas.
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(newTag) } }}
              className="flex-1 px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g. silk, lace, sleepwear (comma-separated)"
            />
            <Button type="button" onClick={() => addTag(newTag)} disabled={!newTag.trim()} className="flex-shrink-0">
              Add
            </Button>
          </div>
          {formData.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {formData.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {tag}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, j) => j !== i) }))}
                    className="ml-1.5 text-blue-600 hover:text-blue-900 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No tags set</p>
          )}
        </div>

        {/* ── Product Images ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-1">Product Images</h2>
          <p className="text-xs text-gray-500 mb-4">
            Click an image to set per-design overrides (stock, price, sizes, etc.). Leave any field blank to inherit the product default.
          </p>

          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
              {formData.images.map((img, index) => (
                <div key={index}>
                  {/* Thumbnail */}
                  <div
                    className={`relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      priceEditIndex === index
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-400'
                    }`}
                    onClick={() => setPriceEditIndex(priceEditIndex === index ? -1 : index)}
                  >
                    <img src={img.url} alt={`Product ${index + 1}`} className="h-full w-full object-cover" />

                    {/* Remove button */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button"
                        onClick={e => { e.stopPropagation(); removeImage(index) }}
                        className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow">
                        <X className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Main badge */}
                    {index === 0 && (
                      <div className="absolute top-1 left-1 bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                        Main
                      </div>
                    )}

                    {/* Override summary badge */}
                    {(img.price != null || img.stock != null || img.sizes != null || img.sku) && (
                      <div className="absolute bottom-0 inset-x-0 bg-primary/90 text-primary-foreground text-xs font-semibold text-center py-0.5 leading-tight">
                        {[
                          img.price != null && `KSH ${img.price.toLocaleString()}`,
                          img.stock != null && `${img.stock} in stock`,
                          img.sizes?.length && img.sizes.join(', '),
                        ].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>

                  {/* Inline override editor */}
                  {priceEditIndex === index && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                      <p className="text-xs font-semibold text-blue-900">
                        Overrides for Design {index + 1}
                        <span className="ml-1 font-normal text-blue-600">— leave blank to use product defaults</span>
                      </p>

                      {/* Stock — first because most commonly edited */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Stock for this design <span className="text-gray-400">default: product total stock</span>
                        </label>
                        <input
                          type="number" min="0"
                          placeholder="e.g. 10"
                          value={img.stock ?? ''}
                          onChange={e => setImagePrice(index, 'stock', e.target.value === '' ? undefined : parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>

                      {/* Retail Price */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Retail Price (KSH) <span className="text-gray-400">default: {formData.price}</span>
                        </label>
                        <input
                          type="number" step="0.01" min="0"
                          placeholder={`${formData.price}`}
                          value={img.price ?? ''}
                          onChange={e => setImagePrice(index, 'price', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          className="w-full px-2 py-1.5 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>

                      {/* Wholesale Price */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Wholesale Price (KSH) <span className="text-gray-400">default: {formData.wholesalePrice || '—'}</span>
                        </label>
                        <input
                          type="number" step="0.01" min="0"
                          placeholder={formData.wholesalePrice ? `${formData.wholesalePrice}` : 'e.g. 900'}
                          value={img.wholesalePrice ?? ''}
                          onChange={e => setImagePrice(index, 'wholesalePrice', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          className="w-full px-2 py-1.5 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>

                      {/* Wholesale Threshold */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Min Qty for Wholesale <span className="text-gray-400">default: {formData.wholesaleThreshold || '—'}</span>
                        </label>
                        <input
                          type="number" min="1"
                          placeholder={formData.wholesaleThreshold ? `${formData.wholesaleThreshold}` : 'e.g. 5'}
                          value={img.wholesaleThreshold ?? ''}
                          onChange={e => setImagePrice(index, 'wholesaleThreshold', e.target.value === '' ? undefined : parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>

                      {/* Sizes */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Available Sizes <span className="text-gray-400">default: {formData.sizes.length ? formData.sizes.join(', ') : 'product base sizes'}</span>
                        </label>
                        <div className="flex gap-1.5 mb-2 flex-wrap">
                          {(img.sizes ?? []).map((s, si) => (
                            <span key={si} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {s}
                              <button type="button"
                                onClick={() => {
                                  const next = (img.sizes ?? []).filter((_, j) => j !== si)
                                  setImagePrice(index, 'sizes', next.length ? next : undefined)
                                }}
                                className="ml-1 text-purple-600 hover:text-purple-900">×</button>
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder={`e.g. S,M,L or leave blank to use base sizes`}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault()
                              const val = (e.target as HTMLInputElement).value.trim().replace(/,$/, '')
                              if (!val) return
                              const newSizes = [...(img.sizes ?? []), ...val.split(',').map(s => s.trim()).filter(Boolean)]
                              setImagePrice(index, 'sizes', [...new Set(newSizes)])
                              ;(e.target as HTMLInputElement).value = ''
                            }
                          }}
                          onBlur={e => {
                            const val = e.target.value.trim()
                            if (!val) return
                            const newSizes = [...(img.sizes ?? []), ...val.split(',').map(s => s.trim()).filter(Boolean)]
                            setImagePrice(index, 'sizes', [...new Set(newSizes)])
                            e.target.value = ''
                          }}
                          className="w-full px-2 py-1.5 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        {(img.sizes?.length ?? 0) > 0 && (
                          <button type="button" onClick={() => setImagePrice(index, 'sizes', undefined)}
                            className="text-xs text-red-500 hover:text-red-700 mt-1">
                            Remove override — use base sizes
                          </button>
                        )}
                      </div>

                      {/* SKU */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">SKU (optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. JAV-001-RED"
                          value={img.sku ?? ''}
                          onChange={e => setImagePrice(index, 'sku', e.target.value || undefined)}
                          className="w-full px-2 py-1.5 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>

                      {/* Clear all overrides */}
                      {(img.price != null || img.wholesalePrice != null || img.wholesaleThreshold != null || img.stock != null || img.sizes != null || img.sku) && (
                        <button type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            images: prev.images.map((im, i) => i === index ? { url: im.url } : im)
                          }))}
                          className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1 w-full">
                          Clear all overrides for this design
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
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
                <p className="text-xs text-gray-500">PNG, JPG, WebP up to 10MB • First image is the main image</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Product Settings ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Product Settings</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
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

          <div className="mt-4 sm:mt-6">
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            )}
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-4 sticky bottom-0 bg-white p-4 sm:p-6 shadow-lg border-t border-gray-200 -mx-4 sm:-mx-6">
          <Link href="/admin/products" className="w-full sm:w-auto">
            <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? 'Updating...' : 'Update Product'}
          </Button>
        </div>

      </form>
    </div>
  )
}
