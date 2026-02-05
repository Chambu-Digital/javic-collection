'use client'

import { useState, useEffect } from 'react'
import { IVariant } from '@/models/Product'
import { getWholesaleInfo } from '@/lib/product-utils'

interface ProductVariationsProps {
  variants: IVariant[]
  onVariantChange: (variant: IVariant | null, selectedSize?: string) => void
  selectedVariantId?: string
}

export default function ProductVariations({ 
  variants, 
  onVariantChange, 
  selectedVariantId 
}: ProductVariationsProps) {
  const [selectedVariant, setSelectedVariant] = useState<IVariant | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>('')

  useEffect(() => {
    // Auto-select first variant if none selected
    if (variants.length > 0 && !selectedVariant) {
      const firstActiveVariant = variants.find(v => v.isActive)
      if (firstActiveVariant) {
        setSelectedVariant(firstActiveVariant)
        // Auto-select first available size
        if (firstActiveVariant.availableSizes && firstActiveVariant.availableSizes.length > 0) {
          setSelectedSize(firstActiveVariant.availableSizes[0])
        }
        onVariantChange(firstActiveVariant, firstActiveVariant.availableSizes?.[0])
      }
    }
  }, [variants, selectedVariant, onVariantChange])

  useEffect(() => {
    // Update selected variant when selectedVariantId changes
    if (selectedVariantId) {
      const variant = variants.find(v => v.id === selectedVariantId)
      if (variant && variant !== selectedVariant) {
        setSelectedVariant(variant)
        // Auto-select first available size for new variant
        if (variant.availableSizes && variant.availableSizes.length > 0) {
          setSelectedSize(variant.availableSizes[0])
        }
        onVariantChange(variant, variant.availableSizes?.[0])
      }
    }
  }, [selectedVariantId, variants, selectedVariant, onVariantChange])

  const handleVariantSelect = (variant: IVariant) => {
    setSelectedVariant(variant)
    // Auto-select first available size when changing color
    const firstSize = variant.availableSizes && variant.availableSizes.length > 0 ? variant.availableSizes[0] : ''
    setSelectedSize(firstSize)
    onVariantChange(variant, firstSize)
  }

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size)
    onVariantChange(selectedVariant, size)
  }

  const calculateDiscount = (price: number, oldPrice?: number) => {
    if (!oldPrice || oldPrice <= price) return null
    const discount = oldPrice - price
    const percentage = Math.round((discount / oldPrice) * 100)
    return { amount: discount, percentage }
  }

  if (variants.length === 0) {
    return null
  }

  const activeVariants = variants.filter(v => v.isActive)

  return (
    <div className="space-y-6">
      {/* Color Selection */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">
          Choose Color:
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {activeVariants.map((variant) => {
            const isSelected = selectedVariant?.id === variant.id
            const discount = calculateDiscount(variant.price, variant.oldPrice)
            const wholesaleInfo = getWholesaleInfo(variant)
            const isOutOfStock = variant.stock === 0
            
            return (
              <button
                key={variant.id}
                onClick={() => !isOutOfStock && handleVariantSelect(variant)}
                disabled={isOutOfStock}
                className={`
                  relative p-3 border rounded-lg text-left transition-all
                  ${isSelected 
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                    : 'border-border hover:border-primary/50'
                  }
                  ${isOutOfStock 
                    ? 'opacity-50 cursor-not-allowed bg-muted' 
                    : 'cursor-pointer'
                  }
                `}
              >
                {/* Color Image */}
                <div className="aspect-square w-full mb-2 rounded-md overflow-hidden bg-gray-100">
                  <img
                    src={variant.image}
                    alt={variant.color}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm text-foreground">
                      {variant.color}
                    </div>
                    {wholesaleInfo.hasWholesale && (
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Bulk
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary text-sm">
                      KSH {variant.price}
                    </span>
                    {variant.oldPrice && (
                      <span className="text-xs line-through text-muted-foreground">
                        KSH {variant.oldPrice}
                      </span>
                    )}
                  </div>
                  
                  {discount && (
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full inline-block">
                      Save {discount.percentage}%
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    {isOutOfStock ? (
                      <span className="text-red-600 font-medium">Out of Stock</span>
                    ) : variant.stock <= 5 ? (
                      <span className="text-orange-600">Only {variant.stock} left</span>
                    ) : (
                      <span className="text-green-600">In Stock</span>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {variant.availableSizes?.length || 0} size{(variant.availableSizes?.length || 0) !== 1 ? 's' : ''} available
                  </div>
                </div>
                
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Size Selection */}
      {selectedVariant && selectedVariant.availableSizes && selectedVariant.availableSizes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 text-foreground">
            Choose Size:
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {selectedVariant.availableSizes.map((size) => {
              const isSelected = selectedSize === size
              
              return (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  className={`
                    px-4 py-2 border rounded-lg text-sm font-medium transition-all
                    ${isSelected 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : 'border-border hover:border-primary/50 text-foreground'
                    }
                  `}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </div>
      )}
      
      {selectedVariant && (
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-foreground">
                Selected: {selectedVariant.color}
                {selectedSize && ` - ${selectedSize}`}
              </h4>
              <p className="text-sm text-muted-foreground">SKU: {selectedVariant.sku}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">
                  KSH {selectedVariant.price}
                </span>
                {selectedVariant.oldPrice && (
                  <span className="text-sm line-through text-muted-foreground">
                    KSH {selectedVariant.oldPrice}
                  </span>
                )}
              </div>
              {selectedVariant.stock <= 5 && selectedVariant.stock > 0 && (
                <p className="text-xs text-orange-600 font-medium">
                  Only {selectedVariant.stock} left in stock
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}