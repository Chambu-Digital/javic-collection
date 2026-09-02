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
import { ReplaceImageButton } from '@/components/admin/replace-image-button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

// ─── helpers ──────────────────────────────────────────────────────────────────

function imageBadge(img: IProductImage, imgIndex: number, branchStocks: Record<string, any>, selectedBranchId: string): string {
  const parts: string[] = []
  if (img.groupId) parts.push('Grouped')
  
  // Display branch-specific stock
  const stockKey = `${selectedBranchId}-${imgIndex}`
  const branchStock = branchStocks[stockKey]
  const quantity = branchStock ? branchStock.quantity : 0
  parts.push(`Stock: ${quantity}`)
  
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
  const [branches, setBranches]             = useState<Array<{ _id: string; name: string; branchCode: string; isMainBranch: boolean }>>([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [vendors, setVendors]               = useState<Array<{ _id: string; name: string; isActive: boolean }>>([])
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [branchStocks, setBranchStocks]     = useState<Record<string, any>>({})
  const [totalBranchStock, setTotalBranchStock] = useState(0)
  const [product, setProduct]               = useState<IProduct | null>(null)

  // Modal state
  const [editModalIndex, setEditModalIndex]       = useState<number | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showGroupDialog, setShowGroupDialog]     = useState(false)
  const [groupSourceIndex, setGroupSourceIndex] = useState<number | null>(null)
  const [groupTargetIndex, setGroupTargetIndex] = useState<number | null>(null)

  // Drag state for image grouping
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

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
    images: [] as IProductImage[],
    sizes: [] as string[],
    tags: [] as string[],
    isFeatured: false,
    isFlashDeal: false,
    flashDealDiscount: 0,
    isNewProduct: false,
    isBestseller: false,
    isActive: true,
    branchId: '', // For tracking which branch's stock is being edited
    stockQuantity: 0, // Read-only display of branch stock
  })

  useEffect(() => {
    fetchProduct()
    fetchCategories()
    fetchBranches()
    fetchVendors()
  }, [resolvedParams.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedBranchId && product) {
      fetchBranchStocks(selectedBranchId)
    }
  }, [selectedBranchId, product]) // eslint-disable-line react-hooks/exhaustive-deps

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
          stockQuantity: data.stockQuantity || 0,
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
          setSelectedBranchId(mainBranch._id)
        } else if (activeBranches.length > 0) {
          setSelectedBranchId(activeBranches[0]._id)
        }
      }
    } catch { /* silent */ }
  }

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/admin/vendors?activeOnly=true')
      if (res.ok) {
        const data = await res.json()
        setVendors(data.vendors || [])
        
        // Auto-select house stock vendor if available
        const houseVendor = (data.vendors || []).find((v: any) => 
          v.name.toLowerCase().includes('house') || v.name.toLowerCase().includes('stock')
        )
        if (houseVendor) {
          setSelectedVendorId(houseVendor._id)
        } else if ((data.vendors || []).length > 0) {
          setSelectedVendorId(data.vendors[0]._id)
        }
      }
    } catch { /* silent */ }
  }

  const fetchBranchStocks = async (branchId: string) => {
    try {
      const res = await fetch(`/api/admin/products/branch-stock?productId=${resolvedParams.id}&branchId=${branchId}`)
      if (res.ok) {
        const data = await res.json()
        
        // Set total stock from API response
        setTotalBranchStock(data.totalStock || 0)
        
        // Convert branchStocks array to object keyed by branchId-imageIndex
        // Aggregate quantities from all vendors for each image
        const stocksObject: Record<string, any> = {}
        if (data.branchStocks && Array.isArray(data.branchStocks)) {
          data.branchStocks.forEach((stock: any) => {
            const key = `${stock.branchId}-${stock.imageIndex || 0}`
            if (stocksObject[key]) {
              // If key exists, add to the quantity
              stocksObject[key].quantity += stock.quantity
            } else {
              // Create new entry
              stocksObject[key] = { ...stock }
            }
          })
        }
        
        setBranchStocks(stocksObject)
      }
    } catch (error) {
      console.error('[Edit Product] Error fetching branch stocks:', error)
    }
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

  const handleImageSave = async (index: number, updated: IProductImage) => {
    // Update local form data
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? updated : img),
    }))

    // If stock was changed, update branch stock
    if (updated.stock !== undefined || updated.sizeStock) {
      try {
        const stockData = {
          productId: resolvedParams.id,
          branchId: selectedBranchId,
          imageIndex: index,
          quantity: updated.stock || 0,
          sizeStock: updated.sizeStock || {},
        }

        const res = await fetch('/api/admin/products/branch-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stockData),
        })

        if (res.ok) {
          // Refresh branch stocks
          await fetchBranchStocks(selectedBranchId)
        }
      } catch (error) {
        console.error('Error updating branch stock:', error)
      }
    }
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
    
    setFormData(prev => (({
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
    })))
    
    setShowGroupDialog(false)
    setGroupSourceIndex(null)
    setGroupTargetIndex(null)
  }

  const handleUngroup = (index: number) => {
    setFormData(prev => (({
      ...prev,
      images: prev.images.map((img, i) => {
        if (i === index) {
          return { ...img, groupId: undefined }
        }
        return img
      }),
    })))
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

    // Remove stock from update data (handled by branch stock)
    const imagesWithoutStock = formData.images.map(img => {
      const { stock, sizeStock, ...imgWithoutStock } = img
      return imgWithoutStock
    })

    const updateData = {
      ...formData,
      images: imagesWithoutStock,
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">Edit Product</h1>
            <p className="text-sm text-gray-600 mt-1">Update product information and stock for the selected branch.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Branch Selection ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Branch & Vendor Selection</h2>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
            <div>
              <Label>Branch</Label>
              <Select 
                value={selectedBranchId} 
                onValueChange={setSelectedBranchId}
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
                View and manage stock for this product at the selected branch.
              </p>
            </div>
            <div>
              <Label>Vendor</Label>
              <Select 
                value={selectedVendorId} 
                onValueChange={setSelectedVendorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map(vendor => (
                    <SelectItem key={vendor._id} value={vendor._id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Select the vendor for stock management operations.
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

        {/* ── Branch Stock Summary ── */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-1">Branch Stock Summary</h2>
          <p className="text-xs text-gray-500 mb-4">
            Total stock for this product at the selected branch.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Stock at {branches.find(b => b._id === selectedBranchId)?.name || 'Selected Branch'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={totalBranchStock}
                disabled
                className={`${inp} bg-gray-50 text-gray-700`}
                placeholder="0"
              />
              <span className="text-xs text-gray-500">Read-only (manage via image variants)</span>
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
            Each image is a selectable design variant. Drag one image onto another to group them (front/back/side views). 
            Click the <strong>edit</strong> icon to set per-image stock (including per-size), pricing, and SKU.
          </p>

          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
              {getRepresentativeImages().map(({ image, index: actualIndex, count }) => {
                const badge = imageBadge(image, actualIndex, branchStocks, selectedBranchId)
                const isGrouped = !!image.groupId
                return (
                  <div key={actualIndex} className="group relative">
                    <div 
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        isGrouped ? 'border-purple-400' : 'border-gray-200 group-hover:border-blue-400'
                      } ${groupTargetIndex === actualIndex ? 'border-green-400 scale-105' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(actualIndex)}
                      onDragOver={(e) => handleDragOver(e, actualIndex)}
                      onDrop={(e) => handleDrop(e, actualIndex)}
                      onClick={() => setEditModalIndex(actualIndex)}
                    >
                      <img src={image.url} alt={`Design ${actualIndex + 1}`} className="h-full w-full object-cover" />

                      {/* Action buttons overlay - Always visible on mobile, hover on desktop */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pointer-events-none" />

                      {/* Replace Button - Top left */}
                      <div
                        className="absolute top-1 left-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ReplaceImageButton
                          productId={resolvedParams.id}
                          imageIndex={actualIndex}
                          currentImageUrl={image.url}
                          onReplaceSuccess={fetchProduct}
                          size="sm"
                          variant="default"
                        />
                      </div>

                      {/* Remove Button - Top right */}
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(actualIndex) }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow z-10">
                        <X className="h-3 w-3" />
                      </button>

                      {/* Edit Button - Bottom right */}
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); setEditModalIndex(actualIndex) }}
                        className="absolute bottom-1 right-1 bg-white/90 text-gray-700 rounded-full p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-blue-600 hover:text-white shadow z-10"
                        title="Edit image settings">
                        <Pencil className="h-3 w-3" />
                      </button>

                      {/* Main badge */}
                      {actualIndex === 0 && (
                        <div className="absolute top-1 left-14 sm:left-1 bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-bold z-10">
                          Main
                        </div>
                      )}

                      {/* Group count indicator */}
                      {isGrouped && count > 1 && (
                        <div className="absolute top-1 right-10 bg-purple-500 text-white px-1.5 py-0.5 rounded text-xs font-bold z-10">
                          {count} images
                        </div>
                      )}

                      {/* Override summary */}
                      {badge && (
                        <div className="absolute bottom-0 inset-x-0 bg-white/95 text-gray-900 text-xs font-medium text-center py-1 px-1 leading-tight truncate border-t border-gray-200 z-10">
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
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
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
        image={editModalIndex !== null ? { ...formData.images[editModalIndex], index: editModalIndex } : null}
        allImages={formData.images.map((img, idx) => ({ ...img, index: idx }))}
        imageIndex={editModalIndex ?? 0}
        defaultPrice={formData.price || undefined}
        defaultWholesalePrice={formData.wholesalePrice || undefined}
        defaultWholesaleThreshold={formData.wholesaleThreshold || undefined}
        defaultSizes={formData.sizes}
        branchStock={editModalIndex !== null ? branchStocks[`${selectedBranchId}-${editModalIndex}`]?.quantity : undefined}
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
