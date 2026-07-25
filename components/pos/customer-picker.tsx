'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Plus, X, User, Phone, CreditCard, Loader2, Check } from 'lucide-react'
import { usePosCartStore } from '@/lib/pos/cart-store'
import { formatKES } from '@/lib/pos/money'

interface CustomerResult {
  id: string
  name: string
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

interface CustomerPickerProps {
  onClose: () => void
}

// ─── Quick Create Form ────────────────────────────────────────────────────────

function QuickCreateForm({
  initialPhone,
  onCreated,
  onCancel,
}: {
  initialPhone: string
  onCreated: (c: CustomerResult) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: initialPhone, email: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.phone.trim()) {
      setError('First name and phone are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/pos/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.status === 409) {
        // Duplicate — just attach the existing customer
        onCreated(data.customer)
        return
      }
      if (!res.ok) throw new Error(data.error || 'Failed to create customer')
      onCreated(data.customer)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-3 border-t">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New Customer</p>
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">{error}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium mb-1">First Name *</label>
          <input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
            placeholder="Jane" className={inp} autoFocus />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Last Name</label>
          <input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
            placeholder="Doe" className={inp} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Phone *</label>
        <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
          placeholder="+254..." className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Email <span className="text-muted-foreground">(optional)</span></label>
        <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          placeholder="jane@example.com" type="email" className={inp} />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} disabled={saving}
          className="flex-1 py-2 border rounded-md text-sm font-medium hover:bg-muted disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save
        </button>
      </div>
    </form>
  )
}

// ─── Main Picker ──────────────────────────────────────────────────────────────

export default function CustomerPicker({ onClose }: CustomerPickerProps) {
  const [query, setQuery]             = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults]         = useState<CustomerResult[]>([])
  const [loading, setLoading]         = useState(false)
  const [showCreate, setShowCreate]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { setCustomer, customer: attached } = usePosCartStore()

  // Focus input on open
  useEffect(() => { inputRef.current?.focus() }, [])

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  // Search
  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/pos/customers?search=${encodeURIComponent(q)}&limit=6`)
      const data = await res.json()
      setResults(data.customers || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { search(debouncedQuery) }, [debouncedQuery, search])

  const attach = (c: CustomerResult) => {
    setCustomer({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      creditEnabled: c.credit?.enabled ?? false,
      availableCredit: c.credit?.available ?? 0,
      outstandingBalance: c.credit?.outstanding ?? 0,
      creditLimit: c.credit?.limit ?? 0,
    })
    onClose()
  }

  const detach = () => {
    setCustomer(null)
    onClose()
  }

  return (
    <div className="border rounded-xl shadow-lg bg-white overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b bg-muted/30">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Select Customer
        </span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-0.5">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Currently attached */}
      {attached && (
        <div className="px-3 py-2 flex items-center justify-between bg-green-50 border-b border-green-100">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-800">{attached.name}</span>
            {attached.phone && <span className="text-green-600 text-xs">{attached.phone}</span>}
          </div>
          <button onClick={detach} className="text-xs text-red-500 hover:text-red-700 font-medium">
            Remove
          </button>
        </div>
      )}

      {/* Search input */}
      <div className="px-3 py-2.5 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Name, phone or email…"
            className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-h-56 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching…
          </div>
        ) : results.length > 0 ? (
          <ul className="divide-y">
            {results.map(c => (
              <li key={c.id}>
                <button
                  onClick={() => attach(c)}
                  className="w-full px-3 py-2.5 flex items-start gap-2.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />{c.phone}
                        </span>
                      )}
                      {c.credit?.enabled && (
                        <span className="flex items-center gap-1 text-green-700">
                          <CreditCard className="h-3 w-3" />
                          {formatKES(c.credit.available)} available
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : debouncedQuery && !loading ? (
          <div className="px-3 py-3 text-sm text-muted-foreground text-center">
            No customers found for "{debouncedQuery}"
          </div>
        ) : !query ? (
          <div className="px-3 py-3 text-xs text-muted-foreground text-center">
            Type to search existing customers
          </div>
        ) : null}
      </div>

      {/* New customer toggle */}
      {!showCreate ? (
        <div className="px-3 py-2.5 border-t">
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 py-2 border border-dashed rounded-md text-sm text-primary hover:bg-primary/5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New customer
          </button>
        </div>
      ) : (
        <QuickCreateForm
          initialPhone={query.match(/^\+?[0-9\s]+$/) ? query : ''}
          onCreated={c => { attach(c) }}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
