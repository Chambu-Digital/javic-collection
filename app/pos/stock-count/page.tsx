'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Package2,
  TrendingUp,
  TrendingDown,
  Minus,
  Save,
  XCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  History,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CountLine {
  branchStockId: string
  stockIdentifier: string
  productId: string
  productName: string
  productSku?: string | null
  variantImageUrl?: string | null
  imageIndex: number
  selectedSize?: string | null
  systemQty: number      // live from BranchStock — read-only
  category: string
  categoryId: string
}

interface LocalEntry {
  physicalQty: number
  notes: string
}

interface PastCount {
  _id: string
  countRef: string
  status: 'in_progress' | 'applied' | 'cancelled'
  initiatedByName?: string
  appliedAt?: string
  notes?: string
  createdAt: string
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString('en-KE', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : '—'

const fmtDateTime = (d?: string) =>
  d
    ? new Date(d).toLocaleString('en-KE', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—'

const STATUS_CFG = {
  in_progress: { label: 'In Progress', Icon: Clock,        bg: 'bg-yellow-100', text: 'text-yellow-700' },
  applied:     { label: 'Applied',     Icon: CheckCircle2, bg: 'bg-green-100',  text: 'text-green-700'  },
  cancelled:   { label: 'Cancelled',   Icon: XCircle,      bg: 'bg-gray-100',   text: 'text-gray-500'   },
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function StockCountPage() {
  const router = useRouter()

  const [branchId, setBranchId] = useState('')
  const [tab, setTab] = useState<'count' | 'history'>('count')

  // Live snapshot from the API
  const [allLines, setAllLines] = useState<CountLine[]>([])
  const [loadingLines, setLoadingLines] = useState(false)
  const [loadError, setLoadError] = useState('')

  // Local physical qty entries — keyed by branchStockId
  const [entries, setEntries] = useState<Record<string, LocalEntry>>({})

  // Search / filter
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([])

  // Apply state
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState('')
  const [applyResult, setApplyResult] = useState<{
    ref: string; adjusted: number; skipped: number; appliedAt: string
  } | null>(null)
  const [confirmApply, setConfirmApply] = useState(false)
  const [countNotes, setCountNotes] = useState('')

  // History tab
  const [pastCounts, setPastCounts] = useState<PastCount[]>([])
  const [histLoading, setHistLoading] = useState(false)
  const [histRefresh, setHistRefresh] = useState(0)

  // Auto-save timer
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Branch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const saved = localStorage.getItem('pos-selected-branch')
    if (saved) setBranchId(saved)
  }, [])

  // ── Categories ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [])

  // ── Load live inventory snapshot ─────────────────────────────────────────────

  const loadLines = useCallback(async () => {
    if (!branchId) return
    setLoadingLines(true)
    setLoadError('')
    try {
      const params = new URLSearchParams({ branchId })
      const res = await fetch(`/api/pos/stock-count/direct?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load inventory')
      setAllLines(data.lines || [])
    } catch (e: any) {
      setLoadError(e.message)
    } finally {
      setLoadingLines(false)
    }
  }, [branchId])

  useEffect(() => {
    if (branchId) loadLines()
  }, [loadLines, branchId])

  // ── History ──────────────────────────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    if (!branchId) return
    setHistLoading(true)
    try {
      const res = await fetch(`/api/pos/stock-count?branchId=${branchId}&limit=20`)
      if (res.ok) {
        const d = await res.json()
        setPastCounts(d.counts || [])
      }
    } catch (e) { console.error(e) }
    finally { setHistLoading(false) }
  }, [branchId, histRefresh])

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab, loadHistory])

  // ── Entry helpers ────────────────────────────────────────────────────────────

  const getEntry = (branchStockId: string): LocalEntry =>
    entries[branchStockId] ?? { physicalQty: 0, notes: '' }

  const setPhysical = (branchStockId: string, qty: number) => {
    setEntries(prev => ({
      ...prev,
      [branchStockId]: {
        ...getEntry(branchStockId),
        physicalQty: Math.max(0, Math.round(qty)),
      },
    }))
  }

  const setNotes = (branchStockId: string, notes: string) => {
    setEntries(prev => ({
      ...prev,
      [branchStockId]: { ...getEntry(branchStockId), notes },
    }))
  }

  // ── Filtered lines ───────────────────────────────────────────────────────────

  const filteredLines = allLines.filter(l => {
    const matchSearch =
      !search ||
      l.productName.toLowerCase().includes(search.toLowerCase()) ||
      (l.productSku || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.selectedSize || '').toLowerCase().includes(search.toLowerCase()) ||
      l.stockIdentifier.toLowerCase().includes(search.toLowerCase())

    const matchCat = !categoryFilter || l.categoryId === categoryFilter

    return matchSearch && matchCat
  })

  // ── Summary stats ────────────────────────────────────────────────────────────

  const countedLines = filteredLines.filter(
    l => entries[l.branchStockId] !== undefined
  ).length
  const linesWithDiff = filteredLines.filter(l => {
    const e = entries[l.branchStockId]
    if (!e) return false
    return e.physicalQty !== l.systemQty
  }).length

  // ── Apply ────────────────────────────────────────────────────────────────────

  const handleApply = async () => {
    setConfirmApply(false)
    setApplying(true)
    setApplyError('')

    try {
      // Step 1 — create the StockCount document
      const createRes = await fetch('/api/pos/stock-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          scope: 'all',
          notes: countNotes,
        }),
      })
      const createData = await createRes.json()
      if (!createRes.ok) throw new Error(createData.error || 'Failed to create stock count')

      const countId = createData.stockCount?._id
      if (!countId) throw new Error('Stock count ID missing from response')

      // Step 2 — save all physical quantities for lines the cashier touched
      const linesToSave = filteredLines
        .filter(l => entries[l.branchStockId] !== undefined)
        .map(l => ({
          branchStockId: l.branchStockId,
          physicalQty: entries[l.branchStockId].physicalQty,
          notes: entries[l.branchStockId].notes || '',
        }))

      if (linesToSave.length === 0) {
        throw new Error('Enter at least one physical quantity before applying.')
      }

      const saveRes = await fetch(`/api/pos/stock-count/${countId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: linesToSave }),
      })
      if (!saveRes.ok) {
        const err = await saveRes.json()
        throw new Error(err.error || 'Failed to save physical quantities')
      }

      // Step 3 — apply
      const applyRes = await fetch(`/api/pos/stock-count/${countId}/apply`, {
        method: 'POST',
      })
      const applyData = await applyRes.json()
      if (!applyRes.ok) throw new Error(applyData.error || 'Failed to apply count')

      setApplyResult({
        ref: createData.stockCount.countRef,
        adjusted: applyData.adjustedLines,
        skipped: applyData.skippedLines,
        appliedAt: applyData.appliedAt,
      })

      // Reset entries and reload live quantities
      setEntries({})
      await loadLines()
    } catch (e: any) {
      setApplyError(e.message)
    } finally {
      setApplying(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (!branchId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/pos/inventory')} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Stock Count</h1>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">Select a branch in the sidebar to start counting.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/pos/inventory')} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Count</h1>
            <p className="text-sm text-gray-500">
              {allLines.length} lines · {countedLines} counted
              {linesWithDiff > 0 && ` · ${linesWithDiff} discrepanc${linesWithDiff !== 1 ? 'ies' : 'y'}`}
            </p>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setTab('count')}
            className={`px-4 py-2 text-sm font-medium transition ${tab === 'count' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Count
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-2 text-sm font-medium transition inline-flex items-center gap-1.5 ${tab === 'history' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            <History className="w-3.5 h-3.5" /> History
          </button>
        </div>
      </div>

      {/* ── COUNT TAB ────────────────────────────────────────────────────── */}
      {tab === 'count' && (
        <>
          {/* Apply result banner */}
          {applyResult && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">
                  Stock count applied — {applyResult.ref}
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  {applyResult.adjusted} line{applyResult.adjusted !== 1 ? 's' : ''} adjusted ·{' '}
                  {applyResult.skipped} unchanged · {fmtDateTime(applyResult.appliedAt)}
                </p>
              </div>
              <button
                onClick={() => setApplyResult(null)}
                className="ml-auto text-xs text-green-600 hover:text-green-800 underline flex-shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Confirm apply dialog */}
          {confirmApply && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-900">Apply this stock count?</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Stock quantities for {countedLines} line{countedLines !== 1 ? 's' : ''} will be set to the physical values you entered.
                  {linesWithDiff > 0 && ` ${linesWithDiff} will actually change.`} This cannot be undone.
                </p>
                <div className="mt-2">
                  <label className="block text-xs font-medium text-emerald-800 mb-1">Notes (optional)</label>
                  <input
                    type="text"
                    value={countNotes}
                    onChange={e => setCountNotes(e.target.value)}
                    placeholder="e.g. End-of-month count"
                    className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setConfirmApply(false)}
                  className="px-3 py-1.5 border border-emerald-300 rounded-lg text-sm text-emerald-700 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {applying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {applying ? 'Applying…' : 'Yes, Apply'}
                </button>
              </div>
            </div>
          )}

          {/* Apply error */}
          {applyError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{applyError}</p>
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-gray-500">Total Lines</p>
                <p className="text-2xl font-bold text-gray-900">{allLines.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-gray-500">Showing</p>
                <p className="text-2xl font-bold text-gray-900">{filteredLines.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-gray-500">Counted</p>
                <p className="text-2xl font-bold text-emerald-600">{countedLines}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-gray-500">Discrepancies</p>
                <p className={`text-2xl font-bold ${linesWithDiff > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {linesWithDiff}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product name, SKU, size or barcode…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 min-w-[180px]"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={loadLines}
              title="Refresh system quantities"
              className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-500"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Column headers */}
          {filteredLines.length > 0 && (
            <div className="hidden sm:grid grid-cols-[1fr_90px_110px_110px_80px] gap-2 px-3 py-1">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Product</p>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider text-right">System</p>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Physical</p>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Difference</p>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Notes</p>
            </div>
          )}

          {/* Lines */}
          {loadingLines ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
            </div>
          ) : loadError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{loadError}</p>
              <button onClick={loadLines} className="ml-auto text-xs text-red-600 underline">Retry</button>
            </div>
          ) : filteredLines.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <Package2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {search || categoryFilter ? 'No products match your search.' : 'No inventory found for this branch.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredLines.map(line => {
                const entry = entries[line.branchStockId]
                const physQty = entry?.physicalQty ?? line.systemQty  // default physical = system
                const diff    = entry !== undefined ? physQty - line.systemQty : 0
                const hasEntry = entry !== undefined

                const diffColor =
                  !hasEntry        ? 'text-gray-300' :
                  diff > 0         ? 'text-emerald-600' :
                  diff < 0         ? 'text-red-600' :
                                     'text-gray-400'

                return (
                  <div
                    key={line.branchStockId}
                    className={`bg-white rounded-xl border px-3 py-2.5 transition ${
                      hasEntry && diff !== 0
                        ? 'border-amber-200'
                        : hasEntry
                        ? 'border-emerald-100'
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
                        <p className="text-xs text-gray-400">System: {line.systemQty}</p>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-1">
                        <input
                          type="number"
                          min={0}
                          value={entry?.physicalQty ?? line.systemQty}
                          onChange={e => setPhysical(line.branchStockId, Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-emerald-500"
                        />
                        {hasEntry && (
                          <p className={`text-xs font-semibold ${diffColor}`}>
                            {diff > 0 ? `+${diff}` : diff}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden sm:grid grid-cols-[1fr_90px_110px_110px_80px] gap-2 items-center">
                      {/* Product info */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {line.variantImageUrl
                            ? <img src={line.variantImageUrl} alt={line.productName} className="w-full h-full object-cover" />
                            : <Package2 className="w-3.5 h-3.5 text-gray-300 m-auto mt-2" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{line.productName}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {[line.selectedSize, line.productSku].filter(Boolean).join(' · ') || line.stockIdentifier}
                          </p>
                        </div>
                      </div>

                      {/* System qty — ALWAYS read-only */}
                      <p className="text-sm font-semibold text-gray-500 text-right">{line.systemQty}</p>

                      {/* Physical qty — editable */}
                      <div className="flex justify-end">
                        <input
                          type="number"
                          min={0}
                          value={entry?.physicalQty ?? line.systemQty}
                          onChange={e => setPhysical(line.branchStockId, Number(e.target.value))}
                          className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>

                      {/* Difference */}
                      <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${diffColor}`}>
                        {hasEntry && diff > 0 && <TrendingUp className="w-3.5 h-3.5" />}
                        {hasEntry && diff < 0 && <TrendingDown className="w-3.5 h-3.5" />}
                        {hasEntry && diff === 0 && <Minus className="w-3.5 h-3.5" />}
                        {hasEntry ? (diff > 0 ? `+${diff}` : diff) : '—'}
                      </div>

                      {/* Notes */}
                      <input
                        type="text"
                        value={entry?.notes ?? ''}
                        onChange={e => setNotes(line.branchStockId, e.target.value)}
                        placeholder="Note…"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Apply button — fixed at bottom when there are counted lines */}
          {filteredLines.length > 0 && (
            <div className="flex justify-between items-center pt-2 pb-6">
              <p className="text-sm text-gray-500">
                {countedLines === 0
                  ? 'Edit physical quantities to start counting.'
                  : `${countedLines} line${countedLines !== 1 ? 's' : ''} entered${linesWithDiff > 0 ? ` · ${linesWithDiff} will change` : ' · no changes'}`}
              </p>
              <button
                onClick={() => setConfirmApply(true)}
                disabled={applying || countedLines === 0}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {applying
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying…</>
                  : <><ClipboardCheck className="w-4 h-4" /> Apply Count</>
                }
              </button>
            </div>
          )}

          {/* Mobile sticky footer */}
          {filteredLines.length > 0 && (
            <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-10">
              <button
                onClick={() => setConfirmApply(true)}
                disabled={applying || countedLines === 0}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {applying
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying…</>
                  : <><ClipboardCheck className="w-4 h-4" /> Apply Count</>
                }
              </button>
            </div>
          )}
        </>
      )}

      {/* ── HISTORY TAB ───────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setHistRefresh(k => k + 1)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {histLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
            </div>
          ) : pastCounts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No past stock counts found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pastCounts.map(c => {
                const cfg  = STATUS_CFG[c.status]
                const Icon = cfg.Icon
                return (
                  <div
                    key={c._id}
                    onClick={() => router.push(`/pos/stock-count/${c._id}`)}
                    className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-4 cursor-pointer hover:border-emerald-300 hover:shadow-sm transition"
                  >
                    <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{c.countRef}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-gray-400">
                        {c.initiatedByName && <span>by {c.initiatedByName}</span>}
                        {c.notes && <><span>·</span><span className="truncate max-w-[180px]">{c.notes}</span></>}
                      </div>
                    </div>
                    <div className="hidden sm:block text-right text-xs text-gray-400 flex-shrink-0">
                      {c.status === 'applied' && c.appliedAt
                        ? `Applied ${fmtDate(c.appliedAt)}`
                        : `Started ${fmtDate(c.createdAt)}`}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
