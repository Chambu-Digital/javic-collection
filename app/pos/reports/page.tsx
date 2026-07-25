'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3, TrendingUp, Banknote, CreditCard, Package,
  Search, Download, Calendar, Loader2, X, ArrowUpRight,
  ShoppingBag, Users, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatKES } from '@/lib/pos/money'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'sales' | 'payments' | 'credit' | 'inventory' | 'ledger'

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className="rounded-xl border bg-background p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold leading-tight mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
      {children}
    </p>
  )
}

function Row({ label, value, sub, valueClass = '' }: {
  label: string; value: string; sub?: string; valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <p className={`text-sm font-semibold shrink-0 ml-4 ${valueClass}`}>{value}</p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
      <BarChart3 className="h-10 w-10 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
    </div>
  )
}

function eventColor(eventType: string) {
  if (eventType.includes('sale'))      return 'text-green-600'
  if (eventType.includes('payment'))   return 'text-blue-600'
  if (eventType.includes('credit'))    return 'text-purple-600'
  if (eventType.includes('return') || eventType.includes('refund')) return 'text-red-600'
  if (eventType.includes('inventory')) return 'text-amber-600'
  return 'text-muted-foreground'
}

function eventDot(eventType: string) {
  if (eventType.includes('sale'))      return 'bg-green-500'
  if (eventType.includes('payment'))   return 'bg-blue-500'
  if (eventType.includes('credit'))    return 'bg-purple-500'
  if (eventType.includes('return') || eventType.includes('refund')) return 'bg-red-500'
  if (eventType.includes('inventory')) return 'bg-amber-500'
  return 'bg-gray-400'
}

