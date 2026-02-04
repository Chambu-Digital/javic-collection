'use client'

import { useState, useEffect } from 'react'
import { Star, Search, Filter, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { IProduct } from '@/models/Product'
import { getProductDisplayImage, getProductDisplayPrice } from '@/lib/product-utils'
import ProductSort from '@/components/product-sort'
import ViewToggle from '@/components/view-toggle'
import Breadcrumb from '@/components/breadcrumb'
import Header from '@/components/header'
import Footer from '@/components/footer'
import ActiveRatingDisplay from '@/components/active-rating-display'

export default function ProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([])
  const [dealProducts, setDealProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [showDeals, setShowDeals] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchDealProducts()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const categories = await response.json()
        const categoryNames = categories.map((cat: any) => cat.name)
        setAvailableCategories(categoryNames)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchDealProducts = async () => {
    try {
      const response = await fetch('/api/products?flashDeals=true&limit=4')
      if (response.ok) {
        const data = await response.json()
        setDealProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching deal products:', error)
    }
  }

  const fetchProducts = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const currentPage = loadMore ? page : 1
      const response = await fetch(`/api/products?catalog=true&page=${currentPage}&limit=12`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (loadMore) {
          setProducts(prev => [...prev, ...data.products])
        } else {
          setProducts(data.products)
        }
        
        setHasMore(data.products.length === 12)
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

  const filteredProducts = products.filter(product => {
    // Search filter
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !product.category.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
      return false
    }

    return true
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const { price: priceA } = getProductDisplayPrice(a)
    const { price: priceB } = getProductDisplayPrice(b)

    switch (sortBy) {
      case 'price-low':
        return priceA - priceB
      case 'price-high':
        return priceB - priceA
      case 'rating':
        return b.rating - a.rating
      case 'newest':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      default:
        return a.name.localeCompare(b.name)
    }
  })

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'All Products', href: '/products' }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-3">All Products</h1>
            <p className="text-primary-foreground/90">
              Discover our complete range of electronics and appliances
            </p>
          </div>
        </div>
      </div>
      
      <main className="flex-1 py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={breadcrumbItems} />

          {/* Deals Section - Compact */}
          {dealProducts.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-red-600 font-semibold">🔥 Hot Deals</span>
                  <span className="text-sm text-muted-foreground">Limited time offers</span>
                </div>
                <button
                  onClick={() => setShowDeals(!showDeals)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  {showDeals ? 'Hide' : 'View All'}
                </button>
              </div>
              
              {showDeals && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {dealProducts.map((product) => {
                    const displayImage = getProductDisplayImage(product)
                    const { price, oldPrice } = getProductDisplayPrice(product)
                    const discount = product.flashDealDiscount || 20
                    
                    return (
                      <Link key={product._id} href={`/product/${product._id}`}>
                        <div className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow border">
                          <img
                            src={displayImage}
                            alt={product.name}
                            className="w-full h-24 object-cover rounded mb-2"
                          />
                          <div className="space-y-1">
                            <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-red-600 font-bold text-sm">
                                KSH {price.toLocaleString()}
                              </span>
                              {oldPrice && (
                                <span className="text-xs line-through text-muted-foreground">
                                  KSH {oldPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                            <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                              -{discount}% OFF
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Search and Filters */}
          <div className="mb-6 space-y-3">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Filters and Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium">Categories:</span>
                {availableCategories.slice(0, 6).map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      if (selectedCategories.includes(category)) {
                        setSelectedCategories(prev => prev.filter(c => c !== category))
                      } else {
                        setSelectedCategories(prev => [...prev, category])
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      selectedCategories.includes(category)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-input hover:bg-muted'
                    }`}
                  >
                    {category}
                  </button>
                ))}
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <ProductSort
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
              
              <ViewToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
              
              <div className="text-sm text-muted-foreground">
                {sortedProducts.length} products
              </div>
            </div>
          </div>

          {/* Products Grid/List */}
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' 
              : 'space-y-3'
          }>
            {loading ? (
              // Loading skeleton
              Array(12).fill(0).map((_, index) => (
                <div
                  key={index}
                  className="bg-card rounded-lg overflow-hidden animate-pulse flex flex-col"
                >
                  <div className="bg-muted h-40" />
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="h-3 bg-muted rounded mb-1 w-16" />
                    <div className="h-4 bg-muted rounded mb-2 w-full" />
                    <div className="h-3 bg-muted rounded mb-3 w-20" />
                    <div className="h-4 bg-muted rounded mb-4 w-24" />
                  </div>
                </div>
              ))
            ) : (
              sortedProducts.map((product) => {
                const displayImage = getProductDisplayImage(product)
                const { price, oldPrice } = getProductDisplayPrice(product)
                const hasDiscount = oldPrice && oldPrice > price
                const isFlashDeal = product.flashDealDiscount && product.flashDealDiscount > 0
                
                return (
                  <div
                    key={product._id}
                    className={`bg-card rounded-lg overflow-hidden hover:shadow-md transition border ${
                      viewMode === 'list' ? 'flex' : 'flex flex-col'
                    }`}
                  >
                    <Link href={`/product/${product._id}`}>
                      <div className={`relative bg-muted overflow-hidden cursor-pointer ${
                        viewMode === 'list' ? 'w-32 h-24' : 'h-40'
                      }`}>
                        <img
                          src={displayImage}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition"
                        />
                        {hasDiscount && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            {isFlashDeal ? `${product.flashDealDiscount}% OFF` : 'SALE'}
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="p-3 flex-1 flex flex-col">
                      <span className="text-xs text-muted-foreground mb-1">{product.category}</span>

                      <Link href={`/product/${product._id}`}>
                        <h3 className="font-semibold text-sm text-card-foreground hover:text-primary transition-colors mb-2 line-clamp-2 cursor-pointer">
                          {product.name}
                        </h3>
                      </Link>

                      <ActiveRatingDisplay 
                        productId={product._id || ''}
                        initialRating={product.rating}
                        initialReviews={product.reviews}
                        size="sm"
                      />

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base font-bold text-primary">
                          KSH {price.toLocaleString()}
                        </span>
                        {oldPrice && (
                          <span className="text-sm line-through text-muted-foreground">
                            KSH {oldPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {viewMode === 'list' && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Empty State */}
          {!loading && sortedProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">
                No products found matching your criteria
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategories([])
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Load More Button */}
          {hasMore && !loading && sortedProducts.length > 0 && (
            <div className="text-center mt-6">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                className="px-6 py-2"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}