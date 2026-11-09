'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  Loader2,
  Package2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Edit2,
  Trash2,
  Search,
  Plus,
  Save,
} from 'lucide-react'

/* ── types ────────────────────────────────────────────────────────────── */

interface PurchaseLine {
  productId: string
  productName: string
  imageIndex: number
  selectedSize?: string
  quantity: number
  unitCost: number
  lineTotal: number
  image?: string | null
  variants?: { url: string; sizes: string[] }[]
  currentSellingPrice?: number
}

interface Purchase {
  _id: string
  purchaseRef: string
  supplierInvoiceNo?: string
  vendorId?: string
  vendorName?: string
  branchId?: string
  branchCode?: string
  date: string
  paymentStatus: 'paid' | 'partial' | 'unpaid'
  paymentMethod?: string
  notes?: string
  status: 'draft' | 'received' | 'cancelled'
  subtotal: number
  total: number
  lines: PurchaseLine[]
  createdByName?: string
  receivedAt?: string
  createdAt: string
  updatedAt: string
}

interface Vendor {
  _id: string
  name: string
  vendorCode: string
  isHouseStock?: boolean
}

interface SearchProduct {
  _id: string
  name: string
  sku?: string
  buyingPrice?: number
  price: number
  images: Array<{ url: string; sizes?: string[] }>
  sizes?: string[]
}

let lineKey = 0
const newKey = () => `lk-${lineKey++}`

/* ── helpers ──────────────────────────────────────────────────────────── */

