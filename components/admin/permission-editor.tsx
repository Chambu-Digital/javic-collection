'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Package, 
  ShoppingCart, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  MapPin,
  Save,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Shield,
  Mail
} from 'lucide-react'

interface Permission {
  view?: boolean
  create?: boolean
  edit?: boolean
  delete?: boolean
  cancel?: boolean
  export?: boolean
}

interface Permissions {
  products?: Permission
  orders?: Permission
  blog?: Permission
  customers?: Permission
  reports?: Permission
  settings?: Permission
  locations?: Permission
}

interface AdminInfo {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

interface PermissionEditorProps {
  userId: string
  adminInfo?: AdminInfo
  currentPermissions: Permissions
  onSave: (permissions: Permissions) => Promise<void>
  onCancel: () => void
}

const permissionAreas = [
  {
    key: 'products',
    name: 'Products',
    icon: Package,
    description: 'Manage product catalog and inventory',
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    key: 'orders',
    name: 'Orders',
    icon: ShoppingCart,
    description: 'Handle customer orders and fulfillment',
    actions: ['view', 'edit', 'cancel']
  },
  {
    key: 'blog',
    name: 'Blog',
    icon: FileText,
    description: 'Create and manage blog content',
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    key: 'customers',
    name: 'Customers',
    icon: Users,
    description: 'View and manage customer accounts',
    actions: ['view', 'edit']
  },
  {
    key: 'reports',
    name: 'Reports',
    icon: BarChart3,
    description: 'Access analytics and reports',
    actions: ['view', 'export']
  },
  {
    key: 'settings',
    name: 'Settings',
    icon: Settings,
    description: 'Configure system settings',
    actions: ['view', 'edit']
  },
  {
    key: 'locations',
    name: 'Locations',
    icon: MapPin,
    description: 'Manage counties and areas',
    actions: ['view', 'edit']
  }
]

export default function PermissionEditor({ 
  userId, 
  adminInfo,
  currentPermissions, 
  onSave, 
  onCancel 
}: PermissionEditorProps) {
  const [permissions, setPermissions] = useState<Permissions>(currentPermissions)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const updatePermission = (area: string, action: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [area]: {
        ...prev[area as keyof Permissions],
        [action]: value
      }
    }))
  }

  const toggleAreaPermissions = (area: string, enabled: boolean) => {
    const areaConfig = permissionAreas.find(p => p.key === area)
    if (!areaConfig) return

    const areaPermissions: any = {}
    areaConfig.actions.forEach(action => {
      areaPermissions[action] = enabled
    })

    setPermissions(prev => ({
      ...prev,
      [area]: areaPermissions
    }))
  }

  const isAreaEnabled = (area: string) => {
    const areaPerms = permissions[area as keyof Permissions]
    if (!areaPerms) return false
    return Object.values(areaPerms).some(Boolean)
  }

  const getPermissionCount = () => {
    let count = 0
    Object.values(permissions).forEach(areaPerms => {
      if (areaPerms) {
        count += Object.values(areaPerms).filter(Boolean).length
      }
    })
    return count
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    
    try {
      await onSave(permissions)
      setMessage({ type: 'success', text: 'Permissions updated successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update permissions' })
    } finally {
      setSaving(false)
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'view': return 'View'
      case 'create': return 'Create'
      case 'edit': return 'Edit'
      case 'delete': return 'Delete'
      case 'cancel': return 'Cancel'
      case 'export': return 'Export'
      default: return action.charAt(0).toUpperCase() + action.slice(1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admins
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Edit Permissions</h2>
          <p className="text-gray-600 mt-1">
            Configure admin access permissions
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          {getPermissionCount()} permissions granted
        </Badge>
      </div>

      {/* Admin Info Card */}
      {adminInfo && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  Editing permissions for {adminInfo.firstName} {adminInfo.lastName}
                </h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {adminInfo.email}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {adminInfo.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Permission Areas */}
      <div className="grid gap-6">
        {permissionAreas.map((area) => {
          const areaPerms = permissions[area.key as keyof Permissions] || {}
          const isEnabled = isAreaEnabled(area.key)
          
          return (
            <Card key={area.key} className={isEnabled ? 'ring-2 ring-blue-200' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <area.icon className="h-5 w-5 text-gray-600" />
                    <div>
                      <CardTitle className="text-lg">{area.name}</CardTitle>
                      <CardDescription>{area.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${area.key}-toggle`} className="text-sm font-medium">
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id={`${area.key}-toggle`}
                      checked={isEnabled}
                      onCheckedChange={(checked: boolean) => toggleAreaPermissions(area.key, checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              
              {isEnabled && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {area.actions.map((action) => (
                      <div key={action} className="flex items-center space-x-2">
                        <Switch
                          id={`${area.key}-${action}`}
                          checked={areaPerms[action as keyof Permission] || false}
                          onCheckedChange={(checked: boolean) => 
                            updatePermission(area.key, action, checked)
                          }
                        />
                        <Label 
                          htmlFor={`${area.key}-${action}`}
                          className="text-sm font-medium"
                        >
                          {getActionLabel(action)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Permissions
            </>
          )}
        </Button>
      </div>
    </div>
  )
}