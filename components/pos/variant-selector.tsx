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
import { Minus, Plus, Building2, Loader2, User } from 'lucide-react'

interface VendorStockOption {
  vendorId: string
  vendorCode: string
  vendorName: string
  quantity: number
  stockIdentifier: string
  imageIndex: number
  selectedSize?: string
}

interface VariantSelectorProps {
  product: IProduct | null
  open: boolean
  pricingMode: 'retail' | 'wholesale'
  currentBranchId: string  // NEW: Current POS branch context
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
    branchId: string
    branchCode: string
    branchStockId: string
    vendorId: string       // NEW
    vendorCode: string     // NEW
  }) => void
}

export default function VariantSelector({
  product,
  open,
  pricingMode,
  currentBranchId,  // NEW
  onClose,
  onAdd,
}: VariantSelectorProps) {
  const [imageIndex, setImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [vendorStocks, setVendorStocks] = useState<VendorStockOption[]>([])
  const [selectedVendor, setSelectedVendor] = useState<VendorStockOption | null>(null)
  const [loadingVendorStocks, setLoadingVendorStocks] = useState(false)
  const [branchCode, setBranchCode] = useState('')

  useEffect(() => {
    if (product) {
      setImageIndex(0)
      setQuantity(1)
      setSelectedVendor(null)
      setBranchCode('')
    }
  }, [product])

  const variants = product ? getAllVariants(product) : []
  const variant = variants[imageIndex] || variants[0]
  const sizes = variant?.sizes || []

  useEffect(() => {
    if (sizes.length > 0) setSelectedSize(sizes[0])
    else setSelectedSize('')
  }, [imageIndex, product, sizes.length])

  // Fetch vendor stocks when variant changes
  useEffect(() => {
    const fetchVendorStocks = async () => {
      if (!product || !currentBranchId) return
      
      setLoadingVendorStocks(true)
      try {
        const params = new URLSearchParams({
          productId: product._id!,
          branchId: currentBranchId,  // Use current POS branch
          imageIndex: imageIndex.toString(),
        })
        
        if (selectedSize) {
          params.append('selectedSize', selectedSize)
        }
        
        const response = await fetch(`/api/pos/products/vendor-stock?${params}`)
        if (response.ok) {
          const data = await response.json()
          setVendorStocks(data.vendorStocks || [])
          setBranchCode(data.branchCode || '')
          // Auto-select first available vendor
          if (data.vendorStocks && data.vendorStocks.length > 0) {
            setSelectedVendor(data.vendorStocks[0])
          } else {
            setSelectedVendor(null)
          }
        } else {
          setVendorStocks([])
          setSelectedVendor(null)
        }
      } catch (error) {
        console.error('Error fetching vendor stocks:', error)
        setVendorStocks([])
        setSelectedVendor(null)
      } finally {
        setLoadingVendorStocks(false)
      }
    }

    fetchVendorStocks()
  }, [product, currentBranchId, imageIndex, selectedSize])

  if (!product || !variant) return null

  const pricing = resolveUnitPrice(variant, pricingMode, quantity)
  const availableStock = selectedVendor ? selectedVendor.quantity : variant.stock
  const canAdd =
    variant.inStock &&
    availableStock >= quantity &&
    (sizes.length === 0 || !!selectedSize) &&
    !!selectedVendor &&
    !!currentBranchId

  const handleAdd = () => {
    if (!canAdd || !selectedVendor || !currentBranchId) return
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
      branchId: currentBranchId,
      branchCode: branchCode,
      branchStockId: selectedVendor.stockIdentifier,
      vendorId: selectedVendor.vendorId,
      vendorCode: selectedVendor.vendorCode,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
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

          {/* Vendor Selection */}
          <div>
            <Label className="mb-2 block">Select Vendor</Label>
            {loadingVendorStocks ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading vendors...</span>
              </div>
            ) : vendorStocks.length > 0 ? (
              <div className="space-y-2">
                {vendorStocks.map((vendor) => (
                  <button
                    key={vendor.vendorId}
                    onClick={() => setSelectedVendor(vendor)}
                    disabled={vendor.quantity === 0}
                    className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                      selectedVendor?.vendorId === vendor.vendorId
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    } ${vendor.quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{vendor.vendorName}</p>
                          <p className="text-xs text-muted-foreground">{vendor.vendorCode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{vendor.quantity} available</p>
                        {vendor.quantity <= 5 && vendor.quantity > 0 && (
                          <p className="text-xs text-orange-600">Low stock</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                <p className="font-medium">No stock available</p>
                <p className="text-xs mt-1">This variant is out of stock at the current branch</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-primary">{formatKES(pricing.unitPrice)}</p>
              {pricing.isWholesale && (
                <p className="text-xs text-secondary font-medium">Wholesale pricing active</p>
              )}
              <p className="text-xs text-muted-foreground">
                Stock: {selectedVendor ? `${selectedVendor.quantity} (${selectedVendor.vendorName})` : 'Select vendor'}
              </p>
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
                max={availableStock}
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(q => Math.min(availableStock, q + 1))}
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
