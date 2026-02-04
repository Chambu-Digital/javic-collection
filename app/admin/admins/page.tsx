'use client'

import { useEffect, useState } from 'react'
import PermissionEditor from '@/components/admin/permission-editor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Search, 
  Filter,
  Mail,
  Phone,
  Calendar,
  Settings,
  Eye,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle,
  Edit
} from 'lucide-react'
import { useUserStore } from '@/lib/user-store'

interface Admin {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: 'admin' | 'super_admin'
  isActive: boolean
  isApproved: boolean
  permissions?: {
    products?: { view?: boolean; create?: boolean; edit?: boolean; delete?: boolean }
    orders?: { view?: boolean; edit?: boolean; cancel?: boolean }
    blog?: { view?: boolean; create?: boolean; edit?: boolean; delete?: boolean }
    customers?: { view?: boolean; edit?: boolean }
    reports?: { view?: boolean; export?: boolean }
    settings?: { view?: boolean; edit?: boolean }
    locations?: { view?: boolean; edit?: boolean }
  }
  approvedBy?: {
    firstName: string
    lastName: string
    email: string
  }
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

export default function AdminsPage() {
  const { user } = useUserStore()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearingAdmins, setClearingAdmins] = useState(false)

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin/admins')
      if (response.ok) {
        const data = await response.json()
        setAdmins(data.admins || [])
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
      setMessage({ type: 'error', text: 'Failed to fetch admin users' })
    } finally {
      setLoading(false)
    }
  }

  const toggleAdminStatus = async (adminId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Admin status updated successfully' })
        fetchAdmins()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update admin status' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Shield className="h-4 w-4 text-purple-600" />
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />
      default:
        return <Shield className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPermissionSummary = (permissions: Admin['permissions']) => {
    if (!permissions) return 'No permissions set'
    
    const areas = Object.keys(permissions).filter(area => {
      const perms = permissions[area as keyof typeof permissions]
      return perms && Object.values(perms).some(Boolean)
    })
    
    return areas.length > 0 ? `${areas.length} permission area${areas.length !== 1 ? 's' : ''}` : 'No permissions'
  }

  const handleEditPermissions = (admin: Admin) => {
    setEditingAdmin(admin)
  }

  const handleSavePermissions = async (permissions: Admin['permissions']) => {
    if (!editingAdmin) return

    try {
      const response = await fetch(`/api/admin/admins/${editingAdmin._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Permissions updated successfully' })
        setEditingAdmin(null)
        fetchAdmins()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update permissions')
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      throw error
    }
  }

  const handleClearAllAdmins = async () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true)
      return
    }

    setClearingAdmins(true)
    try {
      const response = await fetch('/api/admin/clear-admins', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ 
          type: 'success', 
          text: `${data.message}. You will need to create a new admin user.` 
        })
        setAdmins([])
        setShowClearConfirm(false)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to clear admin users' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error while clearing admin users' })
    } finally {
      setClearingAdmins(false)
      setShowClearConfirm(false)
    }
  }

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      admin.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && admin.isActive) ||
      (statusFilter === 'inactive' && !admin.isActive)
    
    const matchesRole = roleFilter === 'all' || admin.role === roleFilter

    return matchesSearch && matchesStatus && matchesRole
  })

  // Only super admins can manage other admins
  if (user?.role !== 'super_admin') {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only super administrators can manage admin users.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Show permission editor if editing
  if (editingAdmin) {
    return (
      <div className="p-6">
        <PermissionEditor
          userId={editingAdmin._id}
          adminInfo={{
            _id: editingAdmin._id,
            firstName: editingAdmin.firstName,
            lastName: editingAdmin.lastName,
            email: editingAdmin.email,
            role: editingAdmin.role
          }}
          currentPermissions={editingAdmin.permissions || {}}
          onSave={handleSavePermissions}
          onCancel={() => setEditingAdmin(null)}
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600 mt-2">
            Manage admin users and their permissions
          </p>
        </div>
        
        {/* Clear All Admins Button */}
        <div className="flex gap-2">
          {showClearConfirm ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(false)}
                disabled={clearingAdmins}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearAllAdmins}
                disabled={clearingAdmins}
              >
                {clearingAdmins ? 'Clearing...' : 'Confirm Clear All'}
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              onClick={handleClearAllAdmins}
              disabled={admins.length === 0}
            >
              <UserX className="h-4 w-4 mr-2" />
              Clear All Admins
            </Button>
          )}
        </div>
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

      {/* Clear Confirmation Warning */}
      {showClearConfirm && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>⚠️ WARNING:</strong> This will permanently delete ALL admin users ({admins.length} users). 
            Make sure you have a way to create a new admin user after this operation. This action cannot be undone.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search admins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="super_admin">Super Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admins List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAdmins.length > 0 ? (
          <>
            <div className="text-sm text-gray-600 mb-4">
              Showing {filteredAdmins.length} of {admins.length} admin users
            </div>
            
            {filteredAdmins.map((admin) => (
              <Card key={admin._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getRoleIcon(admin.role)}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {admin.firstName} {admin.lastName}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {admin.email}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          {admin.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="h-3 w-3" />
                              {admin.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-3 w-3" />
                            Joined {formatDate(admin.createdAt)}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Settings className="h-3 w-3" />
                            {getPermissionSummary(admin.permissions)}
                          </div>
                          {admin.approvedBy && (
                            <div className="text-gray-600 text-xs">
                              Approved by {admin.approvedBy.firstName} {admin.approvedBy.lastName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex flex-col gap-2">
                        <Badge 
                          variant="outline" 
                          className={`${getRoleColor(admin.role)}`}
                        >
                          {admin.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                        
                        <div className="flex gap-2">
                          <Badge 
                            variant={admin.isActive ? 'default' : 'secondary'}
                            className={admin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          
                          {admin.isApproved && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              Approved
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPermissions(admin)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Permissions
                        </Button>
                        
                        {admin._id !== user.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAdminStatus(admin._id, admin.isActive)}
                          >
                            {admin.isActive ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No admin users found</h3>
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all' || roleFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No admin users have been created yet'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}