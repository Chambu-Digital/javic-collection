'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X, Check, Loader2, Trash2, Search, User } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentMethod {
  _id: string
  name: string
  icon: string
  isDefault: boolean
}

interface PaymentEntry {
  id: string           // local uuid for list keying
  methodId: string
  method: string
  amount: number
  cashReceived?: number
  mpesaPhone?: string
  mpesaReference?: string
  creditNote?: string
}

interface Customer {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
}

interface CheckoutData {
  cart: any[]
  subtotal: number
  discountAmount: number
  total: number
  branchId: string
  isWholesale: boolean
  cashierId: string
  cashierName: string
}

// ─── Add Method Modal ─────────────────────────────────────────────────────────

function AddMethodModal({ branchId, onAdd, onClose }: {
  branchId: string
  onAdd: (method: PaymentMethod) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const EMOJI_SUGGESTIONS = ['💳', '🏦', '📲', '💰', '🪙', '📝', '🤝', '🏧']

  const handleSave = async () => {
    if (!name.trim() || !icon.trim()) { setError('Name and icon are required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/pos/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), icon: icon.trim(), branchId }),
      })
      if (res.ok) {
        const data = await res.json()
        onAdd(data.method)
        onClose()
      } else {
        const err = await res.json()
        setError(err.error || 'Failed to save')
      }
    } catch { setError('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900">Add Payment Method</h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          {error && <p className="text-sm text-red-600 mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Method Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Equity Bank" autoFocus
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Icon (emoji)</label>
              <input type="text" value={icon} onChange={e => setIcon(e.target.value)}
                placeholder="e.g. 💳"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              <div className="flex gap-2 mt-2 flex-wrap">
                {EMOJI_SUGGESTIONS.map(emoji => (
                  <button key={emoji} onClick={() => setIcon(emoji)}
                    className={`text-xl p-1.5 rounded-lg hover:bg-gray-100 transition ${icon === emoji ? 'bg-emerald-100 ring-2 ring-emerald-400' : ''}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Add Method'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Add Payment Modal ────────────────────────────────────────────────────────

function AddPaymentModal({ method, remaining, onAdd, onClose }: {
  method: PaymentMethod
  remaining: number
  onAdd: (entry: Omit<PaymentEntry, 'id'>) => void
  onClose: () => void
}) {
  const [amount, setAmount]       = useState(remaining > 0 ? remaining.toString() : '')
  const [cashReceived, setCashReceived] = useState('')
  const [phone, setPhone]         = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote]           = useState('')

  const isCash    = method.name === 'Cash'
  const isMpesa   = method.name.toLowerCase().includes('mpesa')
  const isCredit  = method.name === 'Credit'

  const amt         = parseFloat(amount) || 0
  const cashRecv    = parseFloat(cashReceived) || 0
  const change      = isCash ? Math.max(0, cashRecv - amt) : 0

  const handleAdd = () => {
    if (amt <= 0) return
    onAdd({
      methodId: method._id,
      method:   method.name,
      amount:   amt,
      cashReceived: isCash ? (cashRecv || amt) : undefined,
      mpesaPhone:    isMpesa ? phone || undefined : undefined,
      mpesaReference:isMpesa ? reference || undefined : undefined,
      creditNote:    isCredit ? note || undefined : undefined,
    })
    onClose()
  }

  const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent'

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{method.icon}</span>
              <h3 className="text-lg font-bold text-gray-900">{method.name}</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount (KSh) *</label>
              <input type="number" min="0" value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={`e.g. ${remaining.toLocaleString()}`}
                className={inputCls} autoFocus />
            </div>

            {/* Cash: cash received + change */}
            {isCash && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cash Received (KSh)</label>
                  <input type="number" min="0" value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    placeholder="Amount given by customer"
                    className={inputCls} />
                </div>
                {cashRecv > 0 && (
                  <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                    change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    <span>Change Due:</span>
                    <span className="text-base font-bold">KSh {change.toLocaleString()}</span>
                  </div>
                )}
              </>
            )}

            {/* M-Pesa: phone + reference */}
            {isMpesa && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone (optional)</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="07XX XXX XXX" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Transaction Code (optional)</label>
                  <input type="text" value={reference} onChange={e => setReference(e.target.value)}
                    placeholder="e.g. QGH7XYZ2P4" className={inputCls} />
                </div>
              </>
            )}

            {/* Credit: note */}
            {isCredit && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Customer will pay on Friday" className={inputCls} />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleAdd} disabled={amt <= 0}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              Add Payment
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const router = useRouter()
  const [checkout, setCheckout]       = useState<CheckoutData | null>(null)
  const [methods, setMethods]         = useState<PaymentMethod[]>([])
  const [payments, setPayments]       = useState<PaymentEntry[]>([])
  const [activeMethod, setActiveMethod] = useState<PaymentMethod | null>(null)
  const [showAddModal, setShowAddModal]   = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')

  // Customer selection
  const [customer, setCustomer]       = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [customerSearching, setCustomerSearching] = useState(false)

  // ── Load checkout data ──────────────────────────────────────────────────────

  useEffect(() => {
    const data = sessionStorage.getItem('pos-checkout')
    if (!data) { router.replace('/pos/make-sale'); return }
    try { setCheckout(JSON.parse(data)) }
    catch { router.replace('/pos/make-sale') }
  }, [router])

  // ── Fetch payment methods ────────────────────────────────────────────────────

  useEffect(() => {
    if (!checkout?.branchId) return
    fetch(`/api/pos/payment-methods?branchId=${checkout.branchId}`)
      .then(r => r.json())
      .then(data => setMethods(data.methods || []))
      .catch(console.error)
  }, [checkout?.branchId])

  // ── Customer search ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!customerSearch.trim()) { setCustomerResults([]); return }
    setCustomerSearching(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(customerSearch)}&limit=10`)
        if (res.ok) {
          const data = await res.json()
          setCustomerResults(data.users || data.customers || [])
        }
      } catch { /* silent */ }
      finally { setCustomerSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [customerSearch])

  // ── Calculations ──────────────────────────────────────────────────────────────

  const totalAllocated = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining       = Math.max(0, (checkout?.total || 0) - totalAllocated)
  const isFullyPaid     = totalAllocated >= (checkout?.total || 0)
  const overpayment     = Math.max(0, totalAllocated - (checkout?.total || 0))

  // Total change from all cash payments
  const totalChange = payments
    .filter(p => p.method === 'Cash' && p.cashReceived)
    .reduce((sum, p) => sum + Math.max(0, (p.cashReceived! - p.amount)), 0)

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const addPayment = (entry: Omit<PaymentEntry, 'id'>) => {
    const id = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setPayments(prev => [...prev, { ...entry, id }])
  }

  const removePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id))
  }

  const handleAddMethod = (method: PaymentMethod) => {
    setMethods(prev => [...prev, method])
  }

  const handleBack = () => {
    sessionStorage.setItem('pos-cart', JSON.stringify({
      cart: checkout!.cart,
      discount: checkout!.discountAmount.toString(),
      isWholesale: checkout!.isWholesale,
    }))
    sessionStorage.removeItem('pos-checkout')
    router.push('/pos/make-sale')
  }

  const handleConfirm = async () => {
    if (!isFullyPaid || !checkout) return
    setError('')
    setSubmitting(true)

    try {
      const items = checkout.cart.map((item: any) => ({
        productId: item.productId,
        productName: item.name,
        productImage: item.variantImageUrl || '',
        selectedImageIndex: item.variantIndex,
        selectedSize: item.size !== 'One Size' ? item.size : undefined,
        sku: item.sku,
        quantity: item.quantity,
        price: item.resolvedPrice,
        totalPrice: item.resolvedPrice * item.quantity,
        pricingMode: checkout.isWholesale ? 'wholesale' : 'retail',
        branchId: checkout.branchId,
      }))

      const paymentAllocations = payments.map(p => ({
        method: p.method,
        amount: p.amount,
        cashReceived: p.cashReceived,
        changeGiven: p.method === 'Cash' && p.cashReceived
          ? Math.max(0, p.cashReceived - p.amount)
          : undefined,
        mpesaPhone: p.mpesaPhone,
        mpesaReference: p.mpesaReference,
      }))

      const res = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          subtotal: checkout.subtotal,
          discountAmount: checkout.discountAmount,
          totalAmount: checkout.total,
          branchId: checkout.branchId,
          cashierId: checkout.cashierId,
          cashierName: checkout.cashierName,
          pricingMode: checkout.isWholesale ? 'wholesale' : 'retail',
          channel: 'pos',
          paymentAllocations,
          // Customer (optional)
          ...(customer ? {
            userId: customer._id,
            customerEmail: customer.email,
            customerPhone: customer.phone,
          } : {}),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        sessionStorage.removeItem('pos-checkout')
        sessionStorage.setItem('pos-receipt', JSON.stringify({
          orderNumber: data.orderNumber,
          orderId: data.orderId,
          total: checkout.total,
          paymentAllocations,
          cashierName: checkout.cashierName,
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : undefined,
          items: checkout.cart,
        }))
        router.push('/pos/make-sale/receipt')
      } else {
        setError(data.error || 'Failed to complete sale')
      }
    } catch {
      setError('Failed to complete sale. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (!checkout) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={handleBack} className="p-2 rounded-lg hover:bg-gray-100 transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment</h1>
          <p className="text-sm text-gray-500">
            {checkout.cart.length} item{checkout.cart.length !== 1 ? 's' : ''} · {checkout.cashierName}
          </p>
        </div>
      </div>

      {/* Total */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Subtotal</span>
          <span className="text-sm font-medium">KSh {checkout.subtotal.toLocaleString()}</span>
        </div>
        {checkout.discountAmount > 0 && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Discount</span>
            <span className="text-sm font-medium text-red-600">- KSh {checkout.discountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-3xl font-bold text-emerald-600">KSh {checkout.total.toLocaleString()}</span>
        </div>
      </div>

      {/* Customer (optional) */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1.5">
          Customer <span className="text-gray-400">(optional, for partial payment / credit)</span>
        </p>
        {customer ? (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {customer.firstName} {customer.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{customer.email}</p>
            </div>
            <button onClick={() => setCustomer(null)} className="p-1 rounded text-gray-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomerPicker(true)}
            className="w-full flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-emerald-400 transition"
          >
            <User className="w-4 h-4" />
            Select Customer
          </button>
        )}
      </div>

      {/* Customer Picker Modal */}
      {showCustomerPicker && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowCustomerPicker(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Select Customer</h3>
                <button onClick={() => setShowCustomerPicker(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {customerSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {customerResults.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-6">
                    {customerSearch ? 'No customers found.' : 'Start typing to search…'}
                  </p>
                ) : customerResults.map(c => (
                  <button
                    key={c._id}
                    onClick={() => {
                      setCustomer(c)
                      setShowCustomerPicker(false)
                      setCustomerSearch('')
                      setCustomerResults([])
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-emerald-50 text-left transition"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-600">
                      {c.firstName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.firstName} {c.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{c.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Payment Methods */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Payment Methods</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {methods.map(method => (
            <button
              key={method._id}
              onClick={() => setActiveMethod(method)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-gray-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30 transition text-center"
            >
              <span className="text-2xl">{method.icon}</span>
              <span className="text-xs font-semibold text-gray-700 truncate w-full">{method.name}</span>
            </button>
          ))}

          {/* Add custom method */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-medium">Add</span>
          </button>
        </div>
      </div>

      {/* Payment Breakdown */}
      {payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Breakdown</h3>
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="flex items-center gap-3 py-1.5">
                <span className="text-sm text-gray-700 flex-1">{p.method}</span>
                {p.cashReceived && p.cashReceived > p.amount && (
                  <span className="text-xs text-gray-400">
                    (Received {p.cashReceived.toLocaleString()})
                  </span>
                )}
                <span className="text-sm font-semibold text-gray-900">
                  KSh {p.amount.toLocaleString()}
                </span>
                <button
                  onClick={() => removePayment(p.id)}
                  className="p-1 rounded text-gray-300 hover:text-red-500 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Sale Total</span>
          <span className="text-sm font-bold text-gray-900">KSh {checkout.total.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Paid</span>
          <span className={`text-sm font-bold ${totalAllocated >= checkout.total ? 'text-emerald-600' : 'text-gray-900'}`}>
            KSh {totalAllocated.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Balance</span>
          <span className={`text-sm font-bold ${remaining > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
            KSh {remaining.toLocaleString()}
          </span>
        </div>
        {totalChange > 0 && (
          <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-700">Change</span>
            <span className="text-base font-bold text-emerald-600">KSh {totalChange.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pb-6">
        <button
          onClick={handleBack}
          className="px-5 py-3.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          disabled
          className="px-5 py-3.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-400 cursor-not-allowed opacity-50"
          title="Coming soon"
        >
          Hold
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isFullyPaid || submitting}
          className="flex-1 py-3.5 bg-emerald-600 text-white font-bold text-base rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
          ) : (
            <><Check className="w-5 h-5" /> Complete Sale</>
          )}
        </button>
      </div>

      {/* Modals */}
      {activeMethod && (
        <AddPaymentModal
          method={activeMethod}
          remaining={remaining}
          onAdd={addPayment}
          onClose={() => setActiveMethod(null)}
        />
      )}

      {showAddModal && (
        <AddMethodModal
          branchId={checkout.branchId}
          onAdd={handleAddMethod}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
