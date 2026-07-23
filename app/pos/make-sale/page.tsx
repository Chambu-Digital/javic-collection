'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, Camera, Clock, User, Package,
  Loader2, X, ChevronDown, Minus, Plus, Tag, ShoppingCart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PosProductCard, { PosProductCardProduct } from '@/components/pos/pos-product-card'
import VariantSelector from '@/components/pos/variant-selector'
import PaymentModal from '@/components/pos/payment-modal'
import BarcodeScanner from '@/components/pos/barcode-scanner'
import { usePosCartStore } from '@/lib/pos/cart-store'
import { formatKES } from '@/lib/pos/money'
import { usePosAuthStore } from '@/lib/pos/pos-auth-store'

interface Category { _id: string; name: string }

export default function MakeSalePage() {
  const { user } = usePosAuthStore()

  // ── Product browsing ──
  const [searchQuery, setSearchQuery]         = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [barcodeInput, setBarcodeInput]       = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories]           = useState<Category[]>([])
  const [products, setProducts]               = useState<PosProductCardProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [page, setPage]                       = useState(1)
  const [hasMore, setHasMore]                 = useState(false)
  const [totalProducts, setTotalProducts]     = useState(0)

  // ── UI state ──
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showVariantSelector, setShowVariantSelector] = useState(false)
  const [showPaymentModal, setShowPaymentModal]       = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner]   = useState(false)
  const [showHeldOrders, setShowHeldOrders]           = useState(false)
  const [cartDiscountInput, setCartDiscountInput]     = useState('')
  const [saleComplete, setSaleComplete]               = useState(false)
  const [lastReceipt, setLastReceipt]                 = useState<any>(null)
  const [saleError, setSaleError]                     = useState<string | null>(null)
  const [outletId, setOutletId]                       = useState<string | null>(null)

  // ── Cart ──
  const {
    items, pricingMode, customer,
    setPricingMode, addItem, updateItem, removeItem,
    getSubtotalMinor, getTotalDiscountMinor, getTotalMinor,
    setCartDiscount, clearCart, setOutlet,
  } = usePosCartStore()

  const subtotal = getSubtotalMinor() / 100
  const discount = getTotalDiscountMinor() / 100
  const total    = getTotalMinor() / 100
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

  const [showCart, setShowCart] = useState(false)

  // ── Debounce search ──
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [searchQuery])

  // ── Load categories ──
  useEffect(() => {
    setLoadingCategories(true)
    fetch('/api/pos/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false))
  }, [])

  // ── Load POS session (gets the real default outlet) ──
  useEffect(() => {
    fetch('/api/pos/session')
      .then(r => r.json())
      .then(d => {
        if (d.defaultOutlet?._id) {
          const id = d.defaultOutlet._id
          setOutletId(id)
          setOutlet(id)
        }
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load products ──
  // fetchProducts is stable (no changing deps in the callback itself) so it
  // can be used safely in the polling useEffect dependency array.
  const pageRef = useRef(page)
  useEffect(() => { pageRef.current = page }, [page])

  const fetchProducts = useCallback(async (resetPage = true) => {
    const currentPage = resetPage ? 1 : pageRef.current
    setLoadingProducts(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (selectedCategory !== 'all') params.set('category', selectedCategory)
      params.set('page', String(currentPage))
      params.set('limit', '48')
      const res  = await fetch(`/api/pos/products/search?${params}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      const data = await res.json()
      const incoming = data.products || []
      setProducts(resetPage ? incoming : prev => [...prev, ...incoming])
      setHasMore(data.pagination?.hasMore ?? false)
      setTotalProducts(data.pagination?.total ?? incoming.length)
      if (resetPage) setPage(1)
    } catch {
      if (resetPage) setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }, [debouncedSearch, selectedCategory]) // page intentionally omitted — read via ref

  useEffect(() => { fetchProducts(true) }, [debouncedSearch, selectedCategory]) // eslint-disable-line

  // ── Auto-refresh stock ──
  // 1. Refetch when the tab becomes visible again (catches changes made in
  //    another tab or the admin panel while this tab was in the background).
  // 2. Poll every 60 s so a multi-cashier setup stays consistent without a
  //    manual refresh.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchProducts(true)
    }
    document.addEventListener('visibilitychange', onVisible)

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchProducts(true)
    }, 60_000)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(interval)
    }
  }, [fetchProducts])

  useEffect(() => { fetchProducts(true) }, [debouncedSearch, selectedCategory]) // eslint-disable-line

  // ── Barcode add ──
  const handleBarcodeAdd = () => {
    if (!barcodeInput.trim()) return
    setSearchQuery(barcodeInput.trim())
    setBarcodeInput('')
  }

  // ── Product select → open variant modal ──
  const handleProductSelect = (product: PosProductCardProduct) => {
    setSelectedProduct(product)
    setShowVariantSelector(true)
  }

  // ── VariantSelector confirms → add to cart ──
  const handleVariantAdd = (item: {
    productId: string; productName: string; sku?: string
    selectedImageIndex: number; selectedImageUrl: string; selectedSize?: string
    quantity: number; retailUnitPrice: number; wholesaleUnitPrice?: number
    originalUnitPrice: number; actualUnitPrice: number
    pricingMode: 'retail' | 'wholesale'
  }) => {
    addItem({
      id: `${item.productId}-${item.selectedImageIndex}-${item.selectedSize || ''}-${Date.now()}`,
      productId: item.productId, productName: item.productName,
      itemCode: item.sku, sku: item.sku,
      selectedImageIndex: item.selectedImageIndex, selectedImageUrl: item.selectedImageUrl,
      selectedSize: item.selectedSize, quantity: item.quantity,
      retailUnitPrice: item.retailUnitPrice, wholesaleUnitPrice: item.wholesaleUnitPrice,
      originalUnitPrice: item.originalUnitPrice, actualUnitPrice: item.actualUnitPrice,
      pricingMode: item.pricingMode, addedBy: user?.id,
    })
    setShowVariantSelector(false)
    setSelectedProduct(null)
  }

  // ── Cart discount ──
  const applyCartDiscount = () => {
    const v = parseFloat(cartDiscountInput)
    if (!isNaN(v) && v >= 0) setCartDiscount('fixed', v, 'Manual discount')
    else setCartDiscount(undefined, undefined, undefined)
  }

  // ── Payment ──
  const handlePaymentConfirm = async (
    payments: { method: string; amount: number; reference?: string }[],
    cashReceived?: number
  ) => {
    setSaleError(null)

    if (!outletId) {
      setSaleError('POS outlet not configured. Please refresh and try again.')
      return
    }

    try {
      const res = await fetch('/api/pos/sales/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            selectedImageIndex: item.selectedImageIndex,
            selectedSize: item.selectedSize,
            quantity: item.quantity,
            lineDiscountType: item.lineDiscountType,
            lineDiscountValue: item.lineDiscountValue,
            priceOverride: item.priceOverride,
          })),
          pricingMode,
          customerId: customer?.id,
          customerName: customer?.name,
          customerPhone: customer?.phone,
          customerEmail: customer?.email,
          paymentAllocations: payments.map(p => ({
            method: p.method,
            amount: p.amount,
            mpesaReference: p.reference,
            cashReceived: p.method === 'cash' ? cashReceived : undefined,
          })),
          outletId,
          deviceId: typeof window !== 'undefined'
            ? (localStorage.getItem('javic-pos-device-id') || 'unknown')
            : 'unknown',
          notes: '',
        }),
      })

      const result = await res.json()

      if (result.success) {
        // Clear cart BEFORE showing receipt so it can't be re-submitted
        clearCart()
        setCartDiscountInput('')
        setShowPaymentModal(false)
        setShowCart(false)
        setLastReceipt(result.receipt)
        setSaleComplete(true)
        // Pre-fetch updated stock in the background so product cards are
        // ready with correct quantities when the cashier returns to selling
        fetchProducts(true)
      } else {
        // Surface the real server error so cashier knows what went wrong
        setSaleError(result.error || 'Sale failed — please try again.')
      }
    } catch {
      setSaleError('Network error — sale was not saved. Check your connection.')
    }
  }

  // ─── Sale complete / receipt dialog ────────────────────────────────────────
  if (saleComplete && lastReceipt) {
    const r = lastReceipt
    const cashAlloc   = r.payments?.find((p: any) => p.method === 'cash')
    const mpesaAlloc  = r.payments?.find((p: any) => p.method === 'mpesa')
    const creditAlloc = r.payments?.find((p: any) => p.method === 'credit')

    const handlePrint = (size: '58mm' | '80mm') => {
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
      const filename = r.orderNumber ? 'Receipt-' + r.orderNumber + '-' + ts : 'Receipt-' + ts
      const contentWidth = size === '58mm' ? '50mm' : '74mm'
      const fontSize     = size === '58mm' ? '10px' : '11px'
      const largeFontSize= size === '58mm' ? '12px' : '14px'
      const smallFontSize= size === '58mm' ? '8px'  : '9px'

      const fmt = (n: number) => n.toLocaleString('en-KE', { minimumFractionDigits: 2 })
      const row  = (label: string, value: string, cls?: string) =>
        '<div class="row' + (cls ? ' ' + cls : '') + '"><span class="label">' + label + '</span><span class="value">' + value + '</span></div>'

      // Build items HTML using plain string concatenation — no nested template literals
      let itemsHtml = ''
      for (const item of (r.items ?? [])) {
        const itemLabel = item.name + (item.size ? ' (' + item.size + ')' : '') + (item.pricingMode === 'wholesale' ? ' [WS]' : '')
        itemsHtml += '<div class="item-name">' + itemLabel + '</div>'
        itemsHtml += row(item.quantity + ' x KSH ' + fmt(item.price ?? 0), fmt(item.total ?? 0), 'small')
        if ((item.discount ?? 0) > 0) {
          itemsHtml += row('Discount', '-' + fmt(item.discount), 'small')
        }
      }

      // Build payment section
      let payHtml = ''
      if (cashAlloc) {
        payHtml += row('Cash', 'KSH ' + fmt(cashAlloc.amount ?? 0))
        if ((cashAlloc.cashReceived ?? 0) >= (cashAlloc.amount ?? 0)) {
          payHtml += row('Cash Received', 'KSH ' + fmt(cashAlloc.cashReceived))
        }
        if ((cashAlloc.changeGiven ?? 0) > 0) {
          payHtml += row('Change Returned', 'KSH ' + fmt(cashAlloc.changeGiven), 'bold')
        }
      }
      if (mpesaAlloc) {
        const mpesaLabel = 'M-Pesa' + (mpesaAlloc.mpesaReference ? '<br/><span class="small">' + mpesaAlloc.mpesaReference + '</span>' : '')
        payHtml += row(mpesaLabel, 'KSH ' + fmt(mpesaAlloc.amount ?? 0))
      }
      if (creditAlloc) {
        payHtml += row('Credit', 'KSH ' + fmt(creditAlloc.amount ?? 0))
      }
      if (r.outstandingCredit != null) {
        payHtml += row('Outstanding bal.', 'KSH ' + fmt(r.outstandingCredit), 'small mt')
      }

      // Optional header rows
      let headerRows = ''
      headerRows += row('<b>Receipt</b>', r.orderNumber ?? filename)
      const dateStr = r.date
        ? new Date(r.date).toLocaleString('en-KE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : now.toLocaleString('en-KE')
      headerRows += row('<b>Date</b>', dateStr)
      headerRows += row('<b>Cashier</b>', r.cashier ?? '')
      if (r.outlet)                                    headerRows += row('<b>Outlet</b>',   r.outlet)
      if (r.customer && r.customer !== 'Main Shop')    headerRows += row('<b>Customer</b>', r.customer)
      if (r.pricingMode === 'wholesale')               headerRows += row('<b>Pricing</b>',  'Wholesale')

      const discountRow = (r.discount ?? 0) > 0 ? row('Discount', '-' + fmt(r.discount)) : ''

      const receiptHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>' + filename + '</title><style>'
        + '@page{size:' + size + ' auto;margin:0}'
        + '*{box-sizing:border-box;max-width:100%;word-wrap:break-word;overflow-wrap:break-word}'
        + 'html,body{width:' + contentWidth + ';max-width:' + contentWidth + ';margin:0 auto;padding:3mm;'
        + 'font-family:"Courier New",Courier,monospace;font-size:' + fontSize + ';color:#000;background:#fff;'
        + '-webkit-print-color-adjust:exact;print-color-adjust:exact}'
        + '.center{text-align:center}.bold{font-weight:bold}.large{font-size:' + largeFontSize + '}'
        + '.small{font-size:' + smallFontSize + '}.mt{margin-top:4px}.mb{margin-bottom:4px}'
        + '.dashed{border:none;border-top:1px dashed #000;margin:5px 0}'
        + '.row{display:table;width:100%;margin:1.5px 0}'
        + '.row .label{display:table-cell;width:55%;vertical-align:top}'
        + '.row .value{display:table-cell;width:45%;text-align:right;vertical-align:top}'
        + '.item-name{word-break:break-word;margin-top:3px}'
        + '</style></head><body>'
        + '<div class="center bold large mb">JAVIC COLLECTION</div>'
        + '<div class="center small">Biashara St, Marikiti — Mombasa</div>'
        + '<div class="center small">0706 512 984 · 0723 277 306</div>'
        + '<div class="dashed"></div>'
        + headerRows
        + '<div class="dashed"></div>'
        + itemsHtml
        + '<div class="dashed"></div>'
        + discountRow
        + '<div class="row bold large mt"><span class="label">TOTAL</span><span class="value">KSH ' + fmt(r.total ?? 0) + '</span></div>'
        + '<div class="dashed"></div>'
        + payHtml
        + '<div class="dashed"></div>'
        + '<div class="center small mt mb">Thank you for shopping at<br/>Javic Collection!</div>'
        + '</body></html>'

      const popup = window.open('', '_blank', 'width=320,height=600,scrollbars=yes')
      if (!popup) {
        alert('Pop-up blocked. Please allow pop-ups for this site and try again.')
        return
      }
      popup.document.open()
      popup.document.write(receiptHtml)
      popup.document.close()

      let returned = false
      const returnToSale = () => {
        if (returned) return
        returned = true
        setSaleComplete(false)
        setLastReceipt(null)
        fetchProducts(true)
      }

      const triggerPrint = () => {
        popup.focus()
        popup.print()
        popup.onafterprint = () => { popup.close(); returnToSale() }
        const poll = setInterval(() => {
          if (popup.closed) { clearInterval(poll); returnToSale() }
        }, 500)
      }

      if (popup.document.readyState === 'complete') {
        triggerPrint()
      } else {
        popup.onload = triggerPrint
        setTimeout(() => { try { triggerPrint() } catch { /* already triggered */ } }, 600)
      }
    }

    const continueSelling = () => {
      setSaleComplete(false)
      setLastReceipt(null)
      fetchProducts(true)
    }

    return (
      <>
        {/* ── Completion dialog ── */}
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

            {/* Success header */}
            <div className="bg-green-500 text-white p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Sale Complete</h2>
              <p className="text-white/80 text-sm mt-0.5">
                Order #{r.orderNumber} · {formatKES(r.total ?? 0)}
              </p>
            </div>

            {/* Receipt preview — compact */}
            <div className="px-5 py-4 text-sm space-y-1.5 border-b max-h-64 overflow-y-auto">
              {/* Items */}
              {r.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between gap-2">
                  <span className="text-muted-foreground truncate flex-1">
                    {item.name}{item.size ? ` (${item.size})` : ''} × {item.quantity}
                  </span>
                  <span className="font-medium shrink-0">{formatKES(item.total ?? 0)}</span>
                </div>
              ))}

              {/* Totals */}
              {(r.discount ?? 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatKES(r.discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1.5 border-t font-bold">
                <span>Total</span>
                <span className="text-primary">{formatKES(r.total ?? 0)}</span>
              </div>

              {/* Payment breakdown */}
              {cashAlloc && (
                <div className="space-y-1 pt-1 border-t border-dashed">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cash</span>
                    <span>{formatKES(cashAlloc.amount ?? 0)}</span>
                  </div>
                  {(cashAlloc.cashReceived ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cash Received</span>
                      <span>{formatKES(cashAlloc.cashReceived)}</span>
                    </div>
                  )}
                  {(cashAlloc.changeGiven ?? 0) > 0 && (
                    <div className="flex justify-between font-semibold text-blue-700">
                      <span>Change Returned</span>
                      <span>{formatKES(cashAlloc.changeGiven)}</span>
                    </div>
                  )}
                </div>
              )}
              {mpesaAlloc && (
                <div className="flex justify-between pt-1 border-t border-dashed">
                  <span className="text-muted-foreground">
                    M-Pesa{mpesaAlloc.mpesaReference ? ` · ${mpesaAlloc.mpesaReference}` : ''}
                  </span>
                  <span>{formatKES(mpesaAlloc.amount ?? 0)}</span>
                </div>
              )}
              {creditAlloc && (
                <div className="flex justify-between pt-1 border-t border-dashed text-amber-700">
                  <span>Credit</span>
                  <span>{formatKES(creditAlloc.amount ?? 0)}</span>
                </div>
              )}
            </div>

            {/* Print size selector + actions */}
            <div className="p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground text-center">
                Select receipt paper size before printing
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePrint('58mm')}
                  className="flex flex-col items-center gap-1 p-3 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group"
                >
                  <svg className="w-6 h-6 text-muted-foreground group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span className="text-sm font-semibold">Print</span>
                  <span className="text-xs text-muted-foreground">58mm</span>
                </button>
                <button
                  onClick={() => handlePrint('80mm')}
                  className="flex flex-col items-center gap-1 p-3 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group"
                >
                  <svg className="w-6 h-6 text-muted-foreground group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span className="text-sm font-semibold">Print</span>
                  <span className="text-xs text-muted-foreground">80mm</span>
                </button>
              </div>
              <button
                onClick={continueSelling}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Continue Selling
              </button>
            </div>
          </div>
        </div>

      </>
    )
  }
  // ─── Main layout ───────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden bg-background">

      {/* ════════════════════════════════════════
          LEFT — product catalogue
      ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden p-3 sm:p-5">

        {/* Page heading row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Make Sale</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Search and add products to cart</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {/* Cart toggle — mobile only */}
            <Button
              variant="outline"
              size="sm"
              className="relative gap-1.5 lg:hidden"
              onClick={() => setShowCart(true)}
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
              {totalQty > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                  {totalQty > 9 ? '9+' : totalQty}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowHeldOrders(true)}
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Held Orders</span>
            </Button>
          </div>
        </div>

        {/* Search + category row */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, brand, model, variant…"
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setPage(1) }}
              className="h-10 appearance-none border rounded-md pl-3 pr-8 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Barcode row */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">⇌</span>
            <Input
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleBarcodeAdd()}
              placeholder="Enter barcode manually…"
              className="pl-8"
            />
          </div>
          <Button variant="outline" onClick={handleBarcodeAdd}>Add</Button>
          <Button variant="outline" size="icon" onClick={() => setShowBarcodeScanner(true)} title="Scan barcode">
            <Camera className="h-4 w-4" />
          </Button>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {loadingProducts && products.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
                  <div className="w-12 h-12 rounded bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
              <Package className="h-10 w-10 opacity-40" />
              <p className="text-sm">No products found</p>
              {(debouncedSearch || selectedCategory !== 'all') && (
                <Button variant="ghost" size="sm"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all') }}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* 2-column product row grid — matches screenshot */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {products.map(product => (
                  <ProductRow
                    key={String(product._id)}
                    product={product}
                    pricingMode={pricingMode}
                    onSelect={handleProductSelect}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" disabled={loadingProducts}
                    onClick={() => { const next = page + 1; setPage(next); fetchProducts(false) }}>
                    {loadingProducts && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          RIGHT — cart panel
          Desktop: fixed right column
          Mobile: full-screen drawer
      ════════════════════════════════════════ */}

      {/* Mobile backdrop */}
      {showCart && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setShowCart(false)}
        />
      )}

      <div className={`
        flex flex-col bg-card border-l shrink-0
        /* Desktop — always-visible right column */
        lg:relative lg:w-72 xl:lg:w-80 lg:translate-x-0 lg:z-auto
        /* Mobile — slide-in drawer from the right */
        fixed inset-y-0 right-0 z-40 w-80 max-w-[90vw]
        transition-transform duration-200
        ${showCart ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>

        {/* Cart header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              Cart ({totalQty})
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex rounded border text-xs overflow-hidden">
                <button
                  onClick={() => setPricingMode('retail')}
                  className={`px-2 py-1 font-medium transition-colors ${
                    pricingMode === 'retail' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >Retail</button>
                <button
                  onClick={() => setPricingMode('wholesale')}
                  className={`px-2 py-1 font-medium transition-colors ${
                    pricingMode === 'wholesale' ? 'bg-blue-600 text-white' : 'hover:bg-muted'
                  }`}
                >WS</button>
              </div>
              {/* Close button — mobile only */}
              <button
                onClick={() => setShowCart(false)}
                className="lg:hidden p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Close cart"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1 p-6">
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((item, index) => (
                <li key={item.id} className="p-3 flex gap-2.5 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.selectedImageUrl}
                    alt={item.productName}
                    className="w-11 h-11 rounded object-cover shrink-0 bg-muted"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.productName}</p>
                    {item.selectedSize && (
                      <p className="text-xs text-muted-foreground">Size: {item.selectedSize}</p>
                    )}
                    <p className="text-sm font-semibold text-primary">
                      {formatKES(item.actualUnitPrice)}
                    </p>
                    {/* Qty controls */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        onClick={() => item.quantity <= 1 ? removeItem(index) : updateItem(index, { quantity: item.quantity - 1 })}
                        className="w-5 h-5 rounded border flex items-center justify-center text-muted-foreground hover:bg-muted"
                      ><Minus className="h-2.5 w-2.5" /></button>
                      <span className="w-5 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(index, { quantity: item.quantity + 1 })}
                        className="w-5 h-5 rounded border flex items-center justify-center text-muted-foreground hover:bg-muted"
                      ><Plus className="h-2.5 w-2.5" /></button>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatKES(item.lineTotalMinor / 100)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(index)}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all self-start mt-0.5"
                  ><X className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cart footer — always visible */}
        <div className="border-t p-4 space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium">{formatKES(subtotal)}</span>
          </div>

          {/* Cart discount input — matches screenshot */}
          <div className="flex items-center justify-between text-sm gap-2">
            <span className="text-muted-foreground shrink-0">Cart Discount:</span>
            <Input
              value={cartDiscountInput}
              onChange={e => setCartDiscountInput(e.target.value)}
              onBlur={applyCartDiscount}
              onKeyDown={e => e.key === 'Enter' && applyCartDiscount()}
              placeholder="Discount"
              className="h-7 text-sm text-right w-28"
            />
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="flex items-center gap-1"><Tag className="h-3 w-3" />Applied</span>
              <span>-{formatKES(discount)}</span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center pt-1 border-t">
            <span className="font-bold text-base">Total:</span>
            <span className="font-bold text-xl text-primary">{formatKES(total)}</span>
          </div>

          {/* Customer row */}
          <button
            className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {/* TODO: customer picker */}}
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">{customer?.name ?? 'Add customer (optional)'}</span>
          </button>

          {/* Complete sale button */}
          <Button
            className="w-full"
            size="lg"
            disabled={items.length === 0}
            onClick={() => setShowPaymentModal(true)}
          >
            Complete Sale
          </Button>

          {items.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs">Hold Order</Button>
              <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={clearCart}>Clear</Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <VariantSelector
        product={selectedProduct}
        open={showVariantSelector}
        pricingMode={pricingMode}
        onClose={() => { setShowVariantSelector(false); setSelectedProduct(null) }}
        onAdd={handleVariantAdd}
      />

      {showPaymentModal && (
        <PaymentModal
          totalAmount={total}
          error={saleError}
          onErrorDismiss={() => setSaleError(null)}
          customer={customer ? {
            id: customer.id, name: customer.name,
            creditEnabled: customer.creditEnabled ?? false,
            creditLimit: customer.creditLimit ?? 0,
            availableCredit: customer.availableCredit ?? 0,
            outstandingBalance: customer.outstandingBalance ?? 0,
          } : undefined}
          onConfirm={handlePaymentConfirm}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}

      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={barcode => { setSearchQuery(barcode); setShowBarcodeScanner(false) }}
      />
    </div>
  )
}

// ─── Product Row — matches screenshot list layout ─────────────────────────────

function ProductRow({
  product,
  pricingMode,
  onSelect,
}: {
  product: PosProductCardProduct
  pricingMode: 'retail' | 'wholesale'
  onSelect: (p: PosProductCardProduct) => void
}) {
  const outOfStock = !product.available
  const displayPrice = pricingMode === 'wholesale' && product.wholesalePrice
    ? product.wholesalePrice
    : product.price
  const stock = product.stock ?? 0

  return (
    <div
      className={`flex items-center gap-3 p-3 border rounded-lg bg-card transition-colors ${
        outOfStock ? 'opacity-60' : 'hover:border-primary/30 hover:bg-accent/30 cursor-pointer'
      }`}
      onClick={() => !outOfStock && onSelect(product)}
    >
      {/* Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.images?.[0]?.url || '/placeholder.svg'}
        alt={product.name}
        className="w-12 h-12 rounded object-cover shrink-0 bg-muted"
      />

      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{product.name}</p>
        <p className="text-sm font-semibold text-primary mt-0.5">{formatKES(displayPrice)}</p>
      </div>

      {/* Stock badge — green circle like screenshot */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
        outOfStock ? 'bg-red-500' : stock <= 5 ? 'bg-amber-500' : 'bg-green-600'
      }`}>
        {outOfStock ? '0' : stock > 99 ? '99+' : stock}
      </div>

      {/* Add button */}
      <button
        disabled={outOfStock}
        onClick={e => { e.stopPropagation(); onSelect(product) }}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
          outOfStock
            ? 'border-muted text-muted-foreground cursor-not-allowed'
            : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
        }`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
