'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Save,
  ClipboardCheck,
  Package2,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'

/* ── types ─────────────────────────────────────────────────────────────── */
interface CountLine {
  productId: string
  productName: string
  variantImageUrl?: string
  imageIndex: number
  selectedSize?: string
  branchStockId: string
  stockIdentifier?: string
  systemQty: number      // read-only — live from BranchStock (in_progress) or snapshot (applied)
  physicalQty: number    // editable by the counter
  difference: number     // physicalQty - systemQty, computed
  notes?: string
}

interface StockCount {
  _id: string
  countRef: string
  branchId?: string
  branchCode?: string
  scope: 'all' | 'category' | 'list'
  status: 'in_progress' | 'applied' | 'cancelled'
  initiatedByName?: string
  appliedAt?: string
  appliedByName?: string
  notes?: string
  createdAt: string
  lines: CountLine[]
}

/* ── status config ─────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  in_progress: { label: 'In Progress', Icon: Clock,        bg: 'bg-yellow-100', text: 'text-yellow-700' },
  applied:     { label: 'Applied',     Icon: CheckCircle2, bg: 'bg-green-100',  text: 'text-green-700'  },
  cancelled:   { label: 'Cancelled',   Icon: XCircle,      bg: 'bg-gray-100',   text: 'text-gray-500'   },
}

/* ── helpers ───────────────────────────────────────────────────────────── */
const fmtDateTime = (d?: string) =>
  d ? new Date(d).toLocaleString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—'

/* ════════════════════════════════════════════════════════════════════════ */