const STATUS_CONFIG = {
  draft: { label: 'Draft', Icon: Clock, bg: 'bg-yellow-100', text: 'text-yellow-700' },
  received: { label: 'Received', Icon: CheckCircle2, bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { label: 'Cancelled', Icon: XCircle, bg: 'bg-gray-100', text: 'text-gray-500' },
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: 'Paid',
  partial: 'Partially Paid',
  unpaid: 'Unpaid / Credit',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  mpesa: 'M-Pesa',
  bank: 'Bank',
  other: 'Other',
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'
const fmtDateTime = (d?: string) =>
  d
    ? new Date(d).toLocaleString('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

/* ── editable line type (adds a local key) ────────────────────────────── */
type EditLine = PurchaseLine & { _key: string }

/* ════════════════════════════════════════════════════════════════════════ */

export default function PurchaseDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  /* edit mode state */
  const [editing, setEditing] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [editVendorId, setEditVendorId] = useState('')
  const [editInvoiceNo, setEditInvoiceNo] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editPaymentStatus, setEditPaymentStatus] = useState('unpaid')
  const [editPaymentMethod, setEditPaymentMethod] = useState('cash')
  const [editNotes, setEditNotes] = useState('')
  const [editLines, setEditLines] = useState<EditLine[]>([])

  /* product search inside edit mode */
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  /* action states */
  const [saving, setSaving] = useState(false)
  const [receiving, setReceiving] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [actionError, setActionError] = useState('')
  const [confirmReceive, setConfirmReceive] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  /* ── data loading ─────────────────────────────────────────────────── */

  const loadPurchase = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setFetchError('')
    try {
      const res = await fetch(`/api/pos/purchases/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load purchase')
      setPurchase(data.purchase)
    } catch (e: any) {
      setFetchError(e.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadPurchase()
  }, [loadPurchase])

  /* ── vendor list (for edit mode) ──────────────────────────────────── */

  useEffect(() => {
    if (!purchase?.branchId) return
    fetch(`/api/admin/vendors?branchId=${purchase.branchId}&activeOnly=true`)
      .then((r) => r.json())
      .then((d) => setVendors(d.vendors || []))
      .catch(console.error)
  }, [purchase?.branchId])

  /* ── enter edit mode ──────────────────────────────────────────────── */

  const startEditing = () => {
    if (!purchase) return
    setEditVendorId(purchase.vendorId || '')
    setEditInvoiceNo(purchase.supplierInvoiceNo || '')
    setEditDate(purchase.date.slice(0, 10))
    setEditPaymentStatus(purchase.paymentStatus)
    setEditPaymentMethod(purchase.paymentMethod || 'cash')
    setEditNotes(purchase.notes || '')
    setEditLines(
      purchase.lines.map((l) => ({ ...l, _key: newKey() }))
    )
    setActionError('')
    setEditing(true)
  }

  /* ── product search ────────────────────────────────────────────────── */

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); setShowResults(false); return }
    setSearchLoading(true)
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/products?search=${encodeURIComponent(search)}&limit=8`)
        if (r.ok) {
          const d = await r.json()
          setSearchResults(d.products || [])
          setShowResults(true)
        }
      } catch { /* silent */ } finally { setSearchLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const addEditLine = (p: SearchProduct) => {
    const variants = p.images.map((img) => ({ url: img.url, sizes: img.sizes || p.sizes || [] }))
    const firstSizes = variants[0]?.sizes || []
    setEditLines((prev) => [
      ...prev,
      {
        _key: newKey(),
        productId: p._id,
        productName: p.name,
        imageIndex: 0,
        selectedSize: firstSizes[0],
        quantity: 1,
        unitCost: p.buyingPrice || 0,
        lineTotal: p.buyingPrice || 0,
        image: p.images[0]?.url,
        variants,
      },
    ])
    setSearch('')
    setShowResults(false)
  }

  const updateEditLine = (key: string, patch: Partial<EditLine>) => {
    setEditLines((prev) =>
      prev.map((l) => {
        if (l._key !== key) return l
        const updated = { ...l, ...patch }
        updated.lineTotal = round2(updated.quantity * updated.unitCost)
        return updated
      })
    )
  }

  const changeEditVariant = (key: string, imageIndex: number) => {
    setEditLines((prev) =>
      prev.map((l) => {
        if (l._key !== key) return l
        const sizes = l.variants?.[imageIndex]?.sizes || []
        const sizeValid = l.selectedSize ? sizes.includes(l.selectedSize) : false
        return {
          ...l,
          imageIndex,
          selectedSize: sizeValid ? l.selectedSize : sizes[0],
          image: l.variants?.[imageIndex]?.url,
          lineTotal: round2(l.quantity * l.unitCost),
        }
      })
    )
  }

  const removeEditLine = (key: string) => setEditLines((prev) => prev.filter((l) => l._key !== key))

  const editSubtotal = editLines.reduce((s, l) => s + l.quantity * l.unitCost, 0)

  /* ── save draft edits ──────────────────────────────────────────────── */

  const handleSave = async () => {
    if (editLines.length === 0) { setActionError('Add at least one product line.'); return }
    setSaving(true)
    setActionError('')
    try {
      const res = await fetch(`/api/pos/purchases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: editVendorId,
          supplierInvoiceNo: editInvoiceNo,
          date: editDate,
          paymentStatus: editPaymentStatus,
          paymentMethod: editPaymentMethod,
          notes: editNotes,
          lines: editLines.map((l) => ({
            productId: l.productId,
            imageIndex: l.imageIndex,
            selectedSize: l.selectedSize,
            quantity: Number(l.quantity),
            unitCost: Number(l.unitCost),
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setEditing(false)
      await loadPurchase()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setSaving(false)
    }
  }

  /* ── receive ────────────────────────────────────────────────────────── */

  const handleReceive = async () => {
    setReceiving(true)
    setActionError('')
    setConfirmReceive(false)
    try {
      const res = await fetch(`/api/pos/purchases/${id}/receive`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to receive')
      await loadPurchase()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setReceiving(false)
    }
  }

  /* ── cancel ─────────────────────────────────────────────────────────── */

  const handleCancel = async () => {
    setCancelling(true)
    setActionError('')
    setConfirmCancel(false)
    try {
      const res = await fetch(`/api/pos/purchases/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to cancel')
      await loadPurchase()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setCancelling(false)
    }
  }

  /* ── render guards ──────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-700">{fetchError}</p>
        <button
          onClick={() => router.push('/pos/stock-in')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
        >
          Back to Purchases
        </button>
      </div>
    )
  }

  if (!purchase) return null

  const statusCfg = STATUS_CONFIG[purchase.status]
  const StatusIcon = statusCfg.Icon
  const isDraft = purchase.status === 'draft'

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent'

  /* ── main render ──────────────────────────────────────────────────── */

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/pos/stock-in')}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{purchase.purchaseRef}</h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {statusCfg.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {purchase.vendorName || 'Unknown supplier'} · {fmtDate(purchase.date)}
            </p>
          </div>
        </div>

        {/* Draft actions */}
        {isDraft && !editing && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={startEditing}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={() => setConfirmCancel(true)}
              disabled={cancelling}
              className="px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 inline-flex items-center gap-2"
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Cancel Draft
            </button>
            <button
              onClick={() => setConfirmReceive(true)}
              disabled={receiving}
              className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 inline-flex items-center gap-2"
            >
              {receiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Receive Stock
            </button>
          </div>
        )}
      </div>

      {/* Action errors */}
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{actionError}</p>
        </div>
      )}

      {/* Confirm dialogs */}
      {confirmReceive && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-900">Confirm Receive Stock</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              This will increase stock quantities and record inventory movements. This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmReceive(false)}
              className="px-3 py-1.5 border border-emerald-300 rounded-lg text-sm text-emerald-700 hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={handleReceive}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
            >
              Yes, Receive
            </button>
          </div>
        </div>
      )}

      {confirmCancel && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-red-900">Cancel this draft?</p>
            <p className="text-xs text-red-700 mt-0.5">
              The purchase will be marked as cancelled. No stock will be affected.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmCancel(false)}
              className="px-3 py-1.5 border border-red-300 rounded-lg text-sm text-red-700 hover:bg-white"
            >
              Keep Draft
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
            >
              Yes, Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── VIEW MODE ─────────────────────────────────────────────────── */}
      {!editing && (
        <>
          {/* Purchase info */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Purchase Information
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Supplier" value={purchase.vendorName || '—'} />
                <Field label="Invoice No." value={purchase.supplierInvoiceNo || '—'} />
                <Field label="Purchase Date" value={fmtDate(purchase.date)} />
                <Field
                  label="Payment Status"
                  value={PAYMENT_STATUS_LABELS[purchase.paymentStatus] || purchase.paymentStatus}
                />
                <Field
                  label="Payment Method"
                  value={PAYMENT_METHOD_LABELS[purchase.paymentMethod || ''] || purchase.paymentMethod || '—'}
                />
                <Field label="Branch" value={purchase.branchCode || '—'} />
                <Field label="Created By" value={purchase.createdByName || '—'} />
                <Field label="Created At" value={fmtDateTime(purchase.createdAt)} />
                {purchase.receivedAt && (
                  <Field label="Received At" value={fmtDateTime(purchase.receivedAt)} />
                )}
                {purchase.notes && (
                  <div className="col-span-2 md:col-span-3">
                    <Field label="Notes" value={purchase.notes} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lines */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Products ({purchase.lines.length} line{purchase.lines.length !== 1 ? 's' : ''})
              </p>
              <div className="space-y-2">
                {purchase.lines.map((line, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2"
                  >
                    <div className="w-9 h-9 rounded bg-white border border-gray-200 overflow-hidden flex-shrink-0">
                      {line.image ? (
                        <img src={line.image} alt={line.productName} className="w-full h-full object-cover" />
                      ) : (
                        <Package2 className="w-4 h-4 text-gray-300 m-auto mt-2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{line.productName}</p>
                      <p className="text-xs text-gray-400">
                        Variant {line.imageIndex + 1}
                        {line.selectedSize ? ` · ${line.selectedSize}` : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-0.5">
                      <p className="text-sm font-semibold text-gray-900">{line.quantity} units</p>
                      <p className="text-xs text-gray-500">
                        @ KSh {line.unitCost.toLocaleString()} ea
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 w-24 hidden sm:block">
                      <p className="text-sm font-bold text-gray-900">
                        KSh {line.lineTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="flex justify-end mt-4">
                <div className="w-64 space-y-1">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>KSh {purchase.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>KSh {purchase.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── EDIT MODE ─────────────────────────────────────────────────── */}
      {editing && (
        <>
          {/* Header info edit */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Edit Purchase Information
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Supplier</label>
                  <select
                    value={editVendorId}
                    onChange={(e) => setEditVendorId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select supplier</option>
                    {vendors.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Invoice No.</label>
                  <input
                    type="text"
                    value={editInvoiceNo}
                    onChange={(e) => setEditInvoiceNo(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Payment Status</label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                    className={inputClass}
                  >
                    <option value="unpaid">Unpaid / Credit</option>
                    <option value="partial">Partially Paid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value)}
                    className={inputClass}
                  >
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="bank">Bank</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lines edit */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Products
              </p>

              {/* Product search */}
              <div className="relative mb-4" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    placeholder="Add more products…"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  {searchLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((p) => (
                      <button
                        key={p._id}
                        onClick={() => addEditLine(p)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-50 text-left border-b border-gray-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                          {p.images?.[0]?.url ? (
                            <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package2 className="w-3 h-3 text-gray-300 m-auto mt-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">KSh {p.price.toLocaleString()}</p>
                        </div>
                        <Plus className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Edit lines */}
              <div className="space-y-2">
                {editLines.map((line) => {
                  const sizes = line.variants?.[line.imageIndex]?.sizes || []
                  return (
                    <div
                      key={line._key}
                      className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-lg p-2"
                    >
                      <div className="w-9 h-9 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                        {line.image ? (
                          <img src={line.image} alt={line.productName} className="w-full h-full object-cover" />
                        ) : (
                          <Package2 className="w-4 h-4 text-gray-300 m-auto mt-2" />
                        )}
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <p className="text-xs font-medium text-gray-900 truncate">{line.productName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {(line.variants?.length || 0) > 1 && (
                            <select
                              value={line.imageIndex}
                              onChange={(e) => changeEditVariant(line._key, Number(e.target.value))}
                              className="px-1.5 py-0.5 border border-gray-300 rounded text-xs"
                            >
                              {line.variants!.map((_, i) => (
                                <option key={i} value={i}>
                                  V{i + 1}
                                </option>
                              ))}
                            </select>
                          )}
                          {sizes.length > 0 && (
                            <select
                              value={line.selectedSize || ''}
                              onChange={(e) => updateEditLine(line._key, { selectedSize: e.target.value })}
                              className="px-1.5 py-0.5 border border-gray-300 rounded text-xs"
                            >
                              {sizes.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                      <div className="w-20">
                        <label className="block text-xs text-gray-400">Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) =>
                            updateEditLine(line._key, { quantity: Math.max(1, Number(e.target.value)) })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="w-28">
                        <label className="block text-xs text-gray-400">Buying Price</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.unitCost}
                          onChange={(e) =>
                            updateEditLine(line._key, { unitCost: Math.max(0, Number(e.target.value)) })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="text-right w-20">
                        <label className="block text-xs text-gray-400">Total</label>
                        <p className="text-sm font-semibold text-gray-900">
                          KSh {(line.quantity * line.unitCost).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <button
                        onClick={() => removeEditLine(line._key)}
                        className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Subtotal */}
              {editLines.length > 0 && (
                <div className="flex justify-end mt-4">
                  <div className="w-56">
                    <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                      <span>Total</span>
                      <span>KSh {round2(editSubtotal).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{actionError}</p>
            </div>
          )}

          {/* Edit actions */}
          <div className="flex justify-end gap-3 pb-6">
            <button
              onClick={() => { setEditing(false); setActionError('') }}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ── tiny helper component ──────────────────────────────────────────── */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}
