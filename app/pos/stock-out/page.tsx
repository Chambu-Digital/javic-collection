'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Loader2,
  Package2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'

/* ── types ─────────────────────────────────────────────────────────────── */
interface Vendor { _id: string; name: string; vendorCode: string }

interface SearchProduct {
  _id: string
  name: string
  sku?: string
  buyingPrice?: number
  price: number
  images: Array<{ url: string; sizes?: string[] }>
  sizes?: string[]
}

interface DraftLine {
  key: string
  productId: string
  productName: string
  variants: { url: string; sizes: string[] }[]
  imageIndex: number
  selectedSize?: string
  quantity: number
}

interface HistoryRecord {
  _id: string
  referenceNo: string
  reason: string
  notes?: string
  vendorName?: string
  lineCount: number
  totalQuantity: number
  createdByName?: string
  createdAt: string
}

/* ── constants ─────────────────────────────────────────────────────────── */
const REASONS: { value: string; label: string; description: string }[] = [
  { value: 'damaged',          label: 'Damaged',          description: 'Goods damaged and unsellable' },
  { value: 'expired',          label: 'Expired',          description: 'Goods past expiry date' },
  { value: 'consumed',         label: 'Internal Use',     description: 'Used internally by the business' },
  { value: 'sample',           label: 'Sample',           description: 'Given as a sample or tester' },
  { value: 'theft_loss',       label: 'Theft / Loss',     description: 'Missing — theft or unexplained loss' },
  { value: 'supplier_return',  label: 'Supplier Return',  description: 'Returned to supplier' },
  { value: 'other',            label: 'Other',            description: 'Other authorised removal' },
]

const REASON_COLORS: Record<string, string> = {
  damaged:         'bg-red-100 text-red-700',
  expired:         'bg-orange-100 text-orange-700',
  consumed:        'bg-blue-100 text-blue-700',
  sample:          'bg-purple-100 text-purple-700',
  theft_loss:      'bg-rose-100 text-rose-700',
  supplier_return: 'bg-amber-100 text-amber-700',
  other:           'bg-gray-100 text-gray-600',
}

let lineKeyCounter = 0

