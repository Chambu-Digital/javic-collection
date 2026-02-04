'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Save,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Shield,
  Package,
  ShoppingCart,
  FileText,
  Users,
  BarChart3,
  Settings,
  MapPin,
  Star,
  MessageSquare,
  LayoutDashboard,
  FolderOpen,
  Truck
} from 'lucide-react'
import { Permission, PERMISSIONS } from '@/lib/permissions'
import { toast } from 'sonner'

interface AdminInfo {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: 'admin' | 'super_admin'
  permissions?: Permission[]
}

interface PermissionEditorProps {
  admin: AdminInfo
  onBack: () => void
  onUpdate: (admin: AdminInfo) => void
}

interface PermissionGroup {
  name: string
  icon: React.ComponentType<{ className?: string }>
  permissions: Permission[]
  description: string
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    permissions: [PERMISSIONS.DASHBOARD_VIEW],
    description: 'Access to admin dashboard and overview'
  },
  {
    name: 'Product Management',
    icon: Package,
    permissions: [
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.PRODUCTS_CREATE,
      PERMISSIONS.PRODUCTS_EDIT,
      PERMISSIONS.PRODUCTS_DELETE,
      PERMISSIONS.CATEGORIES_VIEW,
      PERMISSIONS.CATEGORIES_MANAGE,
    ],
    description: 'Manage products, categories, and inventory'
  },
  {
    name: 'Order Management',
    icon: ShoppingCart,
    permissions: [
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.ORDERS_MANAGE,
      PERMISSIONS.ORDERS_EXPORT,
    ],
    description: 'View and manage customer orders'
  },
  {
    name: 'Customer Management',
    icon: Users,
    permissions: [
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_MANAGE,
      PERMISSIONS.REVIEWS_VIEW,
      PERMISSIONS.REVIEWS_MODERATE,
    ],
    description: 'Manage customers and moderate reviews'
  },
  {
    name: 'Content Management',
    icon: FileText,
    permissions: [
      PERMISSIONS.BLOG_VIEW,
      PERMISSIONS.BLOG_CREATE,
      PERMISSIONS.BLOG_EDIT,
      PERMISSIONS.BLOG_DELETE,
    ],
    description: 'Create and manage blog content'
  },
  {
    name: 'Analytics & Reports',
    icon: BarChart3,
    permissions: [
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
    ],
    description: 'Access analytics and generate reports'
  },
  {
    name: 'System Management',
    icon: Settings,
    permissions: [
      PERMISSIONS.SHIPPING_VIEW,
      PERMISSIONS.SHIPPING_MANAGE,
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_MANAGE,
    ],
    description: 'Configure system settings and shipping'
  },
  {
    name: 'Admin Management',
    icon: Shield,
    permissions: [
      PERMISSIONS.ADMINS_VIEW,
      PERMISSIONS.ADMINS_CREATE,
      PERMISSIONS.ADMINS_MANAGE,
      PERMISSIONS.REQUESTS_VIEW,
      PERMISSIONS.REQUESTS_MANAGE,
    ],
    description: 'Manage admin users and requests (Super Admin only)'
  },
]

export default function NewPermissionEditor({ admin, onBack, onUpdate }: PermissionEditorProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUserPermissions()
  }, [admin._id])

  const fetchUserPermissions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/permissions?userId=${admin._id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedPermissions(new Set(data.customPermissions || []))
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      toast.error('Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionToggle = (permission: Permission) => {
    const newPermissions = new Set(selectedPermissions)
    if (newPermissions.has(permission)) {
      newPermissions.delete(permission)
    } else {
      newPermissions.add(permission)
    }
    setSelectedPermissions(newPermissions)
  }

  const handleGroupToggle = (groupPermissions: Permission[]) => {
    const newPermissions = new Set(selectedPermissions)
    const allSelected = groupPermissions.every(p => newPermissions.has(p))
    
    if (allSelected) {
      // Remove all permissions in this group
      groupPermissions.forEach(p => newPermissions.delete(p))
    } else {
      // Add all permissions in this group
      groupPermissions.forEach(p => newPermissions.add(p))
    }
    
    setSelectedPermissions(newPermissions)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/permissions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: admin._id,
          permissions: Array.from(selectedPermissions)
        })
      })

      if (response.ok) {
        toast.success('Permissions updated successfully')
        onUpdate({
          ...admin,
          permissions: Array.from(selectedPermissions)
        })
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update permissions')
      }
    } catch (error) {
      console.error('Error updating permissions:', error)
      toast.error('Failed to update permissions')
    } finally {
      setSaving(false)
    }
  }

  const getPermissionLabel = (permission: Permission): string => {
    return permission.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Shield className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading permissions...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Edit Permissions</h2>
          <p className="text-muted-foreground">
            {admin.firstName} {admin.lastName} ({admin.email})
          </p>
        </div>
        <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
          {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
        </Badge>
      </div>

      {/* Role Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {admin.role === 'super_admin' 
            ? 'Super Admins have all permissions by default. Custom permissions will be added on top of role permissions.'
            : 'Admins have basic permissions by default. You can grant additional permissions below.'
          }
        </AlertDescription>
      </Alert>

      {/* Permission Groups */}
      <div className="space-y-6">
        {PERMISSION_GROUPS.map((group) => {
          const groupPermissions = group.permissions
          const selectedInGroup = groupPermissions.filter(p => selectedPermissions.has(p))
          const allSelected = selectedInGroup.length === groupPermissions.length
          const someSelected = selectedInGroup.length > 0 && selectedInGroup.length < groupPermissions.length

          // Hide Admin Management for non-super-admins
          if (group.name === 'Admin Management' && admin.role !== 'super_admin') {
            return null
          }

          return (
            <Card key={group.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <group.icon className="w-5 h-5" />
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <CardDescription>{group.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {selectedInGroup.length}/{groupPermissions.length}
                    </Badge>
                    <Switch
                      checked={allSelected}
                      onCheckedChange={() => handleGroupToggle(groupPermissions)}
                      className={someSelected ? 'opacity-50' : ''}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupPermissions.map((permission) => (
                    <div key={permission} className="flex items-center justify-between p-3 border rounded-lg">
                      <Label htmlFor={permission} className="flex-1 cursor-pointer">
                        {getPermissionLabel(permission)}
                      </Label>
                      <Switch
                        id={permission}
                        checked={selectedPermissions.has(permission)}
                        onCheckedChange={() => handlePermissionToggle(permission)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-6 border-t">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Shield className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Permissions
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <div className="text-sm text-muted-foreground">
          {selectedPermissions.size} custom permissions selected
        </div>
      </div>
    </div>
  )
}