'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ICategory } from '@/models/Category'
import ImageUpload from '@/components/image-upload'

const iconOptions = [
  { value: 'Flower2', label: 'Flower' },
  { value: 'Leaf', label: 'Leaf' },
  { value: 'Droplet', label: 'Droplet' },
  { value: 'Wind', label: 'Wind' },
  { value: 'Soap', label: 'Soap' },
  { value: 'Heart', label: 'Heart' },
  { value: 'LeafIcon', label: 'Leaf Icon' },
  { value: 'Gift', label: 'Gift' },
]

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [category, setCategory] = useState<ICategory | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    icon: 'Leaf',
    isActive: true
  })

  useEffect(() => {
    fetchCategory()
  }, [resolvedParams.id])

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/categories/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setCategory(data)
        setFormData({
          name: data.name || '',
          description: data.description || '',
          image: data.image || '',
          icon: data.icon || 'Leaf',
          isActive: data.isActive !== undefined ? data.isActive : true
        })
      } else {
        alert('Category not found')
        router.push('/admin/categories')
      }
    } catch (error) {
      console.error('Error fetching category:', error)
      alert('Failed to load category')
    } finally {
      setLoading(false)
    }
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/categories/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Category updated successfully!')
        router.push('/admin/categories')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Failed to update category')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
        <Link href="/admin/categories">
          <Button>Back to Categories</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/categories" className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Categories
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Category</h1>
        <p className="text-gray-600">Update category information and settings</p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Category Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Skincare & Beauty"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what products are in this category..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Image *
                </label>
                
                <ImageUpload
                  onUpload={(imageUrl) => setFormData(prev => ({ ...prev, image: imageUrl }))}
                  onRemove={() => setFormData(prev => ({ ...prev, image: '' }))}
                  currentImage={formData.image}
                  watermarkText="© Serenleaf Natural"
                />


              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon *
                </label>
                <select
                  required
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {iconOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active (visible to customers)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Link href="/admin/categories">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? 'Updating...' : 'Update Category'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}