'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ICategory } from '@/models/Category'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?includeInactive=true')
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setCategories(categories.filter(cat => cat._id !== id))
      } else {
        alert('Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })
      
      if (response.ok) {
        setCategories(categories.map(cat => 
          cat._id === id ? { ...cat, isActive: !isActive } : cat
        ))
      }
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your product categories, including their visibility and organization.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link href="/admin/categories/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {categories.map((category) => (
            <li key={category._id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-16 w-16">
                    <img
                      className="h-16 w-16 rounded-lg object-cover"
                      src={category.image || '/placeholder.svg'}
                      alt={category.name}
                    />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-lg font-medium text-gray-900">
                        {category.name}
                      </p>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {category.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Slug: {category.slug}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(category._id!, category.isActive)}
                  >
                    {category.isActive ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Link href={`/admin/categories/${category._id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(category._id!)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No categories found</p>
          <Link href="/admin/categories/new">
            <Button>Create your first category</Button>
          </Link>
        </div>
      )}
    </div>
  )
}