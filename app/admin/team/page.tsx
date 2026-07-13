'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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
  Shield,
  Users,
  UserPlus,
  Trash2,
  Edit,
  Mail,
  Phone,
  Calendar,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
  UserX,
  UserCheck,
  Package,
  ShoppingCart,
  FileText,
  BarChart3,
  Settings,
  Megaphone,
  LayoutDashboard,
  FolderOpen,
  Star,
  Save,
  ArrowLeft,
} from 'lucide-react'
import { useUserStore } from '@/lib/user-store'
import { PERMISSIONS, PERMISSION_GROUPS, Permission } from '@/lib/permissions'

// ── Types ─────────────────────────────────────────────────────────────────────

interface StaffMember {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: 'admin' | 'super_admin'
  permissions?: Permission[]
  isActive: boolean
  isApproved: boolean
  approvedBy?: { firstName: string; lastName: string; email: string }
  createdAt: string
}

interface CreateForm {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  role: 'admin' | 'super_admin'
  permissions: Set<Permission>
}

const emptyForm = (): CreateForm => ({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  role: 'admin',
  permissions: new Set(),
})

// ── Icon map for permission groups ────────────────────────────────────────────

const GROUP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Product Management': Package,
  'Order Management': ShoppingCart,
  'Customer Management': Users,
  'Content Management': FileText,
  'Analytics & Reports': BarChart3,
  'System Management': Settings,
  'Admin Management': Shield,
  'Campaign Management': Megaphone,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function permLabel(p: Permission) {
  return p.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

function roleColor(role: string) {
  return role === 'super_admin'
    ? 'bg-purple-100 text-purple-800 border-purple-200'
    : 'bg-blue-100 text-blue-800 border-blue-200'
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Permission Panel (shared by create modal + edit view) ─────────────────────

function PermissionPanel({
  selected,
  onChange,
  showAdminGroup,
}: {
  selected: Set<Permission>
  onChange: (s: Set<Permission>) => void
  showAdminGroup: boolean
}) {
  const toggle = (p: Permission) => {
    const next = new Set(selected)
    next.has(p) ? next.delete(p) : next.add(p)
    onChange(next)
  }

  const toggleGroup = (perms: readonly Permission[]) => {
    const next = new Set(selected)
    const allOn = perms.every(p => next.has(p))
    perms.forEach(p => allOn ? next.delete(p) : next.add(p))
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {(Object.entries(PERMISSION_GROUPS) as [string, readonly Permission[]][]).map(([groupName, perms]) => {
        if (groupName === 'Admin Management' && !showAdminGroup) return null
        const Icon = GROUP_ICONS[groupName] || Shield
        const allOn = perms.every(p => selected.has(p))
        const someOn = perms.some(p => selected.has(p)) && !allOn
        const count = perms.filter(p => selected.has(p)).length

        return (
          <Card key={groupName} className={allOn ? 'ring-2 ring-blue-200' : someOn ? 'ring-1 ring-blue-100' : ''}>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-500" />
                  <CardTitle className="text-sm font-semibold">{groupName}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{count}/{perms.length}</span>
                  <Switch
                    checked={allOn}
                    onCheckedChange={() => toggleGroup(perms)}
                    className={someOn ? 'opacity-60' : ''}
                  />
                </div>
              </div>
            </CardHeader>

            {(allOn || someOn) && (
              <CardContent className="pt-0 px-4 pb-3">
                <Separator className="mb-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {perms.map(p => (
                    <div key={p} className="flex items-center justify-between rounded-md border px-3 py-1.5">
                      <Label htmlFor={p} className="text-xs cursor-pointer">{permLabel(p)}</Label>
                      <Switch
                        id={p}
                        checked={selected.has(p)}
                        onCheckedChange={() => toggle(p)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { user } = useUserStore()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateForm>(emptyForm())
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Edit permissions view
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [editPerms, setEditPerms] = useState<Set<Permission>>(new Set())
  const [saving, setSaving] = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => { fetchStaff() }, [])

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(null), 5000)
    return () => clearTimeout(t)
  }, [message])

  // ── API helpers ────────────────────────────────────────────────────────────

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/admin/staff')
      if (res.ok) {
        const data = await res.json()
        setStaff(data.staff || [])
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  const handleCreate = async () => {
    setCreateError('')
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setCreateError('First name, last name, email and password are required.')
      return
    }
    if (form.password.length < 6) {
      setCreateError('Password must be at least 6 characters.')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, permissions: Array.from(form.permissions) }),
      })
      const data = await res.json()
      if (res.ok) {
        setShowCreate(false)
        setForm(emptyForm())
        setMessage({ type: 'success', text: `${data.user.firstName} ${data.user.lastName} added to the team` })
        fetchStaff()
      } else {
        setCreateError(data.error || 'Failed to create staff member')
      }
    } catch { setCreateError('Network error. Please try again.') }
    finally { setCreating(false) }
  }

  const openEdit = (member: StaffMember) => {
    setEditing(member)
    setEditPerms(new Set((member.permissions || []) as Permission[]))
  }

  const handleSavePermissions = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/staff/${editing._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: Array.from(editPerms) }),
      })
      const data = await res.json()
      if (res.ok) {
        setEditing(null)
        setMessage({ type: 'success', text: `Permissions updated for ${editing.firstName} ${editing.lastName}` })
        fetchStaff()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update permissions' })
      }
    } catch { setMessage({ type: 'error', text: 'Network error' }) }
    finally { setSaving(false) }
  }

  const toggleActive = async (member: StaffMember) => {
    try {
      const res = await fetch(`/api/admin/staff/${member._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !member.isActive }),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: `${member.firstName} ${member.isActive ? 'deactivated' : 'activated'}` })
        fetchStaff()
      }
    } catch { setMessage({ type: 'error', text: 'Network error' }) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/staff/${deleteTarget._id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        setDeleteTarget(null)
        setMessage({ type: 'success', text: `${deleteTarget.firstName} ${deleteTarget.lastName} removed from the team` })
        fetchStaff()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete' })
        setDeleteTarget(null)
      }
    } catch { setMessage({ type: 'error', text: 'Network error' }) }
    finally { setDeleting(false) }
  }

  // ── Guard ──────────────────────────────────────────────────────────────────

  if (user?.role !== 'super_admin') {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Only super admins can manage the team.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // ── Edit permissions view ──────────────────────────────────────────────────

  if (editing) {
    return (
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setEditing(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Team
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Edit Permissions</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {editing.firstName} {editing.lastName} · {editing.email}
            </p>
          </div>
          <Badge variant="outline" className={roleColor(editing.role)}>
            {editing.role.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {editing.role === 'super_admin'
              ? 'Super admins already have all permissions. Custom permissions here are additive.'
              : 'These are custom permissions on top of the default admin role permissions.'}
          </AlertDescription>
        </Alert>

        <PermissionPanel
          selected={editPerms}
          onChange={setEditPerms}
          showAdminGroup={editing.role === 'super_admin'}
        />

        <div className="flex items-center gap-3 pt-4 border-t">
          <Button onClick={handleSavePermissions} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Permissions</>}
          </Button>
          <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
          <span className="text-sm text-gray-400 ml-auto">{editPerms.size} custom permissions selected</span>
        </div>
      </div>
    )
  }

  // ── Main list view ─────────────────────────────────────────────────────────

  const filtered = staff.filter(m =>
    `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500 mt-1">Manage admin staff, roles and permissions</p>
        </div>
        <Button onClick={() => { setForm(emptyForm()); setCreateError(''); setShowCreate(true) }}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Alert banner */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Staff list */}
      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </CardContent></Card>
          ))
        ) : filtered.length > 0 ? (
          <>
            <p className="text-sm text-gray-500">Showing {filtered.length} of {staff.length} staff members</p>
            {filtered.map(member => (
              <Card key={member._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                    {/* Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {member.firstName} {member.lastName}
                            {member._id === user?.id && (
                              <span className="ml-2 text-xs text-gray-400">(you)</span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />{member.email}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-600">
                        {member.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />{member.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />Added {fmtDate(member.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {member.permissions?.length
                            ? `${member.permissions.length} custom permission${member.permissions.length !== 1 ? 's' : ''}`
                            : 'Default role permissions'}
                        </div>
                      </div>
                    </div>

                    {/* Badges + actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={roleColor(member.role)}>
                          {member.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(member)}>
                          <Edit className="h-4 w-4 mr-1" />Permissions
                        </Button>

                        {member._id !== user?.id && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => toggleActive(member)}>
                              {member.isActive
                                ? <><UserX className="h-4 w-4 mr-1" />Deactivate</>
                                : <><UserCheck className="h-4 w-4 mr-1" />Activate</>}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={() => setDeleteTarget(member)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
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
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
              <p className="text-gray-500 mb-6">
                {search ? 'Try a different search' : 'Add your first staff member to get started'}
              </p>
              <Button onClick={() => { setForm(emptyForm()); setCreateError(''); setShowCreate(true) }}>
                <UserPlus className="h-4 w-4 mr-2" />Add Staff Member
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Create Modal ──────────────────────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>
              Create an admin account and set their permissions right away.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {createError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder="Jane" value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder="Doe" value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10" type="email" placeholder="jane@javic.co.ke" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Phone (optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder="0712 345 678" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" type="password" placeholder="Min. 6 characters" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v as 'admin' | 'super_admin' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">Admin</div>
                        <div className="text-xs text-gray-500">Standard admin with customisable permissions</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="super_admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-600" />
                      <div>
                        <div className="font-medium">Super Admin</div>
                        <div className="text-xs text-gray-500">Full access to everything</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-semibold">Permissions</Label>
                <p className="text-sm text-gray-500 mt-0.5">
                  {form.role === 'super_admin'
                    ? 'Super admins already have all permissions. Additional ones below are additive.'
                    : 'Grant specific permissions on top of the default admin role.'}
                </p>
              </div>
              <PermissionPanel
                selected={form.permissions}
                onChange={perms => setForm({ ...form, permissions: perms })}
                showAdminGroup={form.role === 'super_admin'}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
                : <><UserPlus className="h-4 w-4 mr-2" />Add Staff Member</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ───────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Staff Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently remove{' '}
              <span className="font-semibold text-gray-900">
                {deleteTarget?.firstName} {deleteTarget?.lastName}
              </span>{' '}
              ({deleteTarget?.email}) from the team? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Removing...</>
                : <><Trash2 className="h-4 w-4 mr-2" />Remove Member</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
