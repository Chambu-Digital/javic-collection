'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, EyeOff, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IProduct } from '@/models/Product'
import { getProductDisplayImage, getProductDisplayPrice } from '@/lib/product-utils'

export default function ProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      // For admin, we need to see inactive products too
      const response = await fetch('/api/products?includeInactive=true')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        console.error('Failed to fetch products:', response.status)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        const categoryNames = data.map((cat: any) => cat.name)
        setCategories(categoryNames)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setProducts(products.filter(product => product._id !== id))
      } else {
        alert('Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })
      
      if (response.ok) {
        setProducts(products.map(product => 
          product._id === id ? { ...product, isActive: !isActive } : product
        ))
      }
    } catch (error) {
      console.error('Error updating product:', error)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    // Case-insensitive category matching for better reliability
    const matchesCategory = !categoryFilter || 
                           product.category.toLowerCase() === categoryFilter.toLowerCase()
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your product inventory, pricing, and availability.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link href="/admin/products/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <div className="text-sm text-gray-500 flex items-center">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredProducts.map((product) => {
            const displayImage = getProductDisplayImage(product)
            const { price, oldPrice } = getProductDisplayPrice(product)
            
            return (
              <li key={product._id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16">
                      <img
                        className="h-16 w-16 rounded-lg object-cover"
                        src={displayImage}
                        alt={product.name}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-lg font-medium text-gray-900">
                          {product.name}
                        </p>
                        {product.hasVariants && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Has Variants
                          </span>
                        )}
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {product.isFeatured && (
                          <span className="ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Featured
                          </span>
                        )}
                        {product.isFlashDeal && (
                          <span className="ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Flash Deal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {product.category} • KSH {price}
                        {oldPrice && (
                          <span className="line-through text-gray-400 ml-2">
                            KSH {oldPrice}
                          </span>
                        )}
                        {product.hasVariants && (
                          <span className="text-xs text-blue-600 ml-2">
                            (Starting from cheapest variant)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Stock: {product.stockQuantity} • Rating: {product.rating}/5 ({product.reviews} reviews)
                      </p>
                    </div>
                  </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(product._id!, product.isActive)}
                  >
                    {product.isActive ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Link href={`/admin/products/${product._id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(product._id!)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
            )
          })}
        </ul>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            {searchTerm || categoryFilter ? 'No products match your filters' : 'No products found'}
          </p>
          <Link href="/admin/products/new">
            <Button>Create your first product</Button>
          </Link>
        </div>
      )}
    </div>
  )
}