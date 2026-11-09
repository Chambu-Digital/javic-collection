'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search, Plus, X, Phone, Mail, User as UserIcon,
  ShoppingBag, CreditCard, ChevronRight, Loader2,
  CheckCircle, AlertCircle, Clock
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Customer {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  isActive: boolean
  createdAt: string
}

interface CustomerDetail extends Customer {
  orders: Array<{
    _id: string
    orderNumber: string
    totalAmount: number
    status: string
    channel: string
    createdAt: string
  }>
  stats: {
    totalOrders: number
    totalSpent: number
    completedOrders: number
    pendingOrders: number
  }
}

// ─── Create Customer Modal ────────────────────────────────────────────────────

function CreateCustomerModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (customer: Customer) => void
}) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: 'javic2024' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.firstName) {
      setError('First name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      // Generate placeholder email if not provided
      const email = form.email.trim() || `pos-${Date.now()}@javic.local`
      const lastName = form.lastName.trim() || '-'
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, email, lastName, role: 'customer' }),
      })
      const data = await res.json()
      if (res.ok) {
        onCreated(data.user)
        onClose()
      } else {
        setError(data.error || 'Failed to create customer')
      }
    } catch {
      setError('Failed to create customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900">New Customer</h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="07XX XXX XXX"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Create Customer'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Customer Detail Panel ────────────────────────────────────────────────────

function CustomerDetailPanel({ customerId, onClose }: {
  customerId: string
  onClose: () => void
}) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/customers/${customerId}/details`)
      .then(r => r.json())
      .then(data => {
        setDetail({
          ...data.customer,
          orders: data.orders || [],
          stats: data.stats || {}
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [customerId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'delivered': return 'text-emerald-600 bg-emerald-50'
      case 'pending': case 'processing': case 'confirmed': return 'text-orange-600 bg-orange-50'
      case 'cancelled': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="w-full md:w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <h3 className="font-bold text-gray-900">Customer Details</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : !detail ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Failed to load customer
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Profile */}
          <div className="px-5 py-5 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-xl font-bold text-emerald-700">
                {detail.firstName.charAt(0)}{detail.lastName.charAt(0)}
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">{detail.firstName} {detail.lastName}</h4>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{detail.email}</span>
                </div>
                {detail.phone && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{detail.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 px-5 py-4 border-b border-gray-100">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{detail.stats?.totalOrders || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Total Spent</p>
              <p className="text-lg font-bold text-emerald-600">
                KSh {(detail.stats?.totalSpent || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{detail.stats?.completedOrders || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{detail.stats?.pendingOrders || 0}</p>
            </div>
          </div>

          {/* Order History */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Order History
            </p>
            {detail.orders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No orders yet</p>
            ) : (
              <div className="space-y-2.5">
                {detail.orders.map(order => (
                  <div key={order._id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {order.channel === 'pos' ? '• POS' : '• Online'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        KSh {order.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('en-KE')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function CustomersPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const highlightOrderId = searchParams.get('orderId')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 30

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: page.toString(), limit: LIMIT.toString() })
        if (search) params.set('search', search)
        const res = await fetch(`/api/admin/customers?${params}`)
        if (res.ok) {
          const data = await res.json()
          setCustomers(data.customers)
          setTotal(data.pagination.total)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    const debounce = setTimeout(fetchCustomers, 300)
    return () => clearTimeout(debounce)
  }, [search, page])

  const handleCreated = (newCustomer: Customer) => {
    setCustomers(prev => [newCustomer, ...prev])
    setSelectedId(newCustomer._id)
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden -m-8">
      {/* ── Left: Customer List ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-white">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString()} total</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
          >
            <Plus className="w-4 h-4" />
            New Customer
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <UserIcon className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">{search ? 'No customers found' : 'No customers yet'}</p>
              {!search && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-3 text-sm text-emerald-600 hover:underline"
                >
                  Create your first customer
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {customers.map(customer => (
                <button
                  key={customer._id}
                  onClick={() => setSelectedId(selectedId === customer._id ? null : customer._id)}
                  className={`w-full flex items-center gap-4 bg-white rounded-xl px-4 py-3.5 border text-left transition hover:shadow-sm ${
                    selectedId === customer._id
                      ? 'border-emerald-400 shadow-sm ring-1 ring-emerald-400'
                      : 'border-gray-200'
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 flex-shrink-0">
                    {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500 truncate">{customer.email}</span>
                      {customer.phone && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-500">{customer.phone}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status + Arrow */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full ${customer.isActive ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                    <ChevronRight className={`w-4 h-4 transition ${selectedId === customer._id ? 'text-emerald-500 rotate-90' : 'text-gray-300'}`} />
                  </div>
                </button>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Detail Panel ─────────────────────────────────────────── */}
      {selectedId && (
        <CustomerDetailPanel
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateCustomerModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

export default function CustomersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    }>
      <CustomersPageContent />
    </Suspense>
  )
}
