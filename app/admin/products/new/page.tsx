'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, X, Pencil, Plus } from 'lucide-react'
import Link from 'next/link'
import { ICategory } from '@/models/Category'
import { IProductImage } from '@/models/Product'
import ImageEditModal from '@/components/admin/image-edit-modal'
import QuickCategoryModal from '@/components/admin/quick-category-modal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

// ─── helpers ──────────────────────────────────────────────────────────────────

function imageBadge(img: IProductImage): string {
  const parts: string[] = []
  if (img.groupId) parts.push('Grouped')
  if (img.price != null) parts.push(`KSH ${img.price.toLocaleString()}`)
  if (img.sku) parts.push(img.sku)
  return parts.join(' · ')
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading]             = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [categories, setCategories]       = useState<ICategory[]>([])
  const [branches, setBranches]           = useState<Array<{ _id: string; name: string; branchCode: string; isMainBranch: boolean }>>([])
  const [vendors, setVendors]             = useState<Array<{ _id: string; name: string; vendorCode: string; isHouseStock: boolean }>>([])

  // Modal state
  const [editModalIndex, setEditModalIndex]     = useState<number | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showGroupDialog, setShowGroupDialog]   = useState(false)
  const [groupSourceIndex, setGroupSourceIndex] = useState<number | null>(null)
  const [groupTargetIndex, setGroupTargetIndex] = useState<number | null>(null)

  // Drag state for image grouping
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const [newTag, setNewTag]   = useState('')
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
    branchId: '', // Branch selection
    vendorId: '', // NEW: Vendor selection
    stockQuantity: '', // Initial stock for selected branch and vendor
    tags: [] as string[],
    isActive: true,
    isFeatured: false,
    isNewProduct: false,
    isBestseller: false,
    isFlashDeal: false,
    flashDealDiscount: '',
  })

  useEffect(() => { 
    fetchCategories()
    fetchBranches()
    fetchVendors()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) setCategories(await res.json())
    } catch { /* silent */ }
  }

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/admin/branches')
      if (res.ok) {
        const data = await res.json()
        const activeBranches = (data.branches || []).filter((b: any) => b.isActive)
        setBranches(activeBranches)
        
        // Auto-select main branch if available
        const mainBranch = activeBranches.find((b: any) => b.isMainBranch)
        if (mainBranch) {
          setFormData(prev => ({ ...prev, branchId: mainBranch._id }))
        }
      }
    } catch { /* silent */ }
  }

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/admin/vendors')
      if (res.ok) {
        const data = await res.json()
        const activeVendors = (data.vendors || []).filter((v: any) => v.isActive)
        setVendors(activeVendors)
        
        // Auto-select House Stock vendor if available
        const houseVendor = activeVendors.find((v: any) => v.isHouseStock)
        if (houseVendor) {
          setFormData(prev => ({ ...prev, vendorId: houseVendor._id }))
        }
      }
    } catch { /* silent */ }
  }

  const handleCategoryChange = (categoryId: string) => {
    const cat = categories.find(c => c._id === categoryId)
    setFormData(prev => ({ ...prev, categoryId, category: cat?.name || '' }))
  }

  const handleCategoryCreated = (cat: ICategory) => {
    setCategories(prev => [...prev, cat])
    setFormData(prev => ({ ...prev, categoryId: cat._id!, category: cat.name }))
  }

  // ── Image upload ─────────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setImageUploading(true)
    try {
      const settingsRes = await fetch('/api/admin/settings')
      const settings = settingsRes.ok ? await settingsRes.json() : null
      const wmText     = settings?.watermarkEnabled && settings?.watermarkText ? settings.watermarkText : ''
      const wmPosition = settings?.watermarkPosition || 'bottom-right'
      const wmOpacity  = settings?.watermarkOpacity ?? 0.7

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
    if (editModalIndex === index) setEditModalIndex(null)
  }

  const handleImageSave = (index: number, updated: IProductImage) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? updated : img),
    }))
  }

  // ── Image Grouping ─────────────────────────────────────────────────────────────
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      setGroupTargetIndex(index)
    }
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) return
    
    setGroupSourceIndex(draggedIndex)
    setGroupTargetIndex(targetIndex)
    setShowGroupDialog(true)
    setDraggedIndex(null)
  }

  const handleCreateGroup = () => {
    if (groupSourceIndex === null || groupTargetIndex === null) return
    
    const newGroupId = `group-${Date.now()}`
    const sourceImage = formData.images[groupSourceIndex]
    const targetImage = formData.images[groupTargetIndex]
    
    // If target already has a group, use that groupId
    const existingGroupId = targetImage.groupId
    const finalGroupId = existingGroupId || newGroupId
    
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => {
        if (i === groupSourceIndex) {
          return { ...img, groupId: finalGroupId }
        }
        if (i === groupTargetIndex && !existingGroupId) {
          return { ...img, groupId: finalGroupId }
        }
        return img
      }),
    }))
    
    setShowGroupDialog(false)
    setGroupSourceIndex(null)
    setGroupTargetIndex(null)
  }

  const handleUngroup = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => {
        if (i === index) {
          return { ...img, groupId: undefined }
        }
        return img
      }),
    }))
  }

  // Get representative images (first image from each group)
  const getRepresentativeImages = () => {
    const groups = formData.images.reduce((acc, img, index) => {
      const groupId = img.groupId || `ungrouped-${index}`
      if (!acc[groupId]) {
        acc[groupId] = { image: img, index, count: 0 }
      }
      acc[groupId].count++
      return acc
    }, {} as Record<string, { image: IProductImage; index: number; count: number }>)
    
    return Object.values(groups).map(({ image, index, count }) => ({ image, index, count }))
  }

  // ── Tags / sizes ──────────────────────────────────────────────────────────────
  const addTag = () => {
    const items = newTag.split(',').map(s => s.trim()).filter(Boolean)
    if (!items.length) return
    setFormData(prev => ({ ...prev, tags: [...new Set([...prev.tags, ...items])] }))
    setNewTag('')
  }

  const addSize = () => {
    const items = newSize.split(',').map(s => s.trim()).filter(Boolean)
    if (!items.length) return
    setFormData(prev => ({ ...prev, sizes: [...new Set([...prev.sizes, ...items])] }))
    setNewSize('')
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.price || formData.images.length === 0) {
      alert('Please set a price and upload at least one image.')
      return
    }
    if (!formData.branchId) {
      alert('Please select a branch for this product.')
      return
    }
    if (!formData.vendorId) {
      alert('Please select a vendor for this product.')
      return
    }
    const stockQty = parseInt(formData.stockQuantity)
    if (isNaN(stockQty) || stockQty < 0) {
      alert('Please set a valid initial stock quantity.')
      return
    }
    setLoading(true)

    const slug = formData.name
      .toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()

    // Derive total stock: sum per-image stock if any image has it set
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
      branchId: formData.branchId,
      vendorId: formData.vendorId,
      initialStock: parseInt(formData.stockQuantity) || 0, // Pass initial stock for branch
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

  const inp = 'w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'

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

        {/* ── Branch Selection ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Branch & Vendor Selection</h2>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
            <div>
              <Label>Branch *</Label>
              <Select 
                value={formData.branchId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, branchId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch._id} value={branch._id}>
                      {branch.name} ({branch.branchCode})
                      {branch.isMainBranch && ' - Main Branch'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Physical location where initial stock will be stored.
              </p>
            </div>
            
            <div>
              <Label>Vendor (Stock Owner) *</Label>
              <Select 
                value={formData.vendorId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, vendorId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map(vendor => (
                    <SelectItem key={vendor._id} value={vendor._id}>
                      {vendor.name} ({vendor.vendorCode})
                      {vendor.isHouseStock && ' - House Stock'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Who owns this inventory. Initial stock will belong to this vendor.
              </p>
            </div>
          </div>
        </div>

        {/* ── Basic Information ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
              <input type="text" required value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={inp} placeholder="e.g., Satin 5pcs Pajama Set" />
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
                value={formData.categoryId}
                onChange={e => handleCategoryChange(e.target.value)}
                className={`${inp} bg-white`}
              >
                <option value="">Select a category</option>
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
              className={`${inp} resize-none`}
              placeholder="Describe the style, material, and care instructions..." />
          </div>
        </div>

        {/* ── Pricing ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-1">Base Pricing</h2>
          <p className="text-xs text-gray-500 mb-4">
            These are the product defaults. Individual images can override price, stock, and sizes in the modal below.
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Retail Price (KSH) *</label>
                <input type="number" step="0.01" required value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className={inp} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Old / Compare Price (KSH)</label>
                <input type="number" step="0.01" value={formData.oldPrice}
                  onChange={e => setFormData(prev => ({ ...prev, oldPrice: e.target.value }))}
                  className={inp} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Stock *
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    (for selected branch + vendor)
                  </span>
                </label>
                <input type="number" value={formData.stockQuantity}
                  onChange={e => setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))}
                  className={inp} placeholder="0" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Wholesale Pricing (Optional)</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Wholesale Price (KSH)</label>
                  <input type="number" step="0.01" value={formData.wholesalePrice}
                    onChange={e => setFormData(prev => ({ ...prev, wholesalePrice: e.target.value }))}
                    className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Quantity for Wholesale</label>
                  <input type="number" value={formData.wholesaleThreshold}
                    onChange={e => setFormData(prev => ({ ...prev, wholesaleThreshold: e.target.value }))}
                    className={inp} placeholder="10" />
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
            Default sizes for this product.
          </p>
          <div className="flex gap-2 mb-3">
            <input type="text" value={newSize}
              onChange={e => setNewSize(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSize() } }}
              className={`flex-1 ${inp}`}
              placeholder="e.g. S, M, L, XL  (comma-separated)" />
            <Button type="button" onClick={addSize} disabled={!newSize.trim()} className="flex-shrink-0">Add</Button>
          </div>
          {formData.sizes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.sizes.map((size, i) => (
                <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {size}
                  <button type="button"
                    onClick={() => setFormData(prev => ({ ...prev, sizes: prev.sizes.filter((_, j) => j !== i) }))}
                    className="ml-1 text-purple-600 hover:text-purple-900">×</button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No sizes set — add above or leave blank for free-size products</p>
          )}
        </div>

        {/* ── Product Images ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-1">Product Images *</h2>
          <p className="text-xs text-gray-500 mb-4">
            Each image is a selectable design variant. Drag one image onto another to group them (front/back/side views). 
            Click the <strong>edit</strong> icon to set per-image pricing and SKU.
          </p>

          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
              {getRepresentativeImages().map(({ image, index, count }) => {
                const badge = imageBadge(image)
                const isGrouped = !!image.groupId
                return (
                  <div key={index} className="group relative">
                    <div 
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        isGrouped ? 'border-purple-400' : 'border-gray-200 group-hover:border-blue-400'
                      } ${groupTargetIndex === index ? 'border-green-400 scale-105' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onClick={() => setEditModalIndex(index)}
                    >
                      <img src={image.url} alt={`Design ${index + 1}`} className="h-full w-full object-cover" />

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(index) }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow"
                      >
                        <X className="h-3 w-3" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setEditModalIndex(index) }}
                        className="absolute bottom-1 right-1 bg-white/90 text-gray-700 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 hover:text-white shadow"
                        title="Edit image settings"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>

                      {/* Main badge */}
                      {index === 0 && (
                        <div className="absolute top-1 left-1 bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                          Main
                        </div>
                      )}

                      {/* Group count indicator */}
                      {isGrouped && count > 1 && (
                        <div className="absolute top-1 right-10 bg-purple-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                          {count} images
                        </div>
                      )}

                      {/* Override summary */}
                      {badge && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-xs font-medium text-center py-0.5 px-1 leading-tight truncate">
                          {badge}
                        </div>
                      )}
                    </div>
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
              <label className="cursor-pointer">
                <div className="space-y-2">
                  <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                  <div>
                    <span className="text-blue-600 hover:text-blue-500 font-medium text-sm">Click to upload</span>
                    <span className="text-gray-500 text-sm"> or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, WebP up to 10MB · First image is the main image</p>
                </div>
                <input type="file" className="sr-only" multiple accept="image/*"
                  onChange={handleImageUpload} disabled={imageUploading} />
              </label>
            )}
          </div>
        </div>

        {/* ── Tags ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-1">Tags</h2>
          <p className="text-xs text-gray-500 mb-4">Used for search and filtering. Separate with commas.</p>
          <div className="flex gap-2 mb-2">
            <input type="text" value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              className={`flex-1 ${inp}`}
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
                  className={inp} placeholder="0" />
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
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
          <Link href="/admin/products" className="w-full sm:w-auto">
            <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading || formData.images.length === 0} className="w-full sm:w-auto">
            {loading ? 'Creating...' : 'Create Product'}
          </Button>
        </div>

      </form>

      {/* ── Image Edit Modal ── */}
      <ImageEditModal
        open={editModalIndex !== null}
        image={editModalIndex !== null ? formData.images[editModalIndex] : null}
        allImages={formData.images}
        imageIndex={editModalIndex ?? 0}
        defaultPrice={formData.price ? parseFloat(formData.price) : undefined}
        defaultWholesalePrice={formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : undefined}
        defaultWholesaleThreshold={formData.wholesaleThreshold ? parseInt(formData.wholesaleThreshold) : undefined}
        defaultSizes={formData.sizes}
        onSave={handleImageSave}
        onClose={() => setEditModalIndex(null)}
        onUngroup={handleUngroup}
      />

      {/* ── Quick Category Modal ── */}
      <QuickCategoryModal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCreated={handleCategoryCreated}
      />

      {/* ── Image Grouping Dialog ── */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Group Images Together?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Do you want to group these images together? This means they will be treated as the same variant 
              (e.g., front and back views of the same design). Customers will see all images in the group, but 
              selecting any will choose the same item.
            </p>
            <div className="mt-4 flex gap-4">
              {groupSourceIndex !== null && (
                <img 
                  src={formData.images[groupSourceIndex].url} 
                  alt="Source" 
                  className="w-20 h-20 object-cover rounded border"
                />
              )}
              <span className="text-2xl">→</span>
              {groupTargetIndex !== null && (
                <img 
                  src={formData.images[groupTargetIndex].url} 
                  alt="Target" 
                  className="w-20 h-20 object-cover rounded border"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup}>Group Images</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
