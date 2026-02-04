'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  User
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

interface AdminRequest {
  _id: string
  firstName: string
  lastName: string
  email: string
  status: string
}

interface PermissionSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  adminRequest: AdminRequest | null
  onApprove: (permissions: Permissions) => Promise<void>
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

// Default permissions for new admins
const defaultPermissions: Permissions = {
  products: { view: true, create: true, edit: true, delete: false },
  orders: { view: true, edit: true, cancel: false },
  blog: { view: true, create: true, edit: true, delete: false },
  customers: { view: true, edit: false },
  reports: { view: true, export: false },
  settings: { view: false, edit: false },
  locations: { view: true, edit: false }
}

export default function PermissionSelectionModal({ 
  isOpen, 
  onClose, 
  adminRequest, 
  onApprove 
}: PermissionSelectionModalProps) {
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions)
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

  const handleApprove = async () => {
    if (!adminRequest) return
    
    setSaving(true)
    setMessage(null)
    
    try {
      await onApprove(permissions)
      setMessage({ type: 'success', text: 'Admin request approved successfully' })
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to approve admin request' })
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

  if (!adminRequest) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            Approve Admin Request
          </DialogTitle>
          <DialogDescription>
            Set permissions for {adminRequest.firstName} {adminRequest.lastName} ({adminRequest.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Permission Count Badge */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Configure Permissions</h3>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              {getPermissionCount()} permissions selected
            </Badge>
          </div>

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
          <div className="grid gap-4">
            {permissionAreas.map((area) => {
              const areaPerms = permissions[area.key as keyof Permissions] || {}
              const isEnabled = isAreaEnabled(area.key)
              
              return (
                <div key={area.key} className={`border rounded-lg p-4 ${isEnabled ? 'ring-2 ring-blue-200 bg-blue-50/30' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <area.icon className="h-5 w-5 text-gray-600" />
                      <div>
                        <h4 className="font-medium">{area.name}</h4>
                        <p className="text-sm text-gray-600">{area.description}</p>
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
                  
                  {isEnabled && (
                    <>
                      <Separator className="mb-3" />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Approving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Approve & Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}