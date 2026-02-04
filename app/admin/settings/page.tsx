'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import ImageUpload from '@/components/image-upload'
import { Trash2, Edit, Plus, GripVertical } from 'lucide-react'
import { toast } from 'sonner'

interface Banner {
  _id?: string
  title: string
  subtitle: string
  image: string
  isActive: boolean
  order: number
}

export default function SettingsPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Banner>({
    title: '',
    subtitle: '',
    image: '',
    isActive: true,
    order: 0
  })

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/admin/banners')
      if (response.ok) {
        const data = await response.json()
        setBanners(data)
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
      toast.error('Failed to fetch banners')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.subtitle || !formData.image) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const url = editingBanner 
        ? `/api/admin/banners/${editingBanner._id}`
        : '/api/admin/banners'
      
      const method = editingBanner ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingBanner ? 'Banner updated successfully' : 'Banner created successfully')
        fetchBanners()
        resetForm()
      } else {
        toast.error('Failed to save banner')
      }
    } catch (error) {
      console.error('Error saving banner:', error)
      toast.error('Failed to save banner')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return

    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Banner deleted successfully')
        fetchBanners()
      } else {
        toast.error('Failed to delete banner')
      }
    } catch (error) {
      console.error('Error deleting banner:', error)
      toast.error('Failed to delete banner')
    }
  }

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setFormData(banner)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      image: '',
      isActive: true,
      order: 0
    })
    setEditingBanner(null)
    setShowForm(false)
  }

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, image: url }))
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your website banners and hero images</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Banner
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingBanner ? 'Edit Banner' : 'Add New Banner'}</CardTitle>
            <CardDescription>
              Create or edit banner content for the hero slider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter banner title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    placeholder="Display order"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subtitle">Subtitle *</Label>
                <Textarea
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Enter banner subtitle"
                  required
                />
              </div>

              <div>
                <Label>Banner Image *</Label>
                <ImageUpload
                  onUpload={handleImageUpload}
                  currentImage={formData.image}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        <h2 className="text-2xl font-semibold">Current Banners</h2>
        {banners.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No banners found</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Banner
              </Button>
            </CardContent>
          </Card>
        ) : (
          banners.map((banner) => (
            <Card key={banner._id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                  </div>
                  
                  <div className="shrink-0 w-24 h-16 rounded-lg overflow-hidden bg-muted">
                    {banner.image && (
                      <img
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{banner.title}</h3>
                        <p className="text-muted-foreground text-sm mt-1">{banner.subtitle}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={banner.isActive ? 'default' : 'secondary'}>
                            {banner.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">Order: {banner.order}</Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(banner)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(banner._id!)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}