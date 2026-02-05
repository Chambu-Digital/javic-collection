'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { IProduct, IVariant } from '@/models/Product'
import { ICategory } from '@/models/Category'
import VariantManager from '@/components/variant-manager'

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [categories, setCategories] = useState<ICategory[]>([])
  const [product, setProduct] = useState<IProduct | null>(null)
  const [newTag, setNewTag] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hasVariants: false,
    price: 0,
    oldPrice: 0,
    wholesalePrice: 0,
    wholesaleThreshold: 0,
    category: '',
    stockQuantity: 0,
    images: [] as string[],
    variants: [] as IVariant[],
    tags: [] as string[],
    isFeatured: false,
    isFlashDeal: false,
    flashDealDiscount: 0,
    isNewProduct: false,
    isBestseller: false,
    isActive: true
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
        // Debug: Log what we received
        console.log('Loading product for edit:', {
          id: data._id,
          name: data.name,
          hasVariants: data.hasVariants,
          variantsCount: data.variants?.length || 0,
          variants: data.variants
        })

        setFormData({
          name: data.name || '',
          description: data.description || '',
          hasVariants: data.hasVariants || (data.variants && data.variants.length > 0),
          price: data.price || 0,
          oldPrice: data.oldPrice || 0,
          wholesalePrice: data.wholesalePrice || 0,
          wholesaleThreshold: data.wholesaleThreshold || 0,
          category: data.category || '',
          stockQuantity: data.stockQuantity || 0,
          images: data.images || [],
          variants: data.variants || [],
          tags: data.tags || [],
          isFeatured: data.isFeatured || false,
          isFlashDeal: data.isFlashDeal || false,
          flashDealDiscount: data.flashDealDiscount || 0,
          isNewProduct: data.isNewProduct || false,
          isBestseller: data.isBestseller || false,
          isActive: data.isActive !== undefined ? data.isActive : true
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

    // Validation
    if (formData.hasVariants && formData.variants.length === 0) {
      alert('Please add at least one variant or disable variants for this product.')
      setSaving(false)
      return
    }

    if (!formData.hasVariants && formData.images.length === 0) {
      alert('Please upload at least one image for simple products.')
      setSaving(false)
      return
    }

    // Calculate stock and inStock status
    let totalStock = 0
    let inStock = false
    
    if (formData.hasVariants) {
      totalStock = formData.variants.reduce((sum, variant) => sum + variant.stock, 0)
      inStock = formData.variants.some(variant => variant.stock > 0 && variant.isActive)
    } else {
      totalStock = formData.stockQuantity
      inStock = totalStock > 0
    }

    const updateData = {
      ...formData,
      stockQuantity: totalStock,
      inStock
    }

    try {
      const response = await fetch(`/api/products/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
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

  const addArrayItem = (field: 'benefits' | 'tags', value: string) => {
    if (!value.trim()) return
    
    // Split by comma and clean up each item
    const items = value.split(',').map(item => item.trim()).filter(item => item.length > 0)
    
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ...items]
    }))
    
    // Clear the input
    if (field === 'benefits') setNewBenefit('')
    if (field === 'tags') setNewTag('')
  }

  const removeArrayItem = (field: 'benefits' | 'tags' | 'images', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
        <div className="space-y-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <Link href="/admin/products">
          <Button>Back to Products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/products" className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-600">Update product information and settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category._id} value={category.name}>
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
              placeholder="Describe your product, its benefits, and how to use it..."
            />
          </div>
        </div>

        {/* Pricing & Variants */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Pricing & Variants</h2>
          
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
              This product has variants (different sizes, colors, etc.)
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
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData(prev => ({ 
                        ...prev, 
                        price: value === '' ? 0 : parseFloat(value) || 0 
                      }))
                    }}
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
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData(prev => ({ 
                        ...prev, 
                        oldPrice: value === '' ? 0 : parseFloat(value) || 0 
                      }))
                    }}
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
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData(prev => ({ 
                        ...prev, 
                        stockQuantity: value === '' ? 0 : parseInt(value) || 0 
                      }))
                    }}
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
                      onChange={(e) => {
                        const value = e.target.value
                        setFormData(prev => ({ 
                          ...prev, 
                          wholesalePrice: value === '' ? 0 : parseFloat(value) || 0 
                        }))
                      }}
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
                      onChange={(e) => {
                        const value = e.target.value
                        setFormData(prev => ({ 
                          ...prev, 
                          wholesaleThreshold: value === '' ? 0 : parseInt(value) || 0 
                        }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="10"
                    />
                  </div>
                </div>
                
                {formData.price && formData.wholesalePrice && formData.wholesaleThreshold && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      <strong>Wholesale Savings:</strong> KSH {(formData.price - formData.wholesalePrice).toFixed(2)} per unit 
                      ({Math.round(((formData.price - formData.wholesalePrice) / formData.price) * 100)}% off) 
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
                Manage variants for this product. Each variant can have its own price, image, and stock level.
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
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Product Images</h2>
            
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
                        onClick={() => removeArrayItem('images', index)}
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
              <strong>Note:</strong> For products with variants, images are managed individually for each variant. 
              Each variant has its own specific image that customers will see when they select that variant.
            </p>
          </div>
        )}

        {/* Product Details */}
        {/* <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Product Details</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingredients
              </label>
              <textarea
                rows={3}
                value={formData.ingredients}
                onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="List of ingredients..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usage Instructions
              </label>
              <textarea
                rows={3}
                value={formData.usage}
                onChange={(e) => setFormData(prev => ({ ...prev, usage: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="How to use this product..."
              />
            </div>
          </div>
        </div> */}

        
      

        {/* Product Images */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Product Images</h2>
          
          {/* Current Images */}
          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {formData.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Product ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('images', index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload New Images */}
          <div className="border-2 border-gray-300 border-dashed rounded-lg p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="flex text-sm text-gray-600 justify-center">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span>Upload new images</span>
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
              <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB each</p>
              {imageUploading && (
                <p className="text-sm text-blue-600 mt-2">Uploading images...</p>
              )}
            </div>
          </div>


        </div>

        {/* Product Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Product Settings</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="mr-2"
              />
              Active
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                className="mr-2"
              />
              Featured
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isNewProduct}
                onChange={(e) => setFormData(prev => ({ ...prev, isNewProduct: e.target.checked }))}
                className="mr-2"
              />
              New Product
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isBestseller}
                onChange={(e) => setFormData(prev => ({ ...prev, isBestseller: e.target.checked }))}
                className="mr-2"
              />
              Bestseller
            </label>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isFlashDeal}
                onChange={(e) => setFormData(prev => ({ ...prev, isFlashDeal: e.target.checked }))}
                className="mr-2"
              />
              Flash Deal
            </label>
            
            {formData.isFlashDeal && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flash Deal Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.flashDealDiscount}
                  onChange={(e) => setFormData(prev => ({ ...prev, flashDealDiscount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? 'Updating...' : 'Update Product'}
          </Button>
        </div>
      </form>
    </div>
  )
}