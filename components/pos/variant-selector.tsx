'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatKES } from '@/lib/pos/money'
import { getAllVariants, resolveUnitPrice } from '@/lib/pos/product-pricing'
import { IProduct } from '@/models/Product'
import { Minus, Plus } from 'lucide-react'

interface VariantSelectorProps {
  product: IProduct | null
  open: boolean
  pricingMode: 'retail' | 'wholesale'
  onClose: () => void
  onAdd: (item: {
    productId: string
    productName: string
    sku?: string
    selectedImageIndex: number
    selectedImageUrl: string
    selectedSize?: string
    quantity: number
    retailUnitPrice: number
    wholesaleUnitPrice?: number
    originalUnitPrice: number
    actualUnitPrice: number
    pricingMode: 'retail' | 'wholesale'
  }) => void
}

export default function VariantSelector({
  product,
  open,
  pricingMode,
  onClose,
  onAdd,
}: VariantSelectorProps) {
  const [imageIndex, setImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (product) {
      setImageIndex(0)
      setQuantity(1)
    }
  }, [product])

  const variants = product ? getAllVariants(product) : []
  const variant = variants[imageIndex] || variants[0]
  const sizes = variant?.sizes || []

  useEffect(() => {
    if (sizes.length > 0) setSelectedSize(sizes[0])
    else setSelectedSize('')
  }, [imageIndex, product, sizes.length])

  if (!product || !variant) return null

  const pricing = resolveUnitPrice(variant, pricingMode, quantity)
  const canAdd =
    variant.inStock &&
    variant.stock >= quantity &&
    (sizes.length === 0 || !!selectedSize)

  const handleAdd = () => {
    if (!canAdd) return
    onAdd({
      productId: product._id!,
      productName: product.name,
      sku: variant.sku,
      selectedImageIndex: imageIndex,
      selectedImageUrl: variant.image.url,
      selectedSize: selectedSize || undefined,
      quantity,
      retailUnitPrice: variant.retailPrice,
      wholesaleUnitPrice: variant.wholesalePrice,
      originalUnitPrice: variant.retailPrice,
      actualUnitPrice: pricing.unitPrice,
      pricingMode: pricing.isWholesale ? 'wholesale' : 'retail',
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative aspect-square max-h-48 mx-auto rounded-lg overflow-hidden bg-muted">
            <Image
              src={variant.image.url}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>

          {variants.length > 1 && (
            <div>
              <Label className="mb-2 block">Select Design</Label>
              <div className="flex gap-2 flex-wrap">
                {variants.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIndex(i)}
                    disabled={!v.inStock}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      imageIndex === i ? 'border-primary' : 'border-border'
                    } ${!v.inStock ? 'opacity-40' : ''}`}
                  >
                    <Image src={v.image.url} alt={`Variant ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div>
              <Label className="mb-2 block">Size</Label>
              <div className="flex flex-wrap gap-2">
                {sizes.map(size => (
                  <Button
                    key={size}
                    type="button"
                    variant={selectedSize === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-primary">{formatKES(pricing.unitPrice)}</p>
              {pricing.isWholesale && (
                <p className="text-xs text-secondary font-medium">Wholesale pricing active</p>
              )}
              <p className="text-xs text-muted-foreground">Stock: {variant.stock}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={1}
                max={variant.stock}
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(q => Math.min(variant.stock, q + 1))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button className="w-full" disabled={!canAdd} onClick={handleAdd}>
            Add to Cart · {formatKES(pricing.unitPrice * quantity)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
