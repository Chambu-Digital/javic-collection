'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, Search, Edit, Building2, CheckCircle, XCircle, 
  Loader2, Home 
} from 'lucide-react'

interface Vendor {
  _id: string
  name: string
  vendorCode: string
  isActive: boolean
  isHouseStock: boolean
  createdAt: string
}

export default function VendorsPage() {
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    vendorCode: '',
    isActive: true,
    isHouseStock: false
  })

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/vendors')
      const data = await res.json()
      setVendors(data.vendors || [])
    } catch (error) {
      console.error('Failed to fetch vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingVendor(null)
    setFormData({
      name: '',
      vendorCode: '',
      isActive: true,
      isHouseStock: false
    })
    setShowModal(true)
  }

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setFormData({
      name: vendor.name,
      vendorCode: vendor.vendorCode,
      isActive: vendor.isActive,
      isHouseStock: vendor.isHouseStock
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.vendorCode.trim()) {
      alert('Name and Vendor Code are required')
      return
    }

    setSaving(true)
    try {
      const url = editingVendor 
        ? `/api/admin/vendors/${editingVendor._id}` 
        : '/api/admin/vendors'
      
      const res = await fetch(url, {
        method: editingVendor ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save vendor')
      }

      await fetchVendors()
      setShowModal(false)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (vendor: Vendor) => {
    if (!confirm(`${vendor.isActive ? 'Deactivate' : 'Activate'} ${vendor.name}?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/vendors/${vendor._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vendor,
          isActive: !vendor.isActive
        })
      })

      if (!res.ok) {
        throw new Error('Failed to update vendor status')
      }

      await fetchVendors()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.vendorCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Vendors</h1>
            <p className="text-muted-foreground mt-1">
              Manage inventory ownership and vendor accounts
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors by name or code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Vendors List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">
              {searchQuery ? 'No vendors found' : 'No vendors yet'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Vendor
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredVendors.map(vendor => (
              <div
                key={vendor._id}
                className={`bg-card border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  !vendor.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {vendor.isHouseStock ? (
                      <Home className="h-5 w-5 text-primary" />
                    ) : (
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <h3 className="font-semibold">{vendor.name}</h3>
                      <p className="text-sm text-muted-foreground">{vendor.vendorCode}</p>
                    </div>
                  </div>
                  {vendor.isActive ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>

                {vendor.isHouseStock && (
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                      Store Owned
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(vendor)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant={vendor.isActive ? "destructive" : "default"}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleToggleStatus(vendor)}
                  >
                    {vendor.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h2>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <Label htmlFor="name">Vendor Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe, Supplier Co."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="vendorCode">Vendor Code *</Label>
                  <Input
                    id="vendorCode"
                    value={formData.vendorCode}
                    onChange={e => setFormData({ 
                      ...formData, 
                      vendorCode: e.target.value.toUpperCase() 
                    })}
                    placeholder="e.g. JOHN, SUP01"
                    className="mt-1"
                    disabled={!!editingVendor}
                  />
                  {editingVendor && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Vendor code cannot be changed after creation
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isHouseStock"
                    checked={formData.isHouseStock}
                    onChange={e => setFormData({ 
                      ...formData, 
                      isHouseStock: e.target.checked 
                    })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isHouseStock" className="cursor-pointer">
                    Store-Owned Inventory (House Stock)
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => setFormData({ 
                      ...formData, 
                      isActive: e.target.checked 
                    })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Active
                  </Label>
                </div>

                <div className="bg-muted/50 rounded-md p-3 text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Note:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Vendor code must be unique</li>
                    <li>Use "Store-Owned" for your own inventory</li>
                    <li>Inactive vendors cannot be selected for new sales</li>
                  </ul>
                </div>
              </div>

              <div className="px-6 py-4 border-t flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingVendor ? 'Save Changes' : 'Create Vendor'}
                </Button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
