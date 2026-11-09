'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import {
  Plus,
  Search,
  Loader2,
  Package2,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
} from 'lucide-react'

interface Purchase {
  _id: string
  purchaseRef: string
  supplierInvoiceNo?: string
  vendorName?: string
  date: string
  paymentStatus: 'paid' | 'partial' | 'unpaid'
  paymentMethod?: string
  status: 'draft' | 'received' | 'cancelled'
  lineCount: number
  totalQuantity: number
  subtotal: number
  total: number
  receivedAt?: string
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    icon: Clock,
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
  },
  received: {
    label: 'Received',
    icon: CheckCircle2,
    bg: 'bg-green-100',
    text: 'text-green-700',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    bg: 'bg-gray-100',
    text: 'text-gray-500',
  },
}

const PAYMENT_STATUS_CONFIG = {
  paid: { label: 'Paid', color: 'text-green-600' },
  partial: { label: 'Partial', color: 'text-amber-600' },
  unpaid: { label: 'Unpaid', color: 'text-red-600' },
}

export default function StockInListPage() {
  const router = useRouter()
  const [branchId, setBranchId] = useState('')
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('pos-selected-branch')
    if (saved) setBranchId(saved)
  }, [])

  const fetchPurchases = useCallback(async () => {
    if (!branchId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        branchId,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/pos/purchases?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPurchases(data.purchases || [])
        setPagination(data.pagination)
      }
    } catch (e) {
      console.error('Error fetching purchases:', e)
    } finally {
      setLoading(false)
    }
  }, [branchId, pagination.page, search, statusFilter, refreshKey])

  useEffect(() => {
    const t = setTimeout(fetchPurchases, 300)
    return () => clearTimeout(t)
  }, [fetchPurchases])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/pos/inventory')}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock In — Purchases</h1>
            <p className="text-sm text-gray-500">
              {pagination.total} purchase{pagination.total !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/pos/stock-in/new')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Purchase
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by reference, invoice no., or supplier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 min-w-[160px]"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Package2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No purchases found</h3>
          <p className="text-sm text-gray-500 mb-5">
            {search || statusFilter
              ? 'Try adjusting your filters'
              : 'Create your first purchase to start recording stock-in.'}
          </p>
          {!search && !statusFilter && (
            <button
              onClick={() => router.push('/pos/stock-in/new')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Purchase
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {purchases.map((p) => {
              const statusCfg = STATUS_CONFIG[p.status]
              const StatusIcon = statusCfg.icon
              const paymentCfg = PAYMENT_STATUS_CONFIG[p.paymentStatus]
              return (
                <div
                  key={p._id}
                  onClick={() => router.push(`/pos/stock-in/${p._id}`)}
                  className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-4 cursor-pointer hover:border-emerald-300 hover:shadow-sm transition"
                >
                  {/* Status badge */}
                  <div
                    className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusCfg.label}
                  </div>

                  {/* Reference + supplier */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{p.purchaseRef}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {p.vendorName && (
                        <span className="text-xs text-gray-500 truncate">{p.vendorName}</span>
                      )}
                      {p.supplierInvoiceNo && (
                        <>
                          <span className="text-gray-300 text-xs">·</span>
                          <span className="text-xs text-gray-400">Inv: {p.supplierInvoiceNo}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Lines + qty */}
                  <div className="hidden sm:flex flex-col items-end flex-shrink-0">
                    <p className="text-xs text-gray-500">
                      {p.lineCount} line{p.lineCount !== 1 ? 's' : ''} · {p.totalQuantity} units
                    </p>
                    <p className={`text-xs font-medium mt-0.5 ${paymentCfg.color}`}>
                      {paymentCfg.label}
                    </p>
                  </div>

                  {/* Total */}
                  <div className="hidden md:block text-right flex-shrink-0 w-28">
                    <p className="text-sm font-bold text-gray-900">
                      KSh {p.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(p.date)}</p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
