'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import ImageUpload from '@/components/image-upload'
import { IProduct } from '@/models/Product'
import { Save, Eye, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewBlogPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<IProduct[]>([])
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    slug: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    images: [] as string[],
    author: '',
    tags: [] as string[],
    categories: [] as string[],
    relatedProducts: [] as string[],
    published: false,
    metaDescription: '',
    metaKeywords: ''
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleArrayInputChange = (name: string, value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item)
    setFormData(prev => ({
      ...prev,
      [name]: items
    }))
  }

  const handleProductSelection = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      relatedProducts: prev.relatedProducts.includes(productId)
        ? prev.relatedProducts.filter(id => id !== productId)
        : [...prev.relatedProducts, productId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        published: publish
      }

      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        router.push('/admin/blog')
      } else {
        const error = await response.json()
        alert(`Failed to create blog post: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating blog post:', error)
      alert('Failed to create blog post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/blog">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create New Blog Post</h1>
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, false)}
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
            >
              <Eye className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Subtitle</label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Slug <span className="text-gray-500">(auto-generated if empty)</span>
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="Leave empty to auto-generate from title"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Author</label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Excerpt *</label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                required
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief summary of the blog post..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Content *</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows={12}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Write your blog post content here..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Images</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image</label>
              <ImageUpload
                currentImage={formData.featuredImage}
                onUpload={(url) => setFormData(prev => ({ ...prev, featuredImage: url }))}
                onRemove={() => setFormData(prev => ({ ...prev, featuredImage: '' }))}
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Organization</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Categories</label>
              <input
                type="text"
                value={formData.categories.join(', ')}
                onChange={(e) => handleArrayInputChange('categories', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="herbs, skincare, digestion (comma separated)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tags</label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) => handleArrayInputChange('tags', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="natural, remedy, health (comma separated)"
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Related Products</h2>
          <p className="text-sm text-gray-600 mb-4">Select products to promote within this blog post</p>
          
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <label key={product._id} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.relatedProducts.includes(product._id!)}
                  onChange={() => handleProductSelection(product._id!)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{product.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">SEO</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Meta Description</label>
              <textarea
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="SEO description for search engines..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Meta Keywords</label>
              <input
                type="text"
                name="metaKeywords"
                value={formData.metaKeywords}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}