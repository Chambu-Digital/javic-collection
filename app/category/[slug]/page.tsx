'use client'

import { useState, useEffect, use } from 'react'
import { Grid, List, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/header'
import Footer from '@/components/footer'
import ProductCard from '@/components/product-card'
import Link from 'next/link'
import { IProduct } from '@/models/Product'
import { ICategory } from '@/models/Category'
import { getProductDisplayImage, getProductDisplayPrice } from '@/lib/product-utils'

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('featured')
  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState<ICategory | null>(null)
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCategoryAndProducts()
  }, [resolvedParams.slug])

  const fetchCategoryAndProducts = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch category by slug
      const categoryResponse = await fetch('/api/categories')
      if (categoryResponse.ok) {
        const categories = await categoryResponse.json()
        const foundCategory = categories.find((cat: ICategory) => cat.slug === resolvedParams.slug)
        
        if (!foundCategory) {
          setError('Category not found')
          setCategory(null)
          return
        }
        
        setCategory(foundCategory)
        
        // Fetch products for this category using category name (same as other working components)
        const productsResponse = await fetch(`/api/products?category=${encodeURIComponent(foundCategory.name)}`)
        
        if (productsResponse.ok) {
          const data = await productsResponse.json()
          setProducts(data.products || [])
        } else {
          console.error('Failed to fetch products:', productsResponse.status, await productsResponse.text())
          setError('Failed to load products for this category')
        }
      } else {
        console.error('Failed to fetch categories:', categoryResponse.status)
        setError('Failed to load categories')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load category data')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true
    return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           product.description.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        const priceA = getProductDisplayPrice(a).price
        const priceB = getProductDisplayPrice(b).price
        return priceA - priceB
      case 'price-high':
        const priceHighA = getProductDisplayPrice(a).price
        const priceHighB = getProductDisplayPrice(b).price
        return priceHighB - priceHighA
      case 'rating':
        return b.rating - a.rating
      case 'newest':
        return (b.isNewProduct ? 1 : 0) - (a.isNewProduct ? 1 : 0)
      default:
        return (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0)
    }
  })

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8" />
            <div className="h-64 bg-muted rounded mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-card rounded-lg overflow-hidden">
                  <div className="h-48 bg-muted" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
            <p className="text-muted-foreground mb-8">The category you're looking for doesn't exist.</p>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{category.name}</span>
        </div>

        {/* Category Header */}
        <div className="mb-12">
          <div className="relative h-48 md:h-64 rounded-lg overflow-hidden mb-6">
            <img
              src={category.image || '/placeholder.svg'}
              alt={category.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{category.name}</h1>
                <p className="text-lg md:text-xl max-w-2xl">{category.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4 flex-1">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search products in this category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Showing {filteredProducts.length} of {products.length} products
            </span>
            
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest</option>
                <option value="rating">Highest Rated</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>



        {/* Products Grid/List */}
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {sortedProducts.map((product) => {
            const displayImage = getProductDisplayImage(product)
            const { price, oldPrice } = getProductDisplayPrice(product)
            
            return (
              <ProductCard
                key={product._id}
                product={{
                  id: product._id!,
                  name: product.name,
                  price: price,
                  oldPrice: oldPrice,
                  rating: product.rating,
                  reviews: product.reviews,
                  image: displayImage,
                  inStock: product.inStock,
                  isNew: product.isNewProduct,
                  isBestseller: product.isBestseller
                }}
                viewMode={viewMode}
              />
            )
          })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && products.length > 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">
              No products found matching "{searchTerm}"
            </p>
            <Button
              onClick={() => setSearchTerm('')}
              variant="outline"
            >
              Clear Search
            </Button>
          </div>
        )}

        {products.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">
              No products available in this category yet
            </p>
          </div>
        )}

        {/* Load More */}
        {sortedProducts.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" className="px-8 py-3">
              Load More Products
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}