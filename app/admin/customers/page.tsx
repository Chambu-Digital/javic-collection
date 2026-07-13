'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  MapPin,
  UserCheck,
  UserX,
  Eye,
  Trash2,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Loader2,
  Lock,
  User,
} from 'lucide-react'
import { useUserStore } from '@/lib/user-store'

interface Customer {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: 'customer' | 'admin' | 'super_admin'
  isActive: boolean
  isEmailVerified: boolean
  addresses: Array<{
    name: string
    phone: string
    county: string
    area: string
    type: string
  }>
  createdAt: string
  updatedAt: string
}

interface CreateUserForm {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  role: 'customer' | 'admin' | 'super_admin'
}

const emptyForm: CreateUserForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  role: 'customer',
}

export default function CustomersPage() {
  const { user } = useUserStore()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<CreateUserForm>(emptyForm)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  // Auto-clear messages after 5 s
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(null), 5000)
    return () => clearTimeout(t)
  }, [message])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCustomerStatus = async (customerId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (response.ok) {
        setMessage({ type: 'success', text: `User ${isActive ? 'deactivated' : 'activated'} successfully` })
        fetchCustomers()
      } else {
        const err = await response.json()
        setMessage({ type: 'error', text: err.error || 'Failed to update status' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    }
  }

  const handleCreateUser = async () => {
    setCreateError('')

    if (!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.password) {
      setCreateError('First name, last name, email and password are required.')
      return
    }
    if (createForm.password.length < 6) {
      setCreateError('Password must be at least 6 characters.')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateModal(false)
        setCreateForm(emptyForm)
        setMessage({ type: 'success', text: `User "${data.user.firstName} ${data.user.lastName}" created successfully` })
        fetchCustomers()
      } else {
        setCreateError(data.error || 'Failed to create user')
      }
    } catch {
      setCreateError('Network error. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/customers/${deleteTarget._id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setDeleteTarget(null)
        setMessage({ type: 'success', text: `User "${deleteTarget.firstName} ${deleteTarget.lastName}" deleted successfully` })
        fetchCustomers()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete user' })
        setDeleteTarget(null)
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && customer.isActive) ||
      (statusFilter === 'inactive' && !customer.isActive)

    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">View, create, and manage user accounts</p>
        </div>
        <Button onClick={() => { setCreateForm(emptyForm); setCreateError(''); setShowCreateModal(true) }}>
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
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
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <div className="space-y-4">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredCustomers.length > 0 ? (
          <>
            <p className="text-sm text-gray-600">
              Showing {filteredCustomers.length} of {customers.length} users
            </p>
            {filteredCustomers.map((customer) => (
              <Card key={customer._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Users className="h-4 w-4 text-gray-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {customer.firstName} {customer.lastName}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-3 w-3" />
                            Joined {formatDate(customer.createdAt)}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {customer.addresses.length > 0 && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="h-3 w-3" />
                              {customer.addresses[0].area}, {customer.addresses[0].county}
                            </div>
                          )}
                          <div className="text-gray-600">
                            {customer.addresses.length} address{customer.addresses.length !== 1 ? 'es' : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex flex-col gap-2">
                        {/* Role badge */}
                        {customer.role !== 'customer' && (
                          <Badge
                            variant="outline"
                            className={
                              customer.role === 'super_admin'
                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }
                          >
                            {customer.role.replace('_', ' ').toUpperCase()}
                          </Badge>
                        )}
                        <div className="flex gap-2">
                          <Badge
                            variant={customer.isActive ? 'default' : 'secondary'}
                            className={customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {customer.isEmailVerified && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => (window.location.href = `/admin/customers/${customer._id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCustomerStatus(customer._id, customer.isActive)}
                        >
                          {customer.isActive ? (
                            <><UserX className="h-4 w-4 mr-2" />Deactivate</>
                          ) : (
                            <><UserCheck className="h-4 w-4 mr-2" />Activate</>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => setDeleteTarget(customer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No users have been created yet'}
              </p>
              <Button onClick={() => { setCreateForm(emptyForm); setCreateError(''); setShowCreateModal(true) }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Create First User
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Create User Modal ── */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Fill in the details below. Admin-created accounts are automatically verified and active.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {createError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    placeholder="Jane"
                    className="pl-10"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    className="pl-10"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  className="pl-10"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="0712 345 678"
                  className="pl-10"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  className="pl-10"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) => setCreateForm({ ...createForm, role: v as CreateUserForm['role'] })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  {user?.role === 'super_admin' && (
                    <>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
              ) : (
                <><UserPlus className="h-4 w-4 mr-2" />Create User</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Modal ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-gray-900">
                {deleteTarget?.firstName} {deleteTarget?.lastName}
              </span>{' '}
              ({deleteTarget?.email})? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={deleting}>
              {deleting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" />Delete User</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
