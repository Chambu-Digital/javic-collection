'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { IProduct } from '@/models/Product'
import { getProductDisplayImage, getProductDisplayPrice, getWholesaleInfo } from '@/lib/product-utils'

interface RelatedProductsProps {
  currentProductId: string
  category: string
}

export default function RelatedProducts({ currentProductId, category }: RelatedProductsProps) {
  const [relatedProducts, setRelatedProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRelatedProducts()
  }, [currentProductId, category])

  const fetchRelatedProducts = async () => {
    try {
      setLoading(true)
      // Use category name with improved API that has case-insensitive matching
      const response = await fetch(`/api/products?category=${encodeURIComponent(category)}&catalog=true&limit=8`)
      if (response.ok) {
        const data = await response.json()
        // Filter out current product and take first 4
        const filtered = data.products.filter((p: IProduct) => p._id !== currentProductId).slice(0, 4)
        setRelatedProducts(filtered)
      } else {
        console.error('Failed to fetch related products:', response.status)
      }
    } catch (error) {
      console.error('Error fetching related products:', error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <section className="mb-12">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-foreground text-balance">
        Related Products
      </h2>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, index) => (
            <div key={index} className="bg-card rounded-lg overflow-hidden animate-pulse">
              <div className="bg-muted h-48" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-20" />
                <div className="h-4 bg-muted rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : relatedProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {relatedProducts.map((product) => {
            const displayImage = getProductDisplayImage(product)
            const { price, oldPrice } = getProductDisplayPrice(product)
            
            // Check if product has wholesale pricing
            const hasWholesale = product.hasVariants 
              ? product.variants?.some(v => v.wholesalePrice && v.wholesaleThreshold)
              : !!(product.wholesalePrice && product.wholesaleThreshold)
            
            return (
              <div
                key={product._id}
                className="bg-card rounded-lg overflow-hidden hover:shadow-lg transition flex flex-col"
              >
                <Link href={`/product/${product._id}`}>
                  <div className="relative bg-muted overflow-hidden h-48 cursor-pointer">
                    <img
                      src={displayImage}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition"
                    />
                    {hasWholesale && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Bulk Available
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4 flex-1 flex flex-col">
                  <span className="text-xs text-muted-foreground mb-1">{product.category}</span>
                  
                  <Link href={`/product/${product._id}`}>
                    <h3 className="font-semibold text-sm md:text-base text-card-foreground hover:text-primary transition-colors mb-2 line-clamp-2 cursor-pointer">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-1 mb-3">
                    <div className="flex">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(product.rating)
                                ? 'fill-secondary text-secondary'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({product.reviews})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-base font-bold text-primary">
                      KSH {price}
                    </span>
                    {oldPrice && (
                      <span className="text-sm line-through text-muted-foreground">
                        KSH {oldPrice}
                      </span>
                    )}
                  </div>

                  <Link href={`/product/${product._id}`}>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm mt-auto">
                      View Product
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">
          No related products found in this category.
        </p>
      )}
    </section>
  )
}
