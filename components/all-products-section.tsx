'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ActiveRatingDisplay from '@/components/active-rating-display'
import { IProduct } from '@/models/Product'
import { getProductDisplayImage, getProductDisplayPrice } from '@/lib/product-utils'

export default function AllProductsSection() {
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const currentPage = loadMore ? page : 1
      const response = await fetch(`/api/products?catalog=true&page=${currentPage}&limit=8`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (loadMore) {
          setProducts(prev => [...prev, ...data.products])
        } else {
          setProducts(data.products)
        }
        
        setHasMore(data.products.length === 8)
        if (loadMore) {
          setPage(prev => prev + 1)
        } else {
          setPage(2)
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    fetchProducts(true)
  }

  return (
    <section className="py-8 md:py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance mb-4 sm:mb-0">
           Our Products
          </h2>
          <Link href="/products">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3">
              View All Products
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            // Loading skeleton
            Array(8).fill(0).map((_, index) => (
              <div
                key={index}
                className="bg-card rounded-lg overflow-hidden animate-pulse flex flex-col"
              >
                <div className="bg-muted h-48" />
                <div className="p-4 flex-1 flex flex-col">
                  <div className="h-3 bg-muted rounded mb-1 w-16" />
                  <div className="h-4 bg-muted rounded mb-2 w-full" />
                  <div className="h-3 bg-muted rounded mb-3 w-20" />
                  <div className="h-4 bg-muted rounded mb-4 w-24" />
                  <div className="h-8 bg-muted rounded w-full mt-auto" />
                </div>
              </div>
            ))
          ) : (
            products.map((product) => {
              const displayImage = getProductDisplayImage(product)
              const { price, oldPrice } = getProductDisplayPrice(product)
              
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
                    </div>
                  </Link>

                  <div className="p-4 flex-1 flex flex-col">
                    <span className="text-xs text-muted-foreground mb-1">{product.category}</span>

                    <Link href={`/product/${product._id}`}>
                      <h3 className="font-semibold text-sm md:text-base text-card-foreground hover:text-primary transition-colors mb-2 line-clamp-2 cursor-pointer">
                        {product.name}
                      </h3>
                    </Link>

                    <ActiveRatingDisplay 
                      productId={product._id || ''}
                      initialRating={product.rating}
                      initialReviews={product.reviews}
                      size="sm"
                    />

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

                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Load More Button */}
        {hasMore && !loading && (
          <div className="text-center mt-8 space-y-4">
            <Button
              onClick={handleLoadMore}
              disabled={loadingMore}
              variant="outline"
              className="px-8 py-3 mr-4"
            >
              {loadingMore ? 'Loading...' : 'Load More Products'}
            </Button>
            {/* <div className="text-sm text-muted-foreground">
              or{' '}
              <Link href="/products" className="text-primary hover:underline font-medium">
                view all products
              </Link>
            </div> */}
          </div>
        )}

        {/* When no more products to load */}
        {/* {!hasMore && !loading && products.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">You've seen all products in this preview</p>
            <Link href="/products">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3">
                View All Products with Filters
              </Button>
            </Link>
          </div>
        )} */}
      </div>
    </section>
  )
}