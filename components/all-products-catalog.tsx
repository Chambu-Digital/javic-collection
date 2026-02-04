'use client'

import { useState, useEffect } from 'react'
import { Star, Filter, Search, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { IProduct } from '@/models/Product'
import { ICategory } from '@/models/Category'
import { getProductDisplayImage, getProductDisplayPrice, getWholesaleInfo } from '@/lib/product-utils'

export default function AllProductsCatalog({ onAddToCart }: { onAddToCart: () => void }) {
  const [products, setProducts] = useState<IProduct[]>([])
  const [categories, setCategories] = useState<ICategory[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)

  const PRODUCTS_PER_PAGE = 12

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts(true) // Reset when filters change
  }, [searchTerm, selectedCategory, sortBy, sortOrder])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProducts = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setPage(1)
      } else {
        setLoadingMore(true)
      }

      const currentPage = reset ? 1 : page
      const params = new URLSearchParams({
        catalog: 'true',
        page: currentPage.toString(),
        limit: PRODUCTS_PER_PAGE.toString(),
        sort: sortBy,
        order: sortOrder
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)

      const response = await fetch(`/api/products?${params}`)
      if (response.ok) {
        const data = await response.json()
        
        if (reset) {
          setProducts(data.products)
        } else {
          setProducts(prev => [...prev, ...data.products])
        }
        
        setTotalProducts(data.pagination.total)
        setHasMore(data.products.length === PRODUCTS_PER_PAGE)
        
        if (!reset) {
          setPage(prev => prev + 1)
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
    if (!loadingMore && hasMore) {
      fetchProducts(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProducts(true)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSortBy('createdAt')
    setSortOrder('desc')
  }

  return (
    <section className="py-8 md:py-12 px-4 md:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Complete Product Catalog
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover our full range of natural products. Browse, filter, and find exactly what you're looking for.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-8">
          {/* Mobile Filter Toggle */}
          <div className="md:hidden mb-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>

          {/* Filter Controls */}
          <div className={`space-y-4 md:space-y-0 md:grid md:grid-cols-4 md:gap-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </form>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Sort By */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="createdAt">Newest First</option>
                <option value="name">Name A-Z</option>
                <option value="price">Price Low-High</option>
                <option value="rating">Highest Rated</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Sort Order & Clear */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex-1"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex-1"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-muted-foreground">
            Showing {products.length} of {totalProducts} products
            {selectedCategory && ` in ${selectedCategory}`}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array(12).fill(0).map((_, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden animate-pulse">
                <div className="bg-gray-200 h-48" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-16" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-20" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-8 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => {
                const displayImage = getProductDisplayImage(product)
                const { price, oldPrice } = getProductDisplayPrice(product)
                
                // Check if product has wholesale pricing
                const hasWholesale = product.hasVariants 
                  ? product.variants?.some(v => v.wholesalePrice && v.wholesaleThreshold)
                  : !!(product.wholesalePrice && product.wholesaleThreshold)
                
                return (
                  <div
                    key={product._id}
                    className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
                  >
                    <Link href={`/product/${product._id}`}>
                      <div className="relative bg-gray-100 overflow-hidden h-48 cursor-pointer group">
                        <img
                          src={displayImage}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.isNew && (
                          <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                            New
                          </span>
                        )}
                        {product.isBestseller && (
                          <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                            Bestseller
                          </span>
                        )}
                        {product.isFlashDeal && (
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                            -{product.flashDealDiscount}%
                          </span>
                        )}
                        {hasWholesale && (
                          <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-bold">
                            Bulk Available
                          </span>
                        )}
                      </div>

                      {/* Stock Status */}
                      <div className="absolute top-2 right-2">
                        {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                          <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
                            Low Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="p-4">
                    <span className="text-xs text-muted-foreground mb-1 block">{product.category}</span>

                    <Link href={`/product/${product._id}`}>
                      <h3 className="font-semibold text-sm md:text-base text-foreground hover:text-primary transition-colors mb-2 line-clamp-2 cursor-pointer">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      <div className="flex">
                        {Array(5).fill(0).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(product.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({product.reviews})
                      </span>
                    </div>

                    {/* Price */}
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

                    {/* Add to Cart */}
                    <Button
                      onClick={onAddToCart}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
                      disabled={product.stockQuantity === 0}
                    >
                      {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
                  </div>
                </div>
                )
              })}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="px-8 py-3"
                >
                  {loadingMore ? 'Loading...' : 'Load More Products'}
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">
              {searchTerm || selectedCategory 
                ? 'No products found matching your criteria' 
                : 'No products available'
              }
            </p>
            {(searchTerm || selectedCategory) && (
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}