function fmtEvent(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PosReportsPage() {
  const [tab, setTab]                   = useState<Tab>('sales')
  const [dateRange, setDateRange]       = useState('today')
  const [summaryData, setSummaryData]   = useState<any>(null)
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([])
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingLedger, setLoadingLedger]   = useState(false)
  const [searchQuery, setSearchQuery]   = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => { fetchSummary() }, [dateRange])     // eslint-disable-line
  useEffect(() => { fetchLedger()  }, [dateRange, debouncedSearch, tab]) // eslint-disable-line

  const fetchSummary = async () => {
    setLoadingSummary(true)
    try {
      const res  = await fetch(`/api/pos/reports/summary?quickDate=${dateRange}`)
      setSummaryData(await res.json())
    } catch { /* silent */ }
    finally { setLoadingSummary(false) }
  }

  const fetchLedger = useCallback(async () => {
    if (tab !== 'ledger') return
    setLoadingLedger(true)
    try {
      const p = new URLSearchParams({ quickDate: dateRange })
      if (debouncedSearch) p.set('search', debouncedSearch)
      const res = await fetch(`/api/pos/reports/ledger?${p}`)
      const data = await res.json()
      setLedgerEntries(data.entries || [])
    } catch { setLedgerEntries([]) }
    finally { setLoadingLedger(false) }
  }, [tab, dateRange, debouncedSearch])

  useEffect(() => { if (tab === 'ledger') fetchLedger() }, [tab, fetchLedger])

  const s = summaryData

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'sales',     label: 'Sales',     icon: TrendingUp },
    { id: 'payments',  label: 'Payments',  icon: Banknote   },
    { id: 'credit',    label: 'Credit',    icon: CreditCard },
    { id: 'inventory', label: 'Inventory', icon: Package    },
    { id: 'ledger',    label: 'Ledger',    icon: BarChart3  },
  ]

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Page header ── */}
      <div className="shrink-0 px-4 sm:px-6 py-4 border-b bg-background">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-bold">Reports & Ledger</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sales, payments, credit and inventory activity
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <Calendar className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5 h-9">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-9 px-2.5"
              onClick={() => { fetchSummary(); fetchLedger() }}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Summary stat cards ── */}
      <div className="shrink-0 px-4 sm:px-6 py-4 border-b bg-muted/20">
        {loadingSummary ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="rounded-xl border bg-background h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={TrendingUp} label="Total Sales"
              value={formatKES(s?.sales?.total?.amount || 0)}
              sub={`${s?.sales?.total?.count || 0} transactions`}
              color="bg-green-100 text-green-700" />
            <StatCard icon={Banknote} label="Cash Collected"
              value={formatKES(s?.payments?.cash?.amount || 0)}
              sub={`${s?.payments?.cash?.count || 0} payments`}
              color="bg-blue-100 text-blue-700" />
            <StatCard icon={ShoppingBag} label="POS Sales"
              value={formatKES(s?.sales?.pos?.amount || 0)}
              sub={`${s?.sales?.pos?.count || 0} transactions`}
              color="bg-violet-100 text-violet-700" />
            <StatCard icon={Users} label="Outstanding Credit"
              value={formatKES(s?.credit?.outstanding?.amount || 0)}
              sub={`${s?.credit?.outstanding?.customerCount || 0} customers`}
              color="bg-amber-100 text-amber-700" />
          </div>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="shrink-0 flex gap-1 px-4 sm:px-6 py-2 border-b bg-background overflow-x-auto scrollbar-none">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              tab === id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}>
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">

        {/* SALES */}
        {tab === 'sales' && (
          <div className="space-y-5">
            <SectionLabel>Breakdown</SectionLabel>
            {loadingSummary ? <Spinner /> : s ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Online Sales',    val: s.sales?.online,    color: 'text-blue-600'  },
                    { label: 'POS Sales',       val: s.sales?.pos,       color: 'text-green-600' },
                    { label: 'Retail Sales',    val: s.sales?.retail,    color: 'text-violet-600'},
                    { label: 'Wholesale Sales', val: s.sales?.wholesale, color: 'text-amber-600' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="rounded-xl border bg-background p-4">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={`text-xl font-bold mt-1 ${color}`}>{formatKES(val?.amount || 0)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{val?.count || 0} transactions</p>
                    </div>
                  ))}
                </div>

                {s.performance?.byProduct?.length > 0 && (
                  <div className="rounded-xl border bg-background">
                    <div className="px-4 pt-4 pb-2">
                      <SectionLabel>Top Products</SectionLabel>
                    </div>
                    <div className="divide-y px-4">
                      {s.performance.byProduct.slice(0, 5).map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{p.productName}</p>
                              <p className="text-xs text-muted-foreground">{p.quantity} sold</p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold shrink-0 ml-4 text-green-600">{formatKES(p.amount)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : <EmptyState message="No sales data for this period" />}
          </div>
        )}

        {/* PAYMENTS */}
        {tab === 'payments' && (
          <div className="space-y-5">
            <SectionLabel>Payment Methods</SectionLabel>
            {loadingSummary ? <Spinner /> : s ? (
              <div className="rounded-xl border bg-background divide-y px-4">
                {[
                  { label: 'Cash',    val: s.payments?.cash,   color: 'text-green-600' },
                  { label: 'M-Pesa',  val: s.payments?.mpesa,  color: 'text-blue-600'  },
                  { label: 'Credit',  val: s.payments?.credit, color: 'text-purple-600'},
                  { label: 'Split',   val: s.payments?.split,  color: 'text-amber-600' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {val?.count || 0} transactions
                      </p>
                    </div>
                    <p className={`text-base font-bold ${color}`}>{formatKES(val?.amount || 0)}</p>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="No payment data for this period" />}
          </div>
        )}

        {/* CREDIT */}
        {tab === 'credit' && (
          <div className="space-y-5">
            <SectionLabel>Credit Activity</SectionLabel>
            {loadingSummary ? <Spinner /> : s ? (
              <div className="rounded-xl border bg-background divide-y px-4">
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-medium">Credit Issued</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.credit?.issued?.count || 0} transactions</p>
                  </div>
                  <p className="text-base font-bold text-red-600">{formatKES(s.credit?.issued?.amount || 0)}</p>
                </div>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-medium">Credit Repaid</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.credit?.repaid?.count || 0} transactions</p>
                  </div>
                  <p className="text-base font-bold text-green-600">{formatKES(s.credit?.repaid?.amount || 0)}</p>
                </div>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-medium">Outstanding Balance</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.credit?.outstanding?.customerCount || 0} customers
                    </p>
                  </div>
                  <p className="text-base font-bold text-amber-600">{formatKES(s.credit?.outstanding?.amount || 0)}</p>
                </div>
              </div>
            ) : <EmptyState message="No credit activity for this period" />}
          </div>
        )}

        {/* INVENTORY */}
        {tab === 'inventory' && (
          <div className="space-y-5">
            <SectionLabel>Inventory Movements</SectionLabel>
            {loadingSummary ? <Spinner /> : (
              s?.inventory?.length > 0 ? (
                <div className="rounded-xl border bg-background divide-y px-4">
                  {s.inventory.map((m: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-4">
                      <div>
                        <p className="text-sm font-medium">{fmtEvent(m.eventType)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.count} events</p>
                      </div>
                      <p className={`text-base font-bold ${m.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.quantity >= 0 ? '+' : ''}{m.quantity}
                      </p>
                    </div>
                  ))}
                </div>
              ) : <EmptyState message="No inventory movements in this period" />
            )}
          </div>
        )}

        {/* LEDGER */}
        {tab === 'ledger' && (
          <div className="space-y-4">
            {/* Ledger search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search order number, customer, product…"
                className="pl-9 pr-8"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {loadingLedger ? <Spinner /> : ledgerEntries.length === 0 ? (
              <EmptyState message="No ledger entries for this period" />
            ) : (
              <div className="rounded-xl border bg-background divide-y">
                {ledgerEntries.map((entry: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3.5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${eventDot(entry.eventType)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{fmtEvent(entry.eventType)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {[entry.customerName, entry.productName, entry.userName]
                              .filter(Boolean).join(' · ') || 'System'}
                            {entry.paymentMethod && ` · ${entry.paymentMethod}`}
                          </p>
                          {entry.referenceNumber && (
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              {entry.referenceNumber}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-semibold ${eventColor(entry.eventType)}`}>
                            {entry.totalMinor ? formatKES(entry.totalMinor / 100) : '—'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(entry.createdAt).toLocaleTimeString('en-KE', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                          {entry.wasOffline && (
                            <span className="inline-block text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full mt-0.5">
                              Offline
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Split payment breakdown */}
                      {entry.paymentBreakdown?.length > 1 && (
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {entry.paymentBreakdown.map((p: any, j: number) => (
                            <span key={j}
                              className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                              {p.method}: {formatKES(p.amountMinor / 100)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
