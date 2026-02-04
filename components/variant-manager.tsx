'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import { useToast } from '@/components/ui/custom-toast'
import ImageUpload from '@/components/image-upload'
import { IVariant } from '@/models/Product'

interface VariantManagerProps {
  variants: IVariant[]
  onVariantsChange: (variants: IVariant[]) => void
}

interface VariantFormData {
  type: 'size' | 'scent' | 'color' | 'strength' | 'custom'
  value: string
  price: string
  oldPrice: string
  wholesalePrice: string
  wholesaleThreshold: string
  image: string
  stock: string
  sku: string
  isActive: boolean
}

const variantTypes = [
  { value: 'size', label: 'Size' },
  { value: 'scent', label: 'Scent' },
  { value: 'color', label: 'Color' },
  { value: 'strength', label: 'Strength' },
  { value: 'custom', label: 'Custom' }
]

export default function VariantManager({ variants, onVariantsChange }: VariantManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const toast = useToast()
  const [formData, setFormData] = useState<VariantFormData>({
    type: 'size',
    value: '',
    price: '',
    oldPrice: '',
    wholesalePrice: '',
    wholesaleThreshold: '',
    image: '',
    stock: '',
    sku: '',
    isActive: true
  })

  const resetFormData = () => {
    setFormData({
      type: 'size',
      value: '',
      price: '',
      oldPrice: '',
      wholesalePrice: '',
      wholesaleThreshold: '',
      image: '',
      stock: '',
      sku: '',
      isActive: true
    })
    setEditingVariant(null)
  }

  const resetForm = () => {
    resetFormData()
    setShowForm(false)
  }

  const generateSKU = (type: string, value: string) => {
    const typeCode = type.toUpperCase().substring(0, 3)
    const valueCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5)
    const randomCode = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `${typeCode}-${valueCode}-${randomCode}`
  }

  const handleAddVariant = () => {
    setShowForm(true)
    resetFormData()
  }

  const handleEditVariant = (variant: IVariant) => {
    setFormData({
      type: variant.type,
      value: variant.value,
      price: variant.price.toString(),
      oldPrice: variant.oldPrice?.toString() || '',
      wholesalePrice: variant.wholesalePrice?.toString() || '',
      wholesaleThreshold: variant.wholesaleThreshold?.toString() || '',
      image: variant.image,
      stock: variant.stock.toString(),
      sku: variant.sku,
      isActive: variant.isActive
    })
    setEditingVariant(variant.id)
    setShowForm(true)
  }

  const handleDeleteVariant = (variantId: string) => {
    if (confirm('Are you sure you want to delete this variant?')) {
      const updatedVariants = variants.filter(v => v.id !== variantId)
      onVariantsChange(updatedVariants)
    }
  }

  const handleSubmit = () => {
    if (!formData.value || !formData.price || !formData.image || !formData.stock) {
      toast.error('Please fill in all required fields')
      return
    }

    const variantData: IVariant = {
      id: editingVariant || `variant-${Date.now()}`,
      type: formData.type,
      value: formData.value,
      price: parseFloat(formData.price),
      oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : undefined,
      wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : undefined,
      wholesaleThreshold: formData.wholesaleThreshold ? parseInt(formData.wholesaleThreshold) : undefined,
      image: formData.image,
      stock: parseInt(formData.stock),
      sku: formData.sku || generateSKU(formData.type, formData.value),
      isActive: formData.isActive
    }

    let updatedVariants
    if (editingVariant) {
      updatedVariants = variants.map(v => v.id === editingVariant ? variantData : v)
    } else {
      updatedVariants = [...variants, variantData]
    }

    console.log('VariantManager: Saving variant, updated variants:', updatedVariants)
    onVariantsChange(updatedVariants)
    resetForm()
  }

  const calculateDiscount = (price: number, oldPrice?: number) => {
    if (!oldPrice || oldPrice <= price) return null
    const discount = oldPrice - price
    const percentage = Math.round((discount / oldPrice) * 100)
    return { amount: discount, percentage }
  }

  return (
    <div className="space-y-6">
      {/* Variant List */}
      {variants.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
          <div className="grid gap-4">
            {variants.map((variant) => {
              const discount = calculateDiscount(variant.price, variant.oldPrice)
              return (
                <div key={variant.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <img
                        src={variant.image}
                        alt={variant.value}
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{variant.value}</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {variant.type}
                          </span>
                          {!variant.isActive && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-green-600">KSH {variant.price}</span>
                            {variant.oldPrice && (
                              <>
                                <span className="line-through text-gray-400">KSH {variant.oldPrice}</span>
                                {discount && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    -{discount.percentage}%
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            <span>{variant.stock} in stock</span>
                          </div>
                          <span className="text-xs text-gray-500">SKU: {variant.sku}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditVariant(variant)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteVariant(variant.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Variant Button */}
      {!showForm && (
        <Button type="button" onClick={handleAddVariant} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Variant
        </Button>
      )}

      {/* Variant Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingVariant ? 'Edit Variant' : 'Add New Variant'}
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variant Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {variantTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variant Value *
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 50gms, Lavender, Red"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retail Price (KSH) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
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
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            {/* Wholesale Pricing Section */}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU (Auto-generated if empty)
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Will be auto-generated"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variant Image *
              </label>
              <ImageUpload
                onUpload={(imageUrl) => setFormData(prev => ({ ...prev, image: imageUrl }))}
                onRemove={() => setFormData(prev => ({ ...prev, image: '' }))}
                currentImage={formData.image}
                watermarkText="© Serenleaf Natural"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="variantActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="variantActive" className="ml-2 block text-sm text-gray-900">
                Active (visible to customers)
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit}>
                {editingVariant ? 'Update Variant' : 'Add Variant'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}