'use client'

import { useState, useEffect } from 'react'
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
  color: string
  availableSizes: string[]
  price: string
  oldPrice: string
  wholesalePrice: string
  wholesaleThreshold: string
  image: string
  stock: string
  sku: string
  isActive: boolean
}

export default function VariantManager({ variants, onVariantsChange }: VariantManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const [availableColors, setAvailableColors] = useState<string[]>([])
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [loadingColors, setLoadingColors] = useState(false)
  const [loadingSizes, setLoadingSizes] = useState(false)
  const toast = useToast()
  const [formData, setFormData] = useState<VariantFormData>({
    color: '',
    availableSizes: [],
    price: '',
    oldPrice: '',
    wholesalePrice: '',
    wholesaleThreshold: '',
    image: '',
    stock: '',
    sku: '',
    isActive: true
  })

  // Fetch available colors and sizes from database
  useEffect(() => {
    fetchAvailableColors()
    fetchAvailableSizes()
  }, [])

  const fetchAvailableColors = async () => {
    setLoadingColors(true)
    try {
      const response = await fetch('/api/variants/colors')
      if (response.ok) {
        const colors = await response.json()
        setAvailableColors(colors)
      }
    } catch (error) {
      console.error('Error fetching colors:', error)
    } finally {
      setLoadingColors(false)
    }
  }

  const fetchAvailableSizes = async () => {
    setLoadingSizes(true)
    try {
      const response = await fetch('/api/variants/sizes')
      if (response.ok) {
        const sizes = await response.json()
        setAvailableSizes(sizes)
      }
    } catch (error) {
      console.error('Error fetching sizes:', error)
    } finally {
      setLoadingSizes(false)
    }
  }

  const resetFormData = () => {
    setFormData({
      color: '',
      availableSizes: [],
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

  const generateSKU = (color: string, sizesCount: number) => {
    const colorCode = color ? color.toUpperCase().substring(0, 3) : 'COL'
    const sizeCode = sizesCount > 0 ? `${sizesCount}SZ` : 'NSZ'
    const randomCode = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `${colorCode}-${sizeCode}-${randomCode}`
  }

  const handleAddVariant = () => {
    setShowForm(true)
    resetFormData()
  }

  const handleEditVariant = (variant: IVariant) => {
    setFormData({
      color: variant.color || '',
      availableSizes: variant.availableSizes || [],
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

  const handleBulkColorCreation = (colorInput: string) => {
    const colors = colorInput.split(',').map(color => color.trim()).filter(color => color.length > 0)
    
    if (colors.length <= 1) {
      // Single color, just update the form
      setFormData(prev => ({ ...prev, color: colors[0] || colorInput }))
      return
    }

    // Multiple colors - create variants for each
    const newVariants: IVariant[] = []
    
    colors.forEach(color => {
      // Check if this color already exists in current variants
      const existingVariant = variants.find(v => v.color.toLowerCase() === color.toLowerCase())
      if (!existingVariant) {
        const variantData: IVariant = {
          id: `variant-${Date.now()}-${color.replace(/\s+/g, '-').toLowerCase()}`,
          color: color,
          availableSizes: [], // Empty - user will fill these
          price: 0, // Default - user will fill this
          oldPrice: undefined,
          wholesalePrice: undefined,
          wholesaleThreshold: undefined,
          image: '', // Empty - user will upload
          stock: 0, // Default - user will fill this
          sku: generateSKU(color, 0),
          isActive: true
        }
        newVariants.push(variantData)
      }
    })

    if (newVariants.length > 0) {
      // Add the new variants to the existing ones
      const updatedVariants = [...variants, ...newVariants]
      onVariantsChange(updatedVariants)
      
      // Show success message
      toast.success(`Created ${newVariants.length} color variant${newVariants.length > 1 ? 's' : ''}: ${newVariants.map(v => v.color).join(', ')}`)
      
      // Reset form
      resetForm()
      
      // Refresh available colors list
      fetchAvailableColors()
    } else {
      toast.info('All specified colors already exist as variants')
    }
  }

  const handleSubmit = () => {
    if (!formData.color || !formData.price || !formData.image || !formData.stock) {
      toast.error('Please fill in all required fields (color, price, image, and stock)')
      return
    }

    if (formData.availableSizes.length === 0) {
      toast.error('Please select at least one available size for this color variant')
      return
    }

    const variantData: IVariant = {
      id: editingVariant || `variant-${Date.now()}`,
      color: formData.color,
      availableSizes: formData.availableSizes,
      price: parseFloat(formData.price),
      oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : undefined,
      wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : undefined,
      wholesaleThreshold: formData.wholesaleThreshold ? parseInt(formData.wholesaleThreshold) : undefined,
      image: formData.image,
      stock: parseInt(formData.stock),
      sku: formData.sku || generateSKU(formData.color, formData.availableSizes.length),
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
    
    // Refresh the available colors and sizes lists to include any new ones
    if (!editingVariant) {
      // Only refresh if it's a new variant (not editing existing)
      if (!availableColors.includes(formData.color)) {
        fetchAvailableColors()
      }
      const newSizes = formData.availableSizes.filter(size => !availableSizes.includes(size))
      if (newSizes.length > 0) {
        fetchAvailableSizes()
      }
    }
    
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
              const isIncomplete = !variant.image || variant.price === 0 || variant.availableSizes.length === 0 || variant.stock === 0
              
              return (
                <div key={variant.id} className={`rounded-lg p-4 border ${isIncomplete ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {variant.image ? (
                        <img
                          src={variant.image}
                          alt={variant.color}
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg border flex items-center justify-center">
                          <span className="text-xs text-gray-500">No Image</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{variant.color}</span>
                          {isIncomplete && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Needs Setup
                            </span>
                          )}
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            {variant.availableSizes.length} size{variant.availableSizes.length !== 1 ? 's' : ''}
                          </span>
                          {!variant.isActive && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mb-1">
                          Sizes: {variant.availableSizes.length > 0 ? variant.availableSizes.join(', ') : 'No sizes selected'}
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
                  Color *
                </label>
                <div className="space-y-2">
                  {availableColors.length > 0 && (
                    <select
                      value={availableColors.includes(formData.color) ? formData.color : ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select from existing colors</option>
                      {availableColors.map(color => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const colorInput = (e.target as HTMLInputElement).value.trim()
                          if (colorInput) {
                            handleBulkColorCreation(colorInput)
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={availableColors.length > 0 ? "Type new color or multiple colors separated by commas" : "Enter color name or multiple colors separated by commas"}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (formData.color.trim()) {
                          handleBulkColorCreation(formData.color.trim())
                        }
                      }}
                      disabled={!formData.color.trim()}
                      className="px-4 py-2 text-sm"
                    >
                      {formData.color.includes(',') ? 'Create All' : 'Add'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Tip: Type multiple colors separated by commas (e.g., "Black, Blue, Pink") to create multiple variants at once!
                  </p>
                  {loadingColors && (
                    <p className="text-xs text-gray-500">Loading existing colors...</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Sizes *
                </label>
                <div className="space-y-2">
                  {availableSizes.length > 0 && (
                    <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
                      <p className="text-xs text-gray-600 mb-2">Select from existing sizes:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {availableSizes.map(size => (
                          <label key={size} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={formData.availableSizes.includes(size)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    availableSizes: [...prev.availableSizes, size]
                                  }))
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    availableSizes: prev.availableSizes.filter(s => s !== size)
                                  }))
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span>{size}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add multiple sizes separated by commas (e.g., XS, S, M, L, XL)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const input = (e.target as HTMLInputElement).value.trim()
                          if (input) {
                            // Split by comma and add all sizes
                            const newSizes = input.split(',')
                              .map(size => size.trim())
                              .filter(size => size.length > 0 && !formData.availableSizes.includes(size))
                            
                            if (newSizes.length > 0) {
                              setFormData(prev => ({
                                ...prev,
                                availableSizes: [...prev.availableSizes, ...newSizes]
                              }))
                              ;(e.target as HTMLInputElement).value = ''
                              
                              // Show success message
                              if (newSizes.length > 1) {
                                toast.success(`Added ${newSizes.length} sizes: ${newSizes.join(', ')}`)
                              }
                            } else {
                              toast.info('All specified sizes are already added')
                            }
                          }
                        }
                      }}
                      id="bulk-size-input"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('bulk-size-input') as HTMLInputElement
                        const inputValue = input?.value.trim()
                        if (inputValue) {
                          // Split by comma and add all sizes
                          const newSizes = inputValue.split(',')
                            .map(size => size.trim())
                            .filter(size => size.length > 0 && !formData.availableSizes.includes(size))
                          
                          if (newSizes.length > 0) {
                            setFormData(prev => ({
                              ...prev,
                              availableSizes: [...prev.availableSizes, ...newSizes]
                            }))
                            input.value = ''
                            
                            // Show success message
                            if (newSizes.length > 1) {
                              toast.success(`Added ${newSizes.length} sizes: ${newSizes.join(', ')}`)
                            }
                          } else {
                            toast.info('All specified sizes are already added')
                          }
                        }
                      }}
                      className="px-4 py-2 text-sm"
                    >
                      Add All
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Tip: Type multiple sizes separated by commas (e.g., "XS, S, M, L, XL") to add them all at once!
                  </p>
                  {loadingSizes && (
                    <p className="text-xs text-gray-500">Loading existing sizes...</p>
                  )}
                  {formData.availableSizes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <p className="text-xs text-gray-600 w-full mb-1">Selected sizes:</p>
                      {formData.availableSizes.map((size, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {size}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                availableSizes: prev.availableSizes.filter((_, i) => i !== index)
                              }))
                            }}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
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
                watermarkText="© Javic Collection"
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