'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Edit2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

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

interface BranchInfoTabProps {
  branch: Branch
  onUpdate: (branch: Branch) => void
}

export default function BranchInfoTab({ branch, onUpdate }: BranchInfoTabProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: branch.name,
    location: branch.location || '',
    address: branch.address || '',
    isActive: branch.isActive
  })

  const handleEdit = () => {
    setFormData({
      name: branch.name,
      location: branch.location || '',
      address: branch.address || '',
      isActive: branch.isActive
    })
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Branch name is required')
      return
    }

    try {
      setSaving(true)

      const response = await fetch(`/api/admin/branches/${branch._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          branchCode: branch.branchCode,
          location: formData.location,
          address: formData.address,
          isActive: formData.isActive,
          isMainBranch: branch.isMainBranch
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Branch updated successfully')
        onUpdate(data.branch)
        setEditing(false)
      } else {
        toast.error(data.error || 'Failed to update branch')
      }
    } catch (error) {
      console.error('Error updating branch:', error)
      toast.error('Error updating branch')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Branch Details</CardTitle>
          {!editing && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Branch Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Branch name"
                />
              </div>

              <div>
                <Label htmlFor="branchCode">Branch Code</Label>
                <Input
                  id="branchCode"
                  value={branch.branchCode}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Branch code cannot be changed after creation
                </p>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Downtown, Westlands"
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isActive: checked })
                  }
                  disabled={branch.isMainBranch && branch.isActive}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active
                </Label>
                {branch.isMainBranch && branch.isActive && (
                  <span className="text-xs text-gray-500">(main branch must stay active)</span>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500">Branch Name</Label>
                <p className="text-lg font-medium">{branch.name}</p>
              </div>

              <div>
                <Label className="text-gray-500">Branch Code</Label>
                <p className="text-lg font-medium font-mono">{branch.branchCode}</p>
              </div>

              {branch.location && (
                <div>
                  <Label className="text-gray-500">Location</Label>
                  <p className="text-lg">{branch.location}</p>
                </div>
              )}

              {branch.address && (
                <div>
                  <Label className="text-gray-500">Address</Label>
                  <p className="text-lg">{branch.address}</p>
                </div>
              )}

              <div>
                <Label className="text-gray-500">Status</Label>
                <p className="text-lg">
                  {branch.isActive ? (
                    <span className="text-green-600 font-medium">Active</span>
                  ) : (
                    <span className="text-gray-600 font-medium">Inactive</span>
                  )}
                </p>
              </div>

              {branch.isMainBranch && (
                <div>
                  <Label className="text-gray-500">Main Branch</Label>
                  <p className="text-lg text-blue-600 font-medium">Yes</p>
                </div>
              )}

              {branch.createdAt && (
                <div>
                  <Label className="text-gray-500">Created</Label>
                  <p className="text-lg">
                    {new Date(branch.createdAt).toLocaleString()}
                  </p>
                </div>
              )}

              {branch.updatedAt && (
                <div>
                  <Label className="text-gray-500">Last Updated</Label>
                  <p className="text-lg">
                    {new Date(branch.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
