'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { IProduct } from '@/models/Product'
import { getProductDisplayImage, getProductDisplayPrice } from '@/lib/product-utils'

function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (query) {
      fetchSearchResults()
    }
  }, [query])

  const fetchSearchResults = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products?search=${encodeURIComponent(query)}&catalog=true`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <p className="text-muted-foreground">
          {query ? `Results for "${query}"` : 'Enter a search term'}
        </p>
      </div>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, index) => (
              <div key={index} className="bg-card rounded-lg overflow-hidden animate-pulse">
                <div className="bg-muted h-40" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => {
              const displayImage = getProductDisplayImage(product)
              const { price, oldPrice } = getProductDisplayPrice(product)
              
              return (
                <div key={product._id} className="bg-card rounded-lg overflow-hidden hover:shadow-md transition border">
                  <Link href={`/product/${product._id}`}>
                    <div className="relative bg-muted overflow-hidden h-40 cursor-pointer">
                      <img
                        src={displayImage}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition"
                      />
                    </div>
                  </Link>
                  <div className="p-3">
                    <span className="text-xs text-muted-foreground mb-1 block">{product.category}</span>
                    <Link href={`/product/${product._id}`}>
                      <h3 className="font-semibold text-sm text-card-foreground hover:text-primary transition-colors mb-2 line-clamp-2 cursor-pointer">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-primary">KSH {price.toLocaleString()}</span>
                      {oldPrice && (
                        <span className="text-sm line-through text-muted-foreground">KSH {oldPrice.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {query ? 'No products found matching your search' : 'Enter a search term to find products'}
            </p>
            <Link href="/products">
              <Button variant="outline">Browse All Products</Button>
            </Link>
          </div>
        )}
    </>
  )
}

export default function SearchPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-3">Search Results</h1>
            <p className="text-primary-foreground/90">
              Find the perfect electronics for your needs
            </p>
          </div>
        </div>
      </div>
      
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6">
        <Suspense fallback={
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, index) => (
                <div key={index} className="bg-card rounded-lg overflow-hidden animate-pulse">
                  <div className="bg-muted h-40" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        }>
          <SearchResults />
        </Suspense>
      </main>
      
      <Footer />
    </div>
  )
}