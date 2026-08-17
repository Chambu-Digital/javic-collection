'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Building2, 
  MapPin, 
  Star,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { useUserStore } from '@/lib/user-store'

interface Branch {
  _id: string
  name: string
  branchCode: string
  location?: string
  address?: string
  isActive: boolean
  isMainBranch: boolean
  createdAt?: string
  updatedAt?: string
}

interface BranchFormData {
  name: string
  branchCode: string
  location: string
  address: string
  isActive: boolean
  isMainBranch: boolean
}

export default function BranchesPage() {
  const { user } = useUserStore()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<any>(null)
  const [formData, setFormData] = useState<BranchFormData>({
    name: '',
    branchCode: '',
    location: '',
    address: '',
    isActive: true,
    isMainBranch: false
  })

  useEffect(() => {
    if (user) {
      fetchBranches()
      checkMigrationStatus()
    }
  }, [user])

  const checkMigrationStatus = async () => {
    try {
      const response = await fetch('/api/admin/migrate-stock', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setMigrationStatus(data)
      }
    } catch (error) {
      console.error('Error checking migration status:', error)
    }
  }

  const fetchBranches = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/branches', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setBranches(data.branches)
      } else {
        toast.error('Failed to fetch branches')
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
      toast.error('Error fetching branches')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      branchCode: '',
      location: '',
      address: '',
      isActive: true,
      isMainBranch: false
    })
    setEditingBranch(null)
    setShowForm(false)
  }

  const handleEdit = (branch: Branch) => {
    setFormData({
      name: branch.name,
      branchCode: branch.branchCode,
      location: branch.location || '',
      address: branch.address || '',
      isActive: branch.isActive,
      isMainBranch: branch.isMainBranch
    })
    setEditingBranch(branch)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim() || !formData.branchCode.trim()) {
      toast.error('Name and branch code are required')
      return
    }

    try {
      const url = editingBranch
        ? `/api/admin/branches/${editingBranch._id}`
        : '/api/admin/branches'
      
      const method = editingBranch ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(editingBranch ? 'Branch updated successfully' : 'Branch created successfully')
        await fetchBranches()
        resetForm()
      } else {
        toast.error(data.error || 'Failed to save branch')
      }
    } catch (error) {
      console.error('Error saving branch:', error)
      toast.error('Error saving branch')
    }
  }

  const handleDelete = async (branchId: string, branchName: string) => {
    if (!confirm(`Are you sure you want to delete "${branchName}"? If it has historical records, it will be deactivated instead.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/branches/${branchId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Branch deleted successfully')
        await fetchBranches()
      } else {
        toast.error(data.error || 'Failed to delete branch')
      }
    } catch (error) {
      console.error('Error deleting branch:', error)
      toast.error('Error deleting branch')
    }
  }

  const toggleActive = async (branchId: string, currentStatus: boolean, isMainBranch: boolean) => {
    if (isMainBranch && currentStatus) {
      toast.error('Cannot deactivate the main branch')
      return
    }

    try {
      const branch = branches.find(b => b._id === branchId)
      if (!branch) return

      const response = await fetch(`/api/admin/branches/${branchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...branch,
          isActive: !currentStatus
        })
      })

      if (response.ok) {
        toast.success(`Branch ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
        await fetchBranches()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update branch')
      }
    } catch (error) {
      console.error('Error toggling branch status:', error)
      toast.error('Error updating branch')
    }
  }

  const runMigration = async () => {
    if (!confirm('This will migrate all existing product stock to the Main Branch. Continue?')) {
      return
    }

    try {
      setMigrating(true)
      const response = await fetch('/api/admin/migrate-stock', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Migration completed! ${data.stats.stockRecordsCreated} stock records created`)
        await checkMigrationStatus()
      } else {
        toast.error(data.error || 'Migration failed')
      }
    } catch (error) {
      console.error('Error running migration:', error)
      toast.error('Error running migration')
    } finally {
      setMigrating(false)
    }
  }

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to manage branches.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  const mainBranch = branches.find(b => b.isMainBranch)
  const hasMainBranch = !!mainBranch

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Branch Management
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your store branches and inventory locations
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Branch
        </Button>
      </div>

      {/* Info Alert */}
      {!hasMainBranch && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900">No Main Branch Set</h3>
            <p className="text-sm text-yellow-700 mt-1">
              You need to designate one branch as the main branch. Existing inventory will be assigned to the main branch.
            </p>
          </div>
        </div>
      )}

      {/* Migration Alert */}
      {migrationStatus?.migrationNeeded && hasMainBranch && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Stock Migration Required</h3>
              <p className="text-sm text-blue-700 mt-1">
                You have {migrationStatus.totalProducts} products with existing inventory that need to be migrated 
                to the branch-based inventory system. All existing stock will be assigned to the Main Branch.
              </p>
              <Button
                onClick={runMigration}
                disabled={migrating}
                className="mt-3"
                size="sm"
              >
                {migrating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  'Run Migration Now'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Migration Status */}
      {migrationStatus && !migrationStatus.migrationNeeded && migrationStatus.totalBranchStocks > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">Branch Inventory Active</h3>
            <p className="text-sm text-green-700 mt-1">
              {migrationStatus.totalBranchStocks} branch stock records tracking {migrationStatus.totalStockQuantity} units
            </p>
          </div>
        </div>
      )}

      {/* Form Card */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingBranch ? 'Edit Branch' : 'Create New Branch'}
            </CardTitle>
            <CardDescription>
              {editingBranch 
                ? 'Update branch information' 
                : 'Add a new branch to your inventory system'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Branch Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Main Branch"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="branchCode">Branch Code *</Label>
                  <Input
                    id="branchCode"
                    value={formData.branchCode}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      branchCode: e.target.value.toUpperCase() 
                    })}
                    placeholder="MAIN"
                    maxLength={20}
                    required
                    disabled={!!editingBranch}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Unique code (uppercase letters, numbers, - and _ only)
                  </p>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Downtown"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Active
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isMainBranch"
                    checked={formData.isMainBranch}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, isMainBranch: checked })
                    }
                    disabled={editingBranch?.isMainBranch}
                  />
                  <Label htmlFor="isMainBranch" className="cursor-pointer">
                    Main Branch
                  </Label>
                  {editingBranch?.isMainBranch && (
                    <span className="text-xs text-gray-500">(cannot be changed)</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {editingBranch ? 'Update Branch' : 'Create Branch'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Branches List */}
      <div className="space-y-4">
        {branches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No branches yet</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first branch</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Branch
              </Button>
            </CardContent>
          </Card>
        ) : (
          branches.map((branch) => (
            <Card key={branch._id} className={!branch.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {branch.name}
                      </h3>
                      <Badge variant="outline" className="font-mono">
                        {branch.branchCode}
                      </Badge>
                      {branch.isMainBranch && (
                        <Badge className="bg-blue-500 flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Main Branch
                        </Badge>
                      )}
                      {!branch.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {branch.isActive && !branch.isMainBranch && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      )}
                    </div>

                    {(branch.location || branch.address) && (
                      <div className="flex items-start gap-2 text-sm text-gray-600 mt-2">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          {branch.location && <div>{branch.location}</div>}
                          {branch.address && <div>{branch.address}</div>}
                        </div>
                      </div>
                    )}

                    {branch.createdAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Created {new Date(branch.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(branch._id, branch.isActive, branch.isMainBranch)}
                      disabled={branch.isMainBranch && branch.isActive}
                    >
                      {branch.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(branch)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    {!branch.isMainBranch && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(branch._id, branch.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
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
