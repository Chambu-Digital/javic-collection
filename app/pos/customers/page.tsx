'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, Plus, Phone, Mail, ChevronDown, ChevronUp,
  AlertTriangle, Check, Loader2, X, Users, CreditCard,
  ShoppingBag, CheckCircle2,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { formatKES } from '@/lib/pos/money'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Customer {
  id: string
  name: string
  firstName: string
  lastName: string
  phone?: string
  email?: string
  orderCount: number
  credit: {
    enabled: boolean
    limit: number
    outstanding: number
    available: number
    status: string
  } | null
}

// ─── Customer Card ────────────────────────────────────────────────────────────

function CustomerCard({ customer, onUpdated }: {
  customer: Customer
  onUpdated: (c: Customer) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState('')

  const [form, setForm] = useState({
    phone:         customer.phone ?? '',
    email:         customer.email ?? '',
    creditEnabled: customer.credit?.enabled ?? false,
    creditLimit:   customer.credit?.limit ?? 0,
  })

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess(false)
    try {
      const res  = await fetch(`/api/pos/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      onUpdated(data.customer)
      setSuccess(true)
      setTimeout(() => { setSuccess(false); setEditMode(false) }, 1500)
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  const credit   = customer.credit
  const initials = customer.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const inp      = 'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <div className="rounded-xl border bg-background overflow-hidden">

      {/* ── Header row ── */}
      <div className="flex items-center gap-3 p-4">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate">{customer.name}</p>
            {credit?.enabled ? (
              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                Credit
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            {customer.phone && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />{customer.phone}
              </span>
            )}
            {customer.email && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-[180px]">
                <Mail className="h-3 w-3 shrink-0" />{customer.email}
              </span>
            )}
          </div>
        </div>

        {/* Right: order count + expand */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <ShoppingBag className="h-3 w-3" />
            {customer.orderCount}
          </span>
          <button
            onClick={() => { setExpanded(v => !v); setEditMode(false); setError('') }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ── Credit bar (collapsed) ── */}
      {credit?.enabled && !expanded && (
        <div className="flex gap-4 px-4 pb-3 text-xs border-t pt-2.5">
          <span className="text-muted-foreground">
            Limit: <strong className="text-foreground">{formatKES(credit.limit)}</strong>
          </span>
          <span className="text-red-600">
            Owed: <strong>{formatKES(credit.outstanding)}</strong>
          </span>
          <span className="text-green-700">
            Available: <strong>{formatKES(credit.available)}</strong>
          </span>
        </div>
      )}

      {/* ── Expanded panel ── */}
      {expanded && (
        <div className="border-t bg-muted/20 px-4 py-4 space-y-4">

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />{error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-3 py-2 text-xs text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />Saved successfully
            </div>
          )}

          {!editMode ? (
            <>
              {/* Credit detail */}
              {credit && (
                <div className="rounded-lg border bg-background">
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Credit Account
                    </p>
                  </div>
                  <div className="divide-y px-4">
                    <div className="flex justify-between py-2.5 text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className={credit.enabled ? 'text-green-700 font-medium' : 'text-muted-foreground'}>
                        {credit.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    {credit.enabled && (
                      <>
                        <div className="flex justify-between py-2.5 text-sm">
                          <span className="text-muted-foreground">Limit</span>
                          <span className="font-medium">{formatKES(credit.limit)}</span>
                        </div>
                        <div className="flex justify-between py-2.5 text-sm">
                          <span className="text-muted-foreground">Outstanding</span>
                          <span className="text-red-600 font-medium">{formatKES(credit.outstanding)}</span>
                        </div>
                        <div className="flex justify-between py-2.5 text-sm font-semibold">
                          <span>Available</span>
                          <span className="text-green-700">{formatKES(credit.available)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => setEditMode(true)}
                className="w-full py-2 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
              >
                Edit Contact & Credit
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Edit Details
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+254…" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Email</label>
                  <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    type="email" placeholder="email@example.com" className={inp} />
                </div>
              </div>

              {/* Credit settings card */}
              <div className="rounded-lg border bg-background p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Enable Credit</p>
                    <p className="text-xs text-muted-foreground">Allow this customer to buy on credit</p>
                  </div>
                  <Switch
                    checked={form.creditEnabled}
                    onCheckedChange={v => setForm(p => ({ ...p, creditEnabled: v }))}
                  />
                </div>

                {form.creditEnabled && (
                  <div>
                    <label className="block text-xs font-medium mb-1">Credit Limit (KSH)</label>
                    <input type="number" min="0" value={form.creditLimit}
                      onChange={e => setForm(p => ({ ...p, creditLimit: parseFloat(e.target.value) || 0 }))}
                      placeholder="e.g. 15000" className={inp} />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setEditMode(false); setError('') }}
                  disabled={saving}
                  className="flex-1 py-2 border rounded-md text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {saving
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Check className="h-3.5 w-3.5" />}
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PosCustomersPage() {
  const [customers, setCustomers]             = useState<Customer[]>([])
  const [loading, setLoading]                 = useState(false)
  const [searchQuery, setSearchQuery]         = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [total, setTotal]                     = useState(0)
  const [showCreate, setShowCreate]           = useState(false)
  const [createForm, setCreateForm]           = useState({ firstName: '', lastName: '', phone: '', email: '' })
  const [creating, setCreating]               = useState(false)
  const [createError, setCreateError]         = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350)
    return () => clearTimeout(t)
  }, [searchQuery])

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ limit: '30' })
      if (debouncedSearch) p.set('search', debouncedSearch)
      const res  = await fetch(`/api/pos/customers?${p}`)
      const data = await res.json()
      setCustomers(data.customers || [])
      setTotal(data.total ?? 0)
    } catch { setCustomers([]) }
    finally { setLoading(false) }
  }, [debouncedSearch])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.firstName.trim() || !createForm.phone.trim()) {
      setCreateError('First name and phone are required.')
      return
    }
    setCreating(true); setCreateError('')
    try {
      const res  = await fetch('/api/pos/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const data = await res.json()
      if (res.status === 409) { setCreateError('A customer with this phone or email already exists.'); return }
      if (!res.ok) throw new Error(data.error || 'Failed to create customer')
      setShowCreate(false)
      setCreateForm({ firstName: '', lastName: '', phone: '', email: '' })
      fetchCustomers()
    } catch (err: any) { setCreateError(err.message) }
    finally { setCreating(false) }
  }

  const inp = 'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 px-4 sm:px-6 py-4 border-b bg-background">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Customers</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {total > 0 ? `${total} customer${total !== 1 ? 's' : ''}` : 'Manage accounts and credit'}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Customer</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="shrink-0 px-4 sm:px-6 py-3 border-b bg-background">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone or email…"
            className="w-full pl-9 pr-8 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
        {loading && customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin" />
            <p className="text-sm">Loading customers…</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
            <Users className="h-10 w-10 opacity-30" />
            <p className="text-sm">
              {debouncedSearch ? `No results for "${debouncedSearch}"` : 'No customers yet'}
            </p>
            {debouncedSearch && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-primary hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          customers.map(c => (
            <CustomerCard key={c.id} customer={c}
              onUpdated={updated => setCustomers(prev => prev.map(x => x.id === updated.id ? updated : x))} />
          ))
        )}
      </div>

      {/* ── Create modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h2 className="font-semibold">New Customer</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Add a new customer to the system</p>
              </div>
              <button onClick={() => { setShowCreate(false); setCreateError('') }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-5 py-4 space-y-3">
              {createError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />{createError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">First Name *</label>
                  <input value={createForm.firstName}
                    onChange={e => setCreateForm(p => ({ ...p, firstName: e.target.value }))}
                    placeholder="Jane" className={inp} autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Last Name</label>
                  <input value={createForm.lastName}
                    onChange={e => setCreateForm(p => ({ ...p, lastName: e.target.value }))}
                    placeholder="Doe" className={inp} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Phone *</label>
                <input value={createForm.phone}
                  onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+254…" className={inp} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Email <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input value={createForm.email} type="email"
                  onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="jane@example.com" className={inp} />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button"
                  onClick={() => { setShowCreate(false); setCreateError('') }}
                  disabled={creating}
                  className="flex-1 py-2.5 border rounded-md text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {creating ? 'Creating…' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
