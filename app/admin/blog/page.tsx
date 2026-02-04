'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IBlogPost } from '@/models/BlogPost'

export default function BlogPage() {
  const [posts, setPosts] = useState<IBlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [publishedFilter, setPublishedFilter] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/blog')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(data.posts.flatMap((post: IBlogPost) => post.categories))
        ) as string[]
        setCategories(uniqueCategories)
      } else {
        console.error('Failed to fetch blog posts:', response.status)
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return

    try {
      const response = await fetch(`/api/blog/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setPosts(posts.filter(post => post._id !== id))
      } else {
        alert('Failed to delete blog post')
      }
    } catch (error) {
      console.error('Error deleting blog post:', error)
      alert('Failed to delete blog post')
    }
  }

  const togglePublished = async (id: string, published: boolean) => {
    try {
      const response = await fetch(`/api/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !published })
      })
      
      if (response.ok) {
        setPosts(posts.map(post => 
          post._id === id ? { ...post, published: !published } : post
        ))
      }
    } catch (error) {
      console.error('Error updating blog post:', error)
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || post.categories.includes(categoryFilter)
    const matchesPublished = publishedFilter === '' || 
                            (publishedFilter === 'published' && post.published) ||
                            (publishedFilter === 'draft' && !post.published)
    return matchesSearch && matchesCategory && matchesPublished
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
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your blog content to educate customers about natural remedies.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link href="/admin/blog/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search posts..."
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
          <select
            value={publishedFilter}
            onChange={(e) => setPublishedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Posts</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
          <div className="text-sm text-gray-500 flex items-center">
            Showing {filteredPosts.length} of {posts.length} posts
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredPosts.map((post) => (
            <li key={post._id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center flex-1">
                  {post.featuredImage && (
                    <div className="flex-shrink-0 h-16 w-16 mr-4">
                      <img
                        className="h-16 w-16 rounded-lg object-cover"
                        src={post.featuredImage}
                        alt={post.title}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="text-lg font-medium text-gray-900">
                        {post.title}
                      </p>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    {post.subtitle && (
                      <p className="text-sm text-gray-600 mt-1">{post.subtitle}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-gray-400 space-x-4">
                      {post.author && (
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {post.author}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {post.publishedAt 
                          ? new Date(post.publishedAt).toLocaleDateString()
                          : new Date(post.createdAt).toLocaleDateString()
                        }
                      </div>
                      {post.categories.length > 0 && (
                        <div>
                          Categories: {post.categories.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePublished(post._id!, post.published)}
                  >
                    {post.published ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Link href={`/admin/blog/${post._id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(post._id!)}
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

      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            {searchTerm || categoryFilter || publishedFilter ? 'No posts match your filters' : 'No blog posts found'}
          </p>
          <Link href="/admin/blog/new">
            <Button>Create your first blog post</Button>
          </Link>
        </div>
      )}
    </div>
  )
}