'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { ICategory } from '@/models/Category'
import Breadcrumb from '@/components/breadcrumb'
import Header from '@/components/header'
import Footer from '@/components/footer'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-3">All Categories</h1>
            <p className="text-primary-foreground/90">
              Browse our complete range of electronics categories
            </p>
          </div>
        </div>
      </div>
      
      <main className="flex-1 py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={breadcrumbItems} />

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              // Loading skeleton
              Array(6).fill(0).map((_, index) => (
                <div
                  key={index}
                  className="bg-card rounded-lg overflow-hidden animate-pulse"
                >
                  <div className="h-40 bg-muted" />
                  <div className="p-4">
                    <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-full mb-1" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </div>
              ))
            ) : (
              filteredCategories.map((category) => (
                <Link
                  key={category._id}
                  href={`/category/${category.slug}`}
                  className="group bg-card rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100"
                >
                  {/* Category Image */}
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                    <img
                      src={category.image || '/placeholder.svg'}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </div>

                  {/* Category Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 line-clamp-2 text-sm">
                      {category.description}
                    </p>
                    
                    {/* Shop now indicator */}
                    <div className="flex items-center mt-4 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>Browse Products</span>
                      <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Empty State */}
          {!loading && filteredCategories.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">
                {searchTerm ? 'No categories found matching your search' : 'No categories available'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-primary hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* Back to Products */}
          <div className="text-center mt-12">
            <Link href="/products">
              <button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md">
                Our Products
              </button>
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}