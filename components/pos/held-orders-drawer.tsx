'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Search, RotateCcw, XCircle, Clock, User, Package, Loader2, AlertTriangle } from 'lucide-react'
import { usePosCartStore } from '@/lib/pos/cart-store'
import { formatKES } from '@/lib/pos/money'

interface HeldOrderItem {
  productId: string
  productName: string
  itemCode?: string
  sku?: string
  selectedImageIndex: number
  selectedImageUrl: string
  selectedSize?: string
  quantity: number
  retailUnitPrice: number
  wholesaleUnitPrice?: number
  originalUnitPrice: number
  actualUnitPrice: number
  lineDiscountMinor: number
  lineSubtotalMinor: number
  lineTotalMinor: number
  pricingMode: 'retail' | 'wholesale'
}

interface HeldOrder {
  _id: string
  holdNumber: string
  items: HeldOrderItem[]
  pricingMode: 'retail' | 'wholesale'
  cartDiscountType?: 'percent' | 'fixed'
  cartDiscountValue?: number
  cartDiscountMinor: number
  cartDiscountReason?: string
  customerName?: string
  customerPhone?: string
  subtotalMinor: number
  totalDiscountMinor: number
  totalMinor: number
  cashierName: string
  holdReason?: string
  notes?: string
  createdAt: string
}

interface HeldOrdersDrawerProps {
  open: boolean
  onClose: () => void
  /** Called after a held order is successfully resumed into the cart */
  onResumed: () => void
}

export default function HeldOrdersDrawer({ open, onClose, onResumed }: HeldOrdersDrawerProps) {
  const [orders, setOrders]       = useState<HeldOrder[]>([])
  const [loading, setLoading]     = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [actionId, setActionId]   = useState<string | null>(null) // id of order being acted on
  const [error, setError]         = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { loadHeldOrder, items: cartItems } = usePosCartStore()

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  // Fetch held orders whenever the drawer opens or search changes
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ status: 'held' })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch(`/api/pos/held-orders?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load held orders')
      setOrders(data.heldOrders || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    if (open) fetchOrders()
  }, [open, fetchOrders])

  // ── Resume ─────────────────────────────────────────────────────────────────
  const handleResume = async (order: HeldOrder) => {
    // Warn if cart already has items
    if (cartItems.length > 0) {
      const ok = window.confirm(
        `You have ${cartItems.length} item(s) in the current cart. Resuming this order will replace them. Continue?`
      )
      if (!ok) return
    }

    setActionId(order._id)
    try {
      const res = await fetch(`/api/pos/held-orders/${order._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resume order')

      // Load the held order's cart state
      loadHeldOrder({
        items: order.items.map(i => ({
          id: `${i.productId}-${i.selectedImageIndex}-${i.selectedSize || ''}-${Date.now()}`,
          productId: i.productId,
          productName: i.productName,
          itemCode: i.itemCode,
          sku: i.sku,
          selectedImageIndex: i.selectedImageIndex,
          selectedImageUrl: i.selectedImageUrl,
          selectedSize: i.selectedSize,
          quantity: i.quantity,
          retailUnitPrice: i.retailUnitPrice,
          wholesaleUnitPrice: i.wholesaleUnitPrice,
          originalUnitPrice: i.originalUnitPrice,
          actualUnitPrice: i.actualUnitPrice,
          lineDiscountMinor: i.lineDiscountMinor,
          lineSubtotalMinor: i.lineSubtotalMinor,
          lineTotalMinor: i.lineTotalMinor,
          pricingMode: i.pricingMode,
          addedAt: new Date().toISOString(),
        })),
        pricingMode: order.pricingMode,
        cartDiscountType: order.cartDiscountType,
        cartDiscountValue: order.cartDiscountValue,
        cartDiscountReason: order.cartDiscountReason,
        notes: order.notes,
      })

      onResumed()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionId(null)
    }
  }

  // ── Cancel ─────────────────────────────────────────────────────────────────
  const handleCancel = async (order: HeldOrder) => {
    const ok = window.confirm(`Cancel held order ${order.holdNumber}? This cannot be undone.`)
    if (!ok) return

    setActionId(order._id)
    try {
      const res = await fetch(`/api/pos/held-orders/${order._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to cancel order')
      // Remove from local list
      setOrders(prev => prev.filter(o => o._id !== order._id))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionId(null)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Held Orders
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tap Resume to continue an order
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by hold ID, customer name or phone…"
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin" />
              <p className="text-sm">Loading held orders…</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <Package className="h-10 w-10 opacity-30" />
              <p className="text-sm">No held orders found</p>
              {debouncedSearch && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-primary hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y">
              {orders.map(order => {
                const isActing = actionId === order._id
                const isExpanded = expandedId === order._id
                const age = Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000)
                const ageLabel = age < 60
                  ? `${age}m ago`
                  : `${Math.round(age / 60)}h ago`

                return (
                  <li key={order._id} className="p-4">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold bg-muted px-1.5 py-0.5 rounded">
                            {order.holdNumber}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {ageLabel}
                          </span>
                        </div>

                        {order.customerName && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{order.customerName}</span>
                            {order.customerPhone && <span>· {order.customerPhone}</span>}
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground mt-0.5">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''} · Cashier: {order.cashierName}
                        </div>

                        {order.holdReason && (
                          <div className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 inline-block">
                            {order.holdReason}
                          </div>
                        )}
                      </div>

                      {/* Total */}
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm text-primary">
                          {formatKES(order.totalMinor / 100)}
                        </p>
                      </div>
                    </div>

                    {/* Expandable items preview */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : order._id)}
                      className="mt-2 text-xs text-primary hover:underline"
                    >
                      {isExpanded ? 'Hide items' : 'Show items'}
                    </button>

                    {isExpanded && (
                      <ul className="mt-2 space-y-1 border-t pt-2">
                        {order.items.map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.selectedImageUrl}
                              alt={item.productName}
                              className="w-8 h-8 rounded object-cover bg-muted shrink-0"
                            />
                            <span className="flex-1 truncate">
                              {item.productName}
                              {item.selectedSize ? ` (${item.selectedSize})` : ''}
                              {' '}× {item.quantity}
                            </span>
                            <span className="shrink-0 text-muted-foreground">
                              {formatKES(item.lineTotalMinor / 100)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleResume(order)}
                        disabled={isActing}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {isActing
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <RotateCcw className="h-4 w-4" />}
                        Resume
                      </button>
                      <button
                        onClick={() => handleCancel(order)}
                        disabled={isActing}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-md border border-destructive text-destructive text-sm font-medium hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                      >
                        {isActing
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <XCircle className="h-4 w-4" />}
                        Cancel
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>{orders.length} order{orders.length !== 1 ? 's' : ''} on hold</span>
          <button onClick={fetchOrders} className="text-primary hover:underline">
            Refresh
          </button>
        </div>
      </div>
    </>
  )
}
