'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatKES } from '@/lib/pos/money'
import { Plus } from 'lucide-react'

export interface PosProductCardProduct {
  _id: string
  name: string
  slug?: string
  images?: { url: string; sku?: string; stock?: number }[]
  price: number
  wholesalePrice?: number
  stock?: number
  available?: boolean
  lowStock?: boolean
}

interface PosProductCardProps {
  product: PosProductCardProduct
  pricingMode: 'retail' | 'wholesale'
  onSelect: (product: PosProductCardProduct) => void
}

export default function PosProductCard({ product, pricingMode, onSelect }: PosProductCardProps) {
  const image = product.images?.[0]?.url || '/placeholder.svg'
  const outOfStock = !product.available
  const displayPrice = pricingMode === 'wholesale' && product.wholesalePrice
    ? product.wholesalePrice
    : product.price

  // Log for debugging - verify frontend receives correct stock
  console.log('[Frontend Stock Debug]', {
    productId: product._id,
    productName: product.name,
    apiStockValue: product.stock,
    renderedStockValue: product.stock
  })

  return (
    <div
      className={`bg-card border border-border rounded-lg overflow-hidden flex flex-col cursor-pointer ${
        outOfStock
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:border-primary/50 hover:shadow-sm transition-all'
      }`}
      onClick={() => !outOfStock && onSelect(product)}
    >
      <div className="relative aspect-square bg-muted">
        <Image
          src={image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Badge variant="destructive">Out of Stock</Badge>
          </div>
        )}
        {product.lowStock && !outOfStock && (
          <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-xs">
            Low Stock
          </Badge>
        )}
        {pricingMode === 'wholesale' && product.wholesalePrice && !outOfStock && (
          <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">WS</Badge>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col gap-1.5">
        <h3 className="text-sm font-medium line-clamp-2 leading-snug">{product.name}</h3>

        <div className="text-xs text-muted-foreground">
          {product.stock !== undefined && (
            <span className={product.stock <= 5 && product.stock > 0 ? 'text-amber-600' : ''}>
              Stock: {product.stock}
            </span>
          )}
          {product.images?.[0]?.sku && (
            <span className="ml-1">· {product.images[0].sku}</span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <p className="font-semibold text-primary text-sm">{formatKES(displayPrice)}</p>
            {product.wholesalePrice && pricingMode === 'retail' && (
              <p className="text-xs text-muted-foreground">WS: {formatKES(product.wholesalePrice)}</p>
            )}
          </div>
          <Button
            size="sm"
            disabled={outOfStock}
            onClick={(e) => { e.stopPropagation(); onSelect(product) }}
            className="shrink-0 h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
