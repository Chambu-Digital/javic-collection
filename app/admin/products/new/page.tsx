'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { ICategory } from '@/models/Category'
import { IProductImage } from '@/models/Product'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [categories, setCategories] = useState<ICategory[]>([])
  // index of the image whose price input is open (-1 = none)
  const [priceEditIndex, setPriceEditIndex] = useState(-1)
  const [newTag, setNewTag] = useState('')
  const [newSize, setNewSize] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    oldPrice: '',
    wholesalePrice: '',
    wholesaleThreshold: '',
    images: [] as IProductImage[],
    sizes: [] as string[],
    category: '',
    categoryId: '',
    stockQuantity: '',
    tags: [] as string[],
    isActive: true,
    isFeatured: false,
    isNewProduct: false,
    isBestseller: false,
    isFlashDeal: false,
    flashDealDiscount: '',
  })

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) setCategories(await res.json())
    } catch { /* silent */ }
  }

  const handleCategoryChange = (categoryId: string) => {
    const cat = categories.find(c => c._id === categoryId)
    setFormData(prev => ({ ...prev, categoryId, category: cat?.name || '' }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setImageUploading(true)
    try {
      // Fetch watermark settings once before parallel uploads
      const settingsRes = await fetch('/api/admin/settings')
      const settings = settingsRes.ok ? await settingsRes.json() : null
      const wmText = settings?.watermarkEnabled && settings?.watermarkText ? settings.watermarkText : ''
      const wmPosition = settings?.watermarkPosition || 'bottom-right'
      const wmOpacity = settings?.watermarkOpacity ?? 0.7

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
      setFormData(prev => ({ ...prev, images: [...prev.images, ...urls.map(url => ({ url }))] }))
    } catch {
      alert('Failed to upload some images')
    } finally {
      setImageUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
    if (priceEditIndex === index) setPriceEditIndex(-1)
  }

  const setImageOverride = (index: number, field: keyof IProductImage, value: any) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) =>
        i === index ? { ...img, [field]: value } : img
      ),
    }))
  }

  const addTag = () => {
    const items = newTag.split(',').map(s => s.trim()).filter(Boolean)
    if (!items.length) return
    setFormData(prev => ({ ...prev, tags: [...prev.tags, ...items] }))
    setNewTag('')
  }

  const addSize = () => {
    const items = newSize.split(',').map(s => s.trim()).filter(Boolean)
    if (!items.length) return
    setFormData(prev => ({ ...prev, sizes: [...new Set([...prev.sizes, ...items])] }))
    setNewSize('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.price || formData.images.length === 0) {
      alert('Please set a price and upload at least one image.')
      return
    }
    setLoading(true)

    const slug = formData.name.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
    // If any image has a per-design stock override, sum them as the product total
    const imagesWithStock = formData.images.filter(img => img.stock != null)
    const derivedStock = imagesWithStock.length > 0
      ? formData.images.reduce((sum, img) => sum + (img.stock ?? 0), 0)
      : parseInt(formData.stockQuantity) || 0

    const productData = {
      name: formData.name,
      slug,
      description: formData.description,
      price: parseFloat(formData.price),
      oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : undefined,
      wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : undefined,
      wholesaleThreshold: formData.wholesaleThreshold ? parseInt(formData.wholesaleThreshold) : undefined,
      images: formData.images,
      sizes: formData.sizes,
      category: formData.category,
      categoryId: formData.categoryId,
      stockQuantity: derivedStock,
      inStock: derivedStock > 0,
      tags: formData.tags,
      isActive: formData.isActive,
      isFeatured: formData.isFeatured,
      isNewProduct: formData.isNewProduct,
      isBestseller: formData.isBestseller,
      isFlashDeal: formData.isFlashDeal,
      flashDealDiscount: formData.flashDealDiscount ? parseFloat(formData.flashDealDiscount) : undefined,
      rating: 0,
      reviews: 0,
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })
      if (res.ok) {
        router.push('/admin/products')
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to create product')
      }
    } catch {
      alert('Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  const input = 'w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <Link href="/admin/products" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-sm sm:text-base">Back to Products</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-sm text-gray-600 mt-1">Create a new product listing with all the details.</p>
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
                className={input} placeholder="e.g., Satin 5pcs Pajama Set" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select required value={formData.categoryId}
                onChange={e => handleCategoryChange(e.target.value)}
                className={`${input} bg-white`}>
                <option value="">Select a category</option>
                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 sm:mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Description *</label>
            <textarea required rows={4} value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={`${input} resize-none`}
              placeholder="Describe the style, material, and care instructions..." />
          </div>
        </div>

        {/* ── Pricing ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Base Pricing</h2>
          <p className="text-xs text-gray-500 mb-4">
            These are the product defaults. Individual images can optionally override the retail price below.
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Retail Price (KSH) *</label>
                <input type="number" step="0.01" required value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className={input} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Old Price (KSH)</label>
                <input type="number" step="0.01" value={formData.oldPrice}
                  onChange={e => setFormData(prev => ({ ...prev, oldPrice: e.target.value }))}
                  className={input} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
                <input type="number" required value={formData.stockQuantity}
                  onChange={e => setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))}
                  className={input} placeholder="0" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Wholesale Pricing (Optional)</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Wholesale Price (KSH)</label>
                  <input type="number" step="0.01" value={formData.wholesalePrice}
                    onChange={e => setFormData(prev => ({ ...prev, wholesalePrice: e.target.value }))}
                    className={input} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Quantity for Wholesale</label>
                  <input type="number" value={formData.wholesaleThreshold}
                    onChange={e => setFormData(prev => ({ ...prev, wholesaleThreshold: e.target.value }))}
                    className={input} placeholder="10" />
                </div>
              </div>
              {formData.price && formData.wholesalePrice && formData.wholesaleThreshold && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-xs sm:text-sm text-green-800">
                    <strong>Wholesale Savings:</strong> KSH {(parseFloat(formData.price) - parseFloat(formData.wholesalePrice)).toFixed(2)} per unit
                    ({Math.round(((parseFloat(formData.price) - parseFloat(formData.wholesalePrice)) / parseFloat(formData.price)) * 100)}% off)
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
            Default sizes for this product. All image variants inherit these unless overridden later.
          </p>
          <div className="flex gap-2 mb-3">
            <input type="text" value={newSize}
              onChange={e => setNewSize(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSize() } }}
              className={`flex-1 ${input}`}
              placeholder="e.g. S, M, L, XL  or  S-XL  (comma-separated)" />
            <Button type="button" onClick={addSize} disabled={!newSize.trim()} className="flex-shrink-0">Add</Button>
          </div>
          {formData.sizes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.sizes.map((size, i) => (
                <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {size}
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, sizes: prev.sizes.filter((_, j) => j !== i) }))}
                    className="ml-1 text-purple-600 hover:text-purple-900">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Images ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-1">Product Images *</h2>
          <p className="text-xs text-gray-500 mb-4">
            Each image represents a distinct design variant. Click an image to optionally set a price override — leave blank to use the base retail price.
          </p>

          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
              {formData.images.map((img, index) => (
                <div key={index}>
                  <div
                    className={`relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      priceEditIndex === index ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-400'
                    }`}
                    onClick={() => setPriceEditIndex(priceEditIndex === index ? -1 : index)}
                  >
                    <img src={img.url} alt={`Product ${index + 1}`} className="h-full w-full object-cover" />

                    {/* Remove */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button"
                        onClick={e => { e.stopPropagation(); removeImage(index) }}
                        className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow">
                        <X className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Main badge */}
                    {index === 0 && (
                      <div className="absolute top-1 left-1 bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">Main</div>
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

                  {/* Inline price editor */}
                  {/* Inline override editor */}
                  {priceEditIndex === index && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                      <p className="text-xs font-semibold text-blue-900">
                        Overrides for Design {index + 1}
                        <span className="ml-1 font-normal text-blue-600">— leave blank to use product defaults</span>
                      </p>

                      {/* Stock — first because most commonly edited */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Stock for this design</label>
                        <input type="number" min="0"
                          placeholder="e.g. 10"
                          value={img.stock ?? ''}
                          onChange={e => setImageOverride(index, 'stock', e.target.value === '' ? undefined : parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Retail Price (KSH)</label>
                        <input type="number" step="0.01" min="0"
                          placeholder={`Default: KSH ${formData.price || '—'}`}
                          value={img.price ?? ''}
                          onChange={e => setImageOverride(index, 'price', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          className="w-full px-2 py-1.5 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Wholesale Price (KSH)</label>
                        <input type="number" step="0.01" min="0"
                          placeholder={formData.wholesalePrice ? `Default: KSH ${formData.wholesalePrice}` : 'e.g. 900'}
                          value={img.wholesalePrice ?? ''}
                          onChange={e => setImageOverride(index, 'wholesalePrice', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          className="w-full px-2 py-1.5 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Min Qty for Wholesale</label>
                        <input type="number" min="1"
                          placeholder={formData.wholesaleThreshold ? `Default: ${formData.wholesaleThreshold}` : 'e.g. 5'}
                          value={img.wholesaleThreshold ?? ''}
                          onChange={e => setImageOverride(index, 'wholesaleThreshold', e.target.value === '' ? undefined : parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Available Sizes <span className="text-gray-400">default: base sizes</span>
                        </label>
                        <div className="flex gap-1.5 mb-2 flex-wrap">
                          {(img.sizes ?? []).map((s, si) => (
                            <span key={si} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {s}
                              <button type="button"
                                onClick={() => {
                                  const next = (img.sizes ?? []).filter((_, j) => j !== si)
                                  setImageOverride(index, 'sizes', next.length ? next : undefined)
                                }}
                                className="ml-1 text-purple-600 hover:text-purple-900">×</button>
                            </span>
                          ))}
                        </div>
                        <input type="text"
                          placeholder="e.g. S,M,L — press Enter or comma to add"
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault()
                              const val = (e.target as HTMLInputElement).value.trim().replace(/,$/, '')
                              if (!val) return
                              const newSizes = [...(img.sizes ?? []), ...val.split(',').map(s => s.trim()).filter(Boolean)]
                              setImageOverride(index, 'sizes', [...new Set(newSizes)])
                              ;(e.target as HTMLInputElement).value = ''
                            }
                          }}
                          onBlur={e => {
                            const val = e.target.value.trim()
                            if (!val) return
                            const newSizes = [...(img.sizes ?? []), ...val.split(',').map(s => s.trim()).filter(Boolean)]
                            setImageOverride(index, 'sizes', [...new Set(newSizes)])
                            e.target.value = ''
                          }}
                          className="w-full px-2 py-1.5 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">SKU (optional)</label>
                        <input type="text" placeholder="e.g. JAV-001-RED"
                          value={img.sku ?? ''}
                          onChange={e => setImageOverride(index, 'sku', e.target.value || undefined)}
                          className="w-full px-2 py-1.5 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>

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

        {/* ── Product Details ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Product Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                className={`flex-1 ${input}`}
                placeholder="e.g., cotton, comfortable, sleepwear (comma-separated)" />
              <Button type="button" onClick={addTag} disabled={!newTag.trim()} className="flex-shrink-0">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {formData.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {tag}
                  <button type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, j) => j !== i) }))}
                    className="ml-1 text-blue-600 hover:text-blue-800">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Product Settings ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Product Settings</h2>

          <div className="mb-6">
            <label className="flex items-center mb-4">
              <input type="checkbox" checked={formData.isFlashDeal}
                onChange={e => setFormData(prev => ({ ...prev, isFlashDeal: e.target.checked }))}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded mr-2 flex-shrink-0" />
              <span className="text-sm">Flash Deal</span>
            </label>
            {formData.isFlashDeal && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount Percentage</label>
                <input type="number" min="0" max="100" value={formData.flashDealDiscount}
                  onChange={e => setFormData(prev => ({ ...prev, flashDealDiscount: e.target.value }))}
                  className={input} placeholder="0" />
              </div>
            )}
          </div>

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
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded flex-shrink-0" />
                <span className="ml-2 text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3 pt-4 border-t border-gray-200">
          <Link href="/admin/products" className="w-full sm:w-auto">
            <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading || formData.images.length === 0} className="w-full sm:w-auto">
            {loading ? 'Creating...' : 'Create Product'}
          </Button>
        </div>

      </form>
    </div>
  )
}