/* ════════════════════════════════════════════════════════════════════════ */
export default function StockOutPage() {
  const router = useRouter()
  const [branchId, setBranchId] = useState('')
  const [tab, setTab] = useState<'new' | 'history'>('new')

  /* ── new stock-out state ──────────────────────────────────────────── */
  const [reason, setReason]       = useState('')
  const [notes, setNotes]         = useState('')
  const [supplierRef, setSupplierRef] = useState('')
  const [vendorId, setVendorId]   = useState('')
  const [vendors, setVendors]     = useState<Vendor[]>([])
  const [lines, setLines]         = useState<DraftLine[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess]     = useState<{ ref: string } | null>(null)

  /* ── product search ───────────────────────────────────────────────── */
  const [search, setSearch]       = useState('')
  const [results, setResults]     = useState<SearchProduct[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  /* ── history state ────────────────────────────────────────────────── */
  const [history, setHistory]     = useState<HistoryRecord[]>([])
  const [histLoading, setHistLoading] = useState(false)
  const [histTotal, setHistTotal] = useState(0)
  const [histRefresh, setHistRefresh] = useState(0)

  /* ── init ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const saved = localStorage.getItem('pos-selected-branch')
    if (saved) setBranchId(saved)
  }, [])

  useEffect(() => {
    if (!branchId) return
    fetch(`/api/admin/vendors?branchId=${branchId}&activeOnly=true`)
      .then(r => r.json())
      .then(d => setVendors(d.vendors || []))
      .catch(console.error)
  }, [branchId])

  /* ── product search ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!search.trim()) { setResults([]); setShowResults(false); return }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/products?search=${encodeURIComponent(search)}&limit=10`)
        if (r.ok) { const d = await r.json(); setResults(d.products || []); setShowResults(true) }
      } catch { /* silent */ } finally { setSearching(false) }
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

  /* ── history ──────────────────────────────────────────────────────── */
  const fetchHistory = useCallback(async () => {
    if (!branchId) return
    setHistLoading(true)
    try {
      const r = await fetch(`/api/pos/stock-out?branchId=${branchId}&limit=30`)
      if (r.ok) {
        const d = await r.json()
        setHistory(d.records || [])
        setHistTotal(d.pagination?.total || 0)
      }
    } catch { /* silent */ } finally { setHistLoading(false) }
  }, [branchId, histRefresh])

  useEffect(() => { if (tab === 'history') fetchHistory() }, [tab, fetchHistory])

  /* ── line management ──────────────────────────────────────────────── */
  const addLine = (p: SearchProduct) => {
    const variants = p.images.map(img => ({ url: img.url, sizes: img.sizes || p.sizes || [] }))
    const firstSizes = variants[0]?.sizes || []
    setLines(prev => [...prev, {
      key: `lk-${lineKeyCounter++}`,
      productId: p._id,
      productName: p.name,
      variants,
      imageIndex: 0,
      selectedSize: firstSizes[0],
      quantity: 1,
    }])
    setSearch(''); setShowResults(false)
  }

  const updateLine = (key: string, patch: Partial<DraftLine>) =>
    setLines(prev => prev.map(l => l.key === key ? { ...l, ...patch } : l))

  const changeVariant = (key: string, imageIndex: number) =>
    setLines(prev => prev.map(l => {
      if (l.key !== key) return l
      const sizes = l.variants[imageIndex]?.sizes || []
      return { ...l, imageIndex, selectedSize: sizes[0] }
    }))

  const removeLine = (key: string) => setLines(prev => prev.filter(l => l.key !== key))

  /* ── submit ───────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!reason) { setSubmitError('Select a reason.'); return }
    if (lines.length === 0) { setSubmitError('Add at least one product line.'); return }
    for (const l of lines) {
      const sizes = l.variants[l.imageIndex]?.sizes || []
      if (sizes.length > 0 && !l.selectedSize) {
        setSubmitError(`Select a size for ${l.productName}.`); return
      }
      if (l.quantity < 1) { setSubmitError(`Quantity must be at least 1 for ${l.productName}.`); return }
    }

    setSubmitting(true); setSubmitError('')
    try {
      const res = await fetch('/api/pos/stock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          reason, notes, supplierRef,
          vendorId: vendorId || undefined,
          lines: lines.map(l => ({
            productId: l.productId,
            imageIndex: l.imageIndex,
            selectedSize: l.selectedSize,
            quantity: l.quantity,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to record stock out')
      setSuccess({ ref: data.referenceNo })
      // reset form
      setLines([]); setReason(''); setNotes(''); setSupplierRef(''); setVendorId('')
    } catch (e: any) {
      setSubmitError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent'

  const totalQty = lines.reduce((s, l) => s + l.quantity, 0)
  const showSupplierFields = reason === 'supplier_return'

  /* ── render ───────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/pos/inventory')} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Out</h1>
            <p className="text-sm text-gray-500">Record inventory removed outside of normal sales</p>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(['new', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium transition ${
                tab === t ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t === 'new' ? 'New Stock Out' : `History ${histTotal > 0 ? `(${histTotal})` : ''}`}
            </button>
          ))}
        </div>
      </div>

      {!branchId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">Select a branch in the sidebar before recording a stock out.</p>
        </div>
      )}

      {/* ── NEW STOCK OUT TAB ──────────────────────────────────────────── */}
      {tab === 'new' && branchId && (
        <>
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-900">Stock out recorded — {success.ref}</p>
                <p className="text-xs text-green-700 mt-0.5">Inventory has been deducted and movement logged.</p>
              </div>
              <button onClick={() => setSuccess(null)} className="ml-auto text-xs text-green-600 hover:text-green-800 underline">
                Record another
              </button>
            </div>
          )}

          {/* Reason selection */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Reason for Stock Out *</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {REASONS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`text-left p-3 rounded-xl border transition ${
                      reason === r.value
                        ? 'border-emerald-400 ring-1 ring-emerald-200 bg-emerald-50'
                        : 'border-gray-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900">{r.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-tight">{r.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Supplier return extras */}
          {showSupplierFields && (
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">Supplier Return Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Supplier (optional)</label>
                    <select value={vendorId} onChange={e => setVendorId(e.target.value)} className={inputCls}>
                      <option value="">Select supplier…</option>
                      {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Original Purchase Ref (optional)</label>
                    <input type="text" value={supplierRef} onChange={e => setSupplierRef(e.target.value)}
                      placeholder="e.g. PUR-20241108-001" className={inputCls} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optional)</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Additional details about this stock removal…" className={inputCls} />
            </CardContent>
          </Card>

          {/* Product lines */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Products to Remove</p>

              {/* Search */}
              <div className="relative" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onFocus={() => results.length > 0 && setShowResults(true)}
                    placeholder="Search products to add…"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
                </div>
                {showResults && results.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {results.map(p => (
                      <button key={p._id} onClick={() => addLine(p)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-50 text-left border-b border-gray-50 last:border-0">
                        <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                          {p.images?.[0]?.url
                            ? <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                            : <Package2 className="w-3.5 h-3.5 text-gray-300 m-auto mt-2" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">Sell: KSh {p.price.toLocaleString()}</p>
                        </div>
                        <Plus className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Lines */}
              {lines.length === 0 ? (
                <div className="text-center py-8 mt-4 border border-dashed border-gray-200 rounded-xl">
                  <Package2 className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Search above to add products to remove.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {lines.map(line => {
                    const sizes = line.variants[line.imageIndex]?.sizes || []
                    return (
                      <div key={line.key} className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-lg p-2.5">
                        <div className="w-9 h-9 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                          {line.variants[line.imageIndex]?.url
                            ? <img src={line.variants[line.imageIndex].url} alt={line.productName} className="w-full h-full object-cover" />
                            : <Package2 className="w-4 h-4 text-gray-300 m-auto mt-2" />}
                        </div>
                        <div className="flex-1 min-w-[140px]">
                          <p className="text-sm font-medium text-gray-900 truncate">{line.productName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {line.variants.length > 1 && (
                              <select value={line.imageIndex} onChange={e => changeVariant(line.key, Number(e.target.value))}
                                className="px-1.5 py-0.5 border border-gray-300 rounded text-xs">
                                {line.variants.map((_, i) => <option key={i} value={i}>V{i+1}</option>)}
                              </select>
                            )}
                            {sizes.length > 0 && (
                              <select value={line.selectedSize || ''} onChange={e => updateLine(line.key, { selectedSize: e.target.value })}
                                className="px-1.5 py-0.5 border border-gray-300 rounded text-xs">
                                {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            )}
                          </div>
                        </div>
                        <div className="w-24">
                          <label className="block text-xs text-gray-400 mb-0.5">Qty to remove</label>
                          <input type="number" min={1} value={line.quantity}
                            onChange={e => updateLine(line.key, { quantity: Math.max(1, Number(e.target.value)) })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                        </div>
                        <button onClick={() => removeLine(line.key)}
                          className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {lines.length > 0 && (
                <div className="flex justify-end mt-3">
                  <p className="text-sm font-semibold text-gray-700">
                    Total units to remove: <span className="text-red-600">{totalQty}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          <div className="flex justify-end pb-6">
            <button onClick={handleSubmit} disabled={submitting}
              className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {submitting ? 'Processing…' : 'Confirm Stock Out'}
            </button>
          </div>
        </>
      )}

      {/* ── HISTORY TAB ───────────────────────────────────────────────── */}
      {tab === 'history' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setHistRefresh(k => k + 1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {histLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <Package2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No stock-out records yet for this branch.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map(r => (
                <div key={r._id}
                  className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-4">
                  <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${REASON_COLORS[r.reason] || 'bg-gray-100 text-gray-600'}`}>
                    {REASONS.find(x => x.value === r.reason)?.label || r.reason}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{r.referenceNo}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-500">{r.lineCount} line{r.lineCount !== 1 ? 's' : ''} · {r.totalQuantity} units</span>
                      {r.createdByName && <><span className="text-gray-300">·</span><span className="text-xs text-gray-400">by {r.createdByName}</span></>}
                      {r.notes && <><span className="text-gray-300">·</span><span className="text-xs text-gray-400 truncate max-w-[200px]">{r.notes}</span></>}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(r.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
