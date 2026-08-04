'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IProduct } from '@/models/Product'
import { getProductDisplayImage, getProductDisplayPrice } from '@/lib/product-utils'
import * as XLSX from 'xlsx'

export default function ProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [exporting, setExporting] = useState(false)

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
        
        // Debug: Log specific product with price issue
        const targetProduct = data.products?.find((p: any) => p._id === '6a54160f2dbf0b3b508645b3')
        if (targetProduct) {
          console.log('Target product (6a54160f2dbf0b3b508645b3) debug:', {
            id: targetProduct._id,
            name: targetProduct.name,
            price: targetProduct.price,
            priceType: typeof targetProduct.price,
            oldPrice: targetProduct.oldPrice,
            wholesalePrice: targetProduct.wholesalePrice
          })
        }
        
        // Also log first product for comparison
        if (data.products && data.products.length > 0) {
          console.log('First product for comparison:', {
            id: data.products[0]._id,
            name: data.products[0].name,
            price: data.products[0].price,
            priceType: typeof data.products[0].price
          })
        }
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

  const downloadProductsExcel = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/products/export-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryFilter || undefined,
          search: searchTerm || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Export error:', error)
        throw new Error(error.error || error.details || 'Failed to download Excel')
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : 'Javic_Products_Export.xlsx'

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading Excel:', error)
      alert('Failed to download Excel file. Please try again.')
    } finally {
      setExporting(false)
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

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, rowsPerPage])

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
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none gap-2 flex">
          <Button 
            variant="outline" 
            onClick={downloadProductsExcel} 
            disabled={exporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Preparing Excel...' : 'Download Products Excel'}
          </Button>
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <div className="text-sm text-gray-500 flex items-center justify-center sm:justify-start">
            <span className="text-center sm:text-left">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-md overflow-hidden">
        {/* Mobile Card Layout */}
        <div className="md:hidden">
          <div className="divide-y divide-gray-200">
            {paginatedProducts.map((product) => {
              const displayImage = getProductDisplayImage(product)
              const { price, oldPrice } = getProductDisplayPrice(product)
              
              return (
                <div key={product._id} className="p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        className="h-20 w-20 rounded-lg object-cover"
                        src={displayImage}
                        alt={product.name}
                      />
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {product.name}
                      </h3>
                      
                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          product.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {product.isFeatured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Featured
                          </span>
                        )}
                        {product.isFlashDeal && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Flash Deal
                          </span>
                        )}
                      </div>
                      
                      {/* Category and Price */}
                      <div className="mt-2 text-sm text-gray-600">
                        <p className="font-medium text-gray-900">{product.category}</p>
                        <p className="text-lg font-bold text-gray-900">
                          KSH {price}
                          {oldPrice && (
                            <span className="text-sm font-normal text-gray-400 line-through ml-2">
                              KSH {oldPrice}
                            </span>
                          )}
                        </p>
                      </div>
                      
                      {/* Stock and Rating */}
                      <div className="mt-1 text-xs text-gray-500">
                        <p>Stock: {product.stockQuantity} • Rating: {product.rating}/5 ({product.reviews} reviews)</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(product._id!, product.isActive)}
                        className="flex-1 min-w-[80px]"
                      >
                        {product.isActive ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Show
                          </>
                        )}
                      </Button>
                      <Link href={`/admin/products/${product._id}/edit`} className="flex-1 min-w-[80px]">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product._id!)}
                        className="flex-1 min-w-[80px] text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Desktop/Tablet Table Layout */}
        <div className="hidden md:block">
          <ul className="divide-y divide-gray-200">
            {paginatedProducts.map((product) => {
              const displayImage = getProductDisplayImage(product)
              const { price, oldPrice } = getProductDisplayPrice(product)
              
              return (
                <li key={product._id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0 h-16 w-16">
                        <img
                          className="h-16 w-16 rounded-lg object-cover"
                          src={displayImage}
                          alt={product.name}
                        />
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <p className="text-lg font-medium text-gray-900 truncate">
                            {product.name}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                            product.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {product.isFeatured && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                              Featured
                            </span>
                          )}
                          {product.isFlashDeal && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex-shrink-0">
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
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Stock: {product.stockQuantity} • Rating: {product.rating}/5 ({product.reviews} reviews)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(product._id!, product.isActive)}
                        title={product.isActive ? 'Hide product' : 'Show product'}
                      >
                        {product.isActive ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Link href={`/admin/products/${product._id}/edit`}>
                        <Button variant="outline" size="sm" title="Edit product">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product._id!)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete product"
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

      {/* Pagination Controls */}
      {filteredProducts.length > 0 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredProducts.length)}</span> of{' '}
                <span className="font-medium">{filteredProducts.length}</span> results
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}