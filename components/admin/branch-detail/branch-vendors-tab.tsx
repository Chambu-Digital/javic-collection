'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Search,
  Users,
  Loader2,
  Home,
  Building2,
  AlertCircle,
  Check,
  X,
  Power
} from 'lucide-react'
import { toast } from 'sonner'

interface Vendor {
  _id: string
  name: string
  vendorCode: string
  isActive: boolean
  isHouseStock: boolean
  phone?: string
  email?: string
  assignmentId?: string
  assignedAt?: string
  isActiveAtBranch?: boolean
}

interface BranchVendorsTabProps {
  branchId: string
  branchName: string
}

export default function BranchVendorsTab({ branchId, branchName }: BranchVendorsTabProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [availableVendors, setAvailableVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAvailable, setLoadingAvailable] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetchVendors()
  }, [branchId])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/branches/${branchId}/vendors`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setVendors(data.vendors || [])
      } else {
        toast.error('Failed to fetch vendors')
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast.error('Error loading vendors')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableVendors = async () => {
    try {
      setLoadingAvailable(true)
      
      // Get all vendors
      const response = await fetch('/api/admin/vendors?activeOnly=true', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        const allVendors = data.vendors || []
        
        // Filter out vendors already assigned to this branch
        const assignedVendorIds = vendors.map(v => v._id)
        const available = allVendors.filter(
          (v: Vendor) => !assignedVendorIds.includes(v._id)
        )
        
        setAvailableVendors(available)
      }
    } catch (error) {
      console.error('Error fetching available vendors:', error)
      toast.error('Error loading available vendors')
    } finally {
      setLoadingAvailable(false)
    }
  }

  const handleOpenAssignModal = () => {
    setShowAssignModal(true)
    setSelectedVendor('')
    fetchAvailableVendors()
  }

  const handleAssignVendor = async () => {
    if (!selectedVendor) {
      toast.error('Please select a vendor')
      return
    }

    try {
      setAssigning(true)

      const response = await fetch(`/api/admin/branches/${branchId}/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ vendorId: selectedVendor })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Vendor assigned successfully')
        setShowAssignModal(false)
        await fetchVendors()
      } else {
        toast.error(data.error || 'Failed to assign vendor')
      }
    } catch (error) {
      console.error('Error assigning vendor:', error)
      toast.error('Error assigning vendor')
    } finally {
      setAssigning(false)
    }
  }

  const handleToggleVendorStatus = async (vendorId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/branches/${branchId}/vendors/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !currentStatus })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Vendor status updated')
        await fetchVendors()
      } else {
        toast.error(data.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error toggling vendor status:', error)
      toast.error('Error updating vendor')
    }
  }

  const handleUnassignVendor = async (vendorId: string, vendorName: string) => {
    if (!confirm(`Unassign ${vendorName} from ${branchName}? This will fail if the vendor has active stock at this branch.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/branches/${branchId}/vendors/${vendorId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Vendor unassigned successfully')
        await fetchVendors()
      } else {
        toast.error(data.error || 'Failed to unassign vendor')
      }
    } catch (error) {
      console.error('Error unassigning vendor:', error)
      toast.error('Error unassigning vendor')
    }
  }

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.vendorCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vendors at {branchName}</CardTitle>
              <CardDescription>
                Manage which vendors can supply inventory to this branch
              </CardDescription>
            </div>
            <Button onClick={handleOpenAssignModal}>
              <Plus className="h-4 w-4 mr-2" />
              Assign Vendor
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Search */}
      {vendors.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Vendors List */}
      {filteredVendors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">
              {searchQuery ? 'No vendors found' : 'No vendors assigned'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Try a different search term'
                : `Assign vendors to ${branchName} to start managing inventory`}
            </p>
            {!searchQuery && (
              <Button onClick={handleOpenAssignModal}>
                <Plus className="h-4 w-4 mr-2" />
                Assign First Vendor
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <Card key={vendor._id} className={!vendor.isActiveAtBranch ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {vendor.isHouseStock ? (
                    <Home className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  ) : (
                    <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{vendor.name}</h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      {vendor.vendorCode}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {vendor.isHouseStock && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Store Owned
                    </Badge>
                  )}
                  {vendor.isActiveAtBranch ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <X className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </div>

                {vendor.assignedAt && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Assigned {new Date(vendor.assignedAt).toLocaleDateString()}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleToggleVendorStatus(vendor._id, vendor.isActiveAtBranch || false)}
                  >
                    <Power className="h-3 w-3 mr-1" />
                    {vendor.isActiveAtBranch ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleUnassignVendor(vendor._id, vendor.name)}
                  >
                    Unassign
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Vendor Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">Assign Vendor to {branchName}</h2>
            </div>

            <div className="px-6 py-4">
              {loadingAvailable ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : availableVendors.length === 0 ? (
                <div className="py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No vendors available. All active vendors are already assigned to this branch.
                  </p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="vendor-select">Select Vendor *</Label>
                  <select
                    id="vendor-select"
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Choose a vendor...</option>
                    {availableVendors.map((vendor) => (
                      <option key={vendor._id} value={vendor._id}>
                        {vendor.name} ({vendor.vendorCode})
                        {vendor.isHouseStock ? ' - House Stock' : ''}
                      </option>
                    ))}
                  </select>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    Once assigned, this vendor can supply inventory to {branchName}.
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAssignModal(false)}
                disabled={assigning}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAssignVendor}
                disabled={assigning || !selectedVendor || availableVendors.length === 0}
              >
                {assigning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign Vendor'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
