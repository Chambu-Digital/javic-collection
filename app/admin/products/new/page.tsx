'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { ICategory } from '@/models/Category'
import ImageUpload from '@/components/image-upload'
import VariantManager from '@/components/variant-manager'
import { IVariant } from '@/models/Product'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [categories, setCategories] = useState<ICategory[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hasVariants: false,
    price: '',
    oldPrice: '',
    wholesalePrice: '',
    wholesaleThreshold: '',
    images: [] as string[],
    variants: [] as IVariant[],
    category: '',
    categoryId: '',
    stockQuantity: '',
    tags: [] as string[],
    isActive: true,
    isFeatured: false,
    isNewProduct: false,
    isBestseller: false,
    isFlashDeal: false,
    flashDealDiscount: ''
  })

  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setImageUploading(true)

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          const data = await response.json()
          return data.url
        }
        throw new Error('Upload failed')
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }))
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Failed to upload some images')
    } finally {
      setImageUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const addArrayItem = (field: 'tags', value: string) => {
    if (!value.trim()) return
    
    // Split by comma and clean up each item
    const items = value.split(',').map(item => item.trim()).filter(item => item.length > 0)
    
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ...items]
    }))
    
    // Clear the input
    if (field === 'tags') setNewTag('')
  }

  const removeArrayItem = (field: 'tags', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId)
    setFormData(prev => ({
      ...prev,
      categoryId,
      category: category?.name || ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validation
    if (formData.hasVariants && formData.variants.length === 0) {
      alert('Please add at least one variant or disable variants for this product.')
      setLoading(false)
      return
    }

    if (!formData.hasVariants && (!formData.price || formData.images.length === 0)) {
      alert('Please set a price and upload at least one image for simple products.')
      setLoading(false)
      return
    }

    const slug = generateSlug(formData.name)
    
    // Calculate stock and inStock status
    let totalStock = 0
    let inStock = false
    
    if (formData.hasVariants) {
      totalStock = formData.variants.reduce((sum, variant) => sum + variant.stock, 0)
      inStock = formData.variants.some(variant => variant.stock > 0 && variant.isActive)
    } else {
      totalStock = parseInt(formData.stockQuantity)
      inStock = totalStock > 0
    }
    
    const productData = {
      ...formData,
      slug,
      price: formData.hasVariants ? 0 : parseFloat(formData.price),
      oldPrice: (!formData.hasVariants && formData.oldPrice) ? parseFloat(formData.oldPrice) : undefined,
      stockQuantity: totalStock,
      flashDealDiscount: formData.flashDealDiscount ? parseFloat(formData.flashDealDiscount) : undefined,
      rating: 0,
      reviews: 0,
      inStock
    }

    // Debug: Log what we're sending
    console.log('Creating product with data:', {
      hasVariants: productData.hasVariants,
      variantsCount: productData.variants?.length || 0,
      variants: productData.variants,
      fullProductData: productData
    })

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })

      if (response.ok) {
        router.push('/admin/products')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create product')
      }
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/products" className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create a new product listing with all the details.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-8 p-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Satin 5pcs Pajama Set"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Description *
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your fashion item, its style, material, and care instructions..."
              />
            </div>
          </div>

          {/* Pricing & Variants */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Variants</h3>
            
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="hasVariants"
                checked={formData.hasVariants}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  hasVariants: e.target.checked,
                  variants: e.target.checked ? prev.variants : []
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="hasVariants" className="ml-2 block text-sm font-medium text-gray-900">
                This product has variants (different sizes, colors, styles, etc.)
              </label>
            </div>
            
            {!formData.hasVariants ? (
              /* Simple Product Pricing */
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Retail Price (KSH) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Old Price (KSH)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.oldPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, oldPrice: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Wholesale Pricing for Simple Products */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">Wholesale Pricing (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wholesale Price (KSH)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.wholesalePrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, wholesalePrice: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Quantity for Wholesale
                      </label>
                      <input
                        type="number"
                        value={formData.wholesaleThreshold}
                        onChange={(e) => setFormData(prev => ({ ...prev, wholesaleThreshold: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="10"
                      />
                    </div>
                  </div>
                  
                  {formData.price && formData.wholesalePrice && formData.wholesaleThreshold && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        <strong>Wholesale Savings:</strong> KSH {(parseFloat(formData.price) - parseFloat(formData.wholesalePrice)).toFixed(2)} per unit 
                        ({Math.round(((parseFloat(formData.price) - parseFloat(formData.wholesalePrice)) / parseFloat(formData.price)) * 100)}% off) 
                        when buying {formData.wholesaleThreshold}+ units
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Variant Management */
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Add variants for this product. Each variant can have different colors, sizes, and its own price, image, and stock level.
                </p>
                <VariantManager
                  variants={formData.variants}
                  onVariantsChange={(variants) => setFormData(prev => ({ ...prev, variants }))}
                />
              </div>
            )}
          </div>

          {/* Product Images - Only for Simple Products */}
          {!formData.hasVariants && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images * (Upload multiple images)
              </label>
              
              {/* Existing Images Grid */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="h-32 w-full object-cover rounded-lg border border-gray-200"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                          Main
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Enhanced Upload Area */}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
                onDrop={(e) => {
                  e.preventDefault()
                  const files = Array.from(e.dataTransfer.files)
                  if (files.length > 0) {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.multiple = true
                    input.accept = 'image/*'
                    const event = { target: { files } } as any
                    handleImageUpload(event)
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                {imageUploading ? (
                  <div className="space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-sm text-blue-600">Uploading images...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div>
                      <label className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500 font-medium">
                          Click to upload
                        </span>
                        <span className="text-gray-500"> or drag and drop multiple images</span>
                        <input
                          type="file"
                          className="sr-only"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={imageUploading}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF, WebP up to 10MB each • First image will be the main product image
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Variant Images Note */}
          {formData.hasVariants && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> For products with variants, images are uploaded individually for each variant. 
                Each variant will have its own specific image that customers will see when they select that variant.
              </p>
            </div>
          )}

          {/* Product Details */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
            
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., cotton, comfortable, casual, sleepwear (separate with commas)"
                />
                <Button
                  type="button"
                  onClick={() => addArrayItem('tags', newTag)}
                  disabled={!newTag.trim()}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeArrayItem('tags', index)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Product Settings */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Settings</h3>
            
            {/* Flash Deal */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFlashDeal"
                  checked={formData.isFlashDeal}
                  onChange={(e) => setFormData(prev => ({ ...prev, isFlashDeal: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isFlashDeal" className="ml-2 block text-sm text-gray-900">
                  Flash Deal
                </label>
              </div>

              {formData.isFlashDeal && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.flashDealDiscount}
                    onChange={(e) => setFormData(prev => ({ ...prev, flashDealDiscount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              )}
            </div>

            {/* Product Flags */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
                  Featured
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isNewProduct"
                  checked={formData.isNewProduct}
                  onChange={(e) => setFormData(prev => ({ ...prev, isNewProduct: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isNewProduct" className="ml-2 block text-sm text-gray-900">
                  New Product
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isBestseller"
                  checked={formData.isBestseller}
                  onChange={(e) => setFormData(prev => ({ ...prev, isBestseller: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isBestseller" className="ml-2 block text-sm text-gray-900">
                  Bestseller
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link href="/admin/products">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || 
                (formData.hasVariants ? formData.variants.length === 0 : formData.images.length === 0)
              }
            >
              {loading ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}