export default function StockCountDetailPage() {
  const router   = useRouter()
  const params   = useParams<{ id: string }>()
  const id       = params.id

  const [count,       setCount]       = useState<StockCount | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [fetchError,  setFetchError]  = useState('')

  // Local editable copy of physicalQty / notes per line (keyed by branchStockId)
  const [physicalMap, setPhysicalMap] = useState<
    Record<string, { qty: number; notes: string }>
  >({})

  const [search,      setSearch]      = useState('')
  const [saving,      setSaving]      = useState(false)
  const [applying,    setApplying]    = useState(false)
  const [cancelling,  setCancelling]  = useState(false)
  const [actionError, setActionError] = useState('')
  const [confirmApply,  setConfirmApply]  = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [applyResult, setApplyResult] = useState<{
    adjustedLines: number; skippedLines: number; appliedAt: string
  } | null>(null)

  // Auto-save timer ref
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── load ─────────────────────────────────────────────────────────── */
  const loadCount = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setFetchError('')
    try {
      const res  = await fetch(`/api/pos/stock-count/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load count')
      const c: StockCount = data.count
      setCount(c)
      // Seed the local physicalMap from whatever is stored in the document
      const map: Record<string, { qty: number; notes: string }> = {}
      for (const l of c.lines) {
        map[l.branchStockId] = { qty: l.physicalQty, notes: l.notes || '' }
      }
      setPhysicalMap(map)
    } catch (e: any) {
      setFetchError(e.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadCount() }, [loadCount])

  /* ── derived lines (merge systemQty from count + local physicalMap) ── */
  const lines: (CountLine & { localPhysical: number; localDiff: number; localNotes: string })[] =
    (count?.lines || []).map(l => {
      const local = physicalMap[l.branchStockId] ?? { qty: l.physicalQty, notes: l.notes || '' }
      const localDiff = local.qty - l.systemQty
      return { ...l, localPhysical: local.qty, localDiff, localNotes: local.notes }
    })

  /* ── search filter ─────────────────────────────────────────────────── */
  const filteredLines = search.trim()
    ? lines.filter(l =>
        l.productName.toLowerCase().includes(search.toLowerCase()) ||
        (l.stockIdentifier || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.selectedSize || '').toLowerCase().includes(search.toLowerCase())
      )
    : lines

  /* ── update a single line's physical qty ──────────────────────────── */
  const setQty = (branchStockId: string, qty: number) => {
    setPhysicalMap(prev => ({
      ...prev,
      [branchStockId]: { ...prev[branchStockId], qty: Math.max(0, Math.round(qty)) },
    }))
    scheduleAutoSave()
  }

  const setNotes = (branchStockId: string, notes: string) => {
    setPhysicalMap(prev => ({
      ...prev,
      [branchStockId]: { ...prev[branchStockId], notes },
    }))
    scheduleAutoSave()
  }

  /* ── auto-save (debounced, 3 s after last edit) ────────────────────── */
  const scheduleAutoSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      doSave(false)
    }, 3000)
  }

  /* ── manual save ───────────────────────────────────────────────────── */
  const doSave = async (showFeedback = true) => {
    if (!count || count.status !== 'in_progress') return
    if (showFeedback) setSaving(true)
    setActionError('')
    try {
      const payload = Object.entries(physicalMap).map(([branchStockId, v]) => ({
        branchStockId,
        physicalQty: v.qty,
        notes: v.notes,
      }))
      const res = await fetch(`/api/pos/stock-count/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
    } catch (e: any) {
      if (showFeedback) setActionError(e.message)
    } finally {
      if (showFeedback) setSaving(false)
    }
  }

  /* ── apply ─────────────────────────────────────────────────────────── */
  const handleApply = async () => {
    setConfirmApply(false)
    setApplying(true)
    setActionError('')
    // Save latest physical quantities first so the API sees them
    await doSave(false)
    try {
      const res  = await fetch(`/api/pos/stock-count/${id}/apply`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to apply')
      setApplyResult({
        adjustedLines: data.adjustedLines,
        skippedLines:  data.skippedLines,
        appliedAt:     data.appliedAt,
      })
      await loadCount()   // refresh with final snapshot values
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setApplying(false)
    }
  }

  /* ── cancel ────────────────────────────────────────────────────────── */
  const handleCancel = async () => {
    setConfirmCancel(false)
    setCancelling(true)
    setActionError('')
    try {
      const res  = await fetch(`/api/pos/stock-count/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to cancel')
      await loadCount()
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setCancelling(false)
    }
  }

  /* ── stats summary ─────────────────────────────────────────────────── */
  const totalLines    = lines.length
  const filledLines   = lines.filter(l => physicalMap[l.branchStockId]?.qty !== undefined || l.physicalQty > 0).length
  const linesWithDiff = lines.filter(l => (physicalMap[l.branchStockId]?.qty ?? l.physicalQty) !== l.systemQty).length

  /* ── render guards ─────────────────────────────────────────────────── */
  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
    </div>
  )

  if (fetchError) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="text-gray-700">{fetchError}</p>
      <button onClick={() => router.push('/pos/stock-count')}
        className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
        Back to Counts
      </button>
    </div>
  )

  if (!count) return null

  const statusCfg  = STATUS_CONFIG[count.status]
  const StatusIcon = statusCfg.Icon
  const isActive   = count.status === 'in_progress'

  /* ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/pos/stock-count')}
            className="p-2 rounded-lg hover:bg-gray-100 transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{count.countRef}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusCfg.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {count.initiatedByName && `Started by ${count.initiatedByName}`}
              {count.appliedAt && ` · Applied ${fmtDateTime(count.appliedAt)}`}
              {count.branchCode && ` · ${count.branchCode}`}
            </p>
          </div>
        </div>

        {/* Action buttons — only for in-progress */}
        {isActive && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => doSave(true)} disabled={saving}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button onClick={() => setConfirmCancel(true)} disabled={cancelling}
              className="px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 inline-flex items-center gap-2">
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Cancel
            </button>
            <button onClick={() => setConfirmApply(true)} disabled={applying}
              className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 inline-flex items-center gap-2">
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
              Apply Count
            </button>
          </div>
        )}
      </div>

      {/* ── Apply result banner ────────────────────────────────────────── */}
      {applyResult && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-900">Stock count applied successfully</p>
            <p className="text-xs text-green-700 mt-0.5">
              {applyResult.adjustedLines} line{applyResult.adjustedLines !== 1 ? 's' : ''} adjusted ·{' '}
              {applyResult.skippedLines} unchanged · Applied {fmtDateTime(applyResult.appliedAt)}
            </p>
          </div>
        </div>
      )}

      {/* ── Confirm dialogs ────────────────────────────────────────────── */}
      {confirmApply && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-900">Apply this stock count?</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              BranchStock will be set to the physical quantities you entered. This cannot be undone.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setConfirmApply(false)}
              className="px-3 py-1.5 border border-emerald-300 rounded-lg text-sm text-emerald-700 hover:bg-white">
              Back
            </button>
            <button onClick={handleApply}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
              Yes, Apply
            </button>
          </div>
        </div>
      )}

      {confirmCancel && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-red-900">Cancel this count?</p>
            <p className="text-xs text-red-700 mt-0.5">Progress will be lost. No stock changes will be made.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setConfirmCancel(false)}
              className="px-3 py-1.5 border border-red-300 rounded-lg text-sm text-red-700 hover:bg-white">
              Keep Counting
            </button>
            <button onClick={handleCancel}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
              Yes, Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Action error ───────────────────────────────────────────────── */}
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{actionError}</p>
        </div>
      )}

      {/* ── Summary cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500">Total Lines</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalLines}</p>
          </CardContent>
        </Card>
        {isActive && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-gray-500">Counted</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">
                {lines.filter(l => (physicalMap[l.branchStockId]?.qty ?? 0) > 0 || l.physicalQty > 0).length}
                <span className="text-sm font-normal text-gray-400"> / {totalLines}</span>
              </p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500">{isActive ? 'Discrepancies' : 'Adjusted Lines'}</p>
            <p className={`text-2xl font-bold mt-0.5 ${linesWithDiff > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {isActive ? linesWithDiff : lines.filter(l => l.difference !== 0).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Search bar ────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by product name, SKU, or size…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* ── Count notes (applied / read-only) ─────────────────────────── */}
      {!isActive && count.notes && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
          <span className="font-medium">Notes: </span>{count.notes}
        </div>
      )}

      {/* ── Table header ──────────────────────────────────────────────── */}
      <div className="hidden sm:grid grid-cols-[1fr_80px_100px_100px_80px] gap-3 px-3 py-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Product</p>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider text-right">System</p>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Physical</p>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Difference</p>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Notes</p>
      </div>

      {/* ── Lines ─────────────────────────────────────────────────────── */}
      {filteredLines.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
          <Package2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No products match your search.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredLines.map(line => {
            const localQty  = physicalMap[line.branchStockId]?.qty ?? line.physicalQty
            const localDiff = localQty - line.systemQty
            const localNote = physicalMap[line.branchStockId]?.notes ?? line.notes ?? ''
            const diffColor =
              localDiff > 0 ? 'text-emerald-600' :
              localDiff < 0 ? 'text-red-600'     : 'text-gray-400'

            return (
              <div
                key={line.branchStockId}
                className={`bg-white rounded-xl border px-3 py-2.5 transition ${
                  localDiff !== 0
                    ? 'border-amber-200'
                    : 'border-gray-200'
                }`}
              >
                {/* Mobile layout */}
                <div className="flex items-center gap-3 sm:hidden">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {line.variantImageUrl
                      ? <img src={line.variantImageUrl} alt={line.productName} className="w-full h-full object-cover" />
                      : <Package2 className="w-4 h-4 text-gray-300 m-auto mt-2" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{line.productName}</p>
                    {line.selectedSize && (
                      <p className="text-xs text-gray-400">{line.selectedSize}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">Sys: {line.systemQty}</p>
                    {isActive ? (
                      <input
                        type="number"
                        min={0}
                        value={localQty}
                        onChange={e => setQty(line.branchStockId, Number(e.target.value))}
                        className="w-20 mt-0.5 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <p className="text-sm font-bold text-gray-900">{line.physicalQty}</p>
                    )}
                    <p className={`text-xs font-semibold mt-0.5 ${diffColor}`}>
                      {localDiff > 0 ? `+${localDiff}` : localDiff}
                    </p>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:grid grid-cols-[1fr_80px_100px_100px_80px] gap-3 items-center">
                  {/* Product */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {line.variantImageUrl
                        ? <img src={line.variantImageUrl} alt={line.productName} className="w-full h-full object-cover" />
                        : <Package2 className="w-3.5 h-3.5 text-gray-300 m-auto mt-2" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{line.productName}</p>
                      {line.selectedSize && (
                        <p className="text-xs text-gray-400">{line.selectedSize}</p>
                      )}
                    </div>
                  </div>

                  {/* System qty — always read-only */}
                  <p className="text-sm font-medium text-gray-500 text-right">{line.systemQty}</p>

                  {/* Physical qty */}
                  {isActive ? (
                    <input
                      type="number"
                      min={0}
                      value={localQty}
                      onChange={e => setQty(line.branchStockId, Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-900 text-right">{line.physicalQty}</p>
                  )}

                  {/* Difference */}
                  <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${diffColor}`}>
                    {localDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> :
                     localDiff < 0 ? <TrendingDown className="w-3.5 h-3.5" /> :
                     <Minus className="w-3.5 h-3.5" />}
                    {localDiff > 0 ? `+${localDiff}` : localDiff}
                  </div>

                  {/* Notes */}
                  {isActive ? (
                    <input
                      type="text"
                      value={localNote}
                      onChange={e => setNotes(line.branchStockId, e.target.value)}
                      placeholder="Note…"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-xs text-gray-400 text-right truncate">{line.notes || '—'}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Applied meta footer ────────────────────────────────────────── */}
      {count.status === 'applied' && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 space-y-1">
          <p>
            <span className="font-medium">Applied by: </span>
            {count.appliedByName || '—'}
          </p>
          <p>
            <span className="font-medium">Applied at: </span>
            {fmtDateTime(count.appliedAt)}
          </p>
          {count.notes && (
            <p><span className="font-medium">Notes: </span>{count.notes}</p>
          )}
        </div>
      )}

      {/* ── Bottom sticky action bar (in-progress only, mobile-friendly) */}
      {isActive && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2 z-10">
          <button onClick={() => doSave(true)} disabled={saving}
            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 inline-flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
          <button onClick={() => setConfirmApply(true)} disabled={applying}
            className="flex-1 px-3 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2">
            {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
            Apply
          </button>
        </div>
      )}

    </div>
  )
}
