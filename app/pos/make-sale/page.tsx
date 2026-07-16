'use client'

import { useState, useEffect, useCallback } from 'react'
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

  // ── Cart ──
  const {
    items, pricingMode, customer,
    setPricingMode, addItem, updateItem, removeItem,
    getSubtotalMinor, getTotalDiscountMinor, getTotalMinor,
    setCartDiscount, clearCart,
  } = usePosCartStore()

  const subtotal = getSubtotalMinor() / 100
  const discount = getTotalDiscountMinor() / 100
  const total    = getTotalMinor() / 100
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

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

  // ── Load products ──
  const fetchProducts = useCallback(async (resetPage = true) => {
    const currentPage = resetPage ? 1 : page
    setLoadingProducts(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (selectedCategory !== 'all') params.set('category', selectedCategory)
      params.set('page', String(currentPage))
      params.set('limit', '48')
      const res  = await fetch(`/api/pos/products/search?${params}`)
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
  }, [debouncedSearch, selectedCategory, page])

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
            method: p.method, amount: p.amount,
            mpesaReference: p.reference,
            cashReceived: p.method === 'cash' ? cashReceived : undefined,
          })),
          outletId: '000000000000000000000001',
          deviceId: typeof window !== 'undefined'
            ? (localStorage.getItem('javic-pos-device-id') || 'unknown') : 'unknown',
          notes: '',
        }),
      })
      const result = await res.json()
      if (result.success) {
        setLastReceipt(result.receipt)
        setSaleComplete(true)
        setShowPaymentModal(false)
        clearCart()
      } else {
        alert('Failed to complete sale: ' + (result.error || 'Unknown error'))
      }
    } catch {
      alert('Network error — sale was not saved.')
    }
  }

  // ─── Sale complete screen ──────────────────────────────────────────────────
  if (saleComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Sale Complete</h2>
          {lastReceipt?.orderNumber && (
            <p className="text-muted-foreground mt-1">Order #{lastReceipt.orderNumber}</p>
          )}
        </div>
        {lastReceipt && (
          <div className="w-full max-w-sm border rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between font-semibold">
              <span>Total</span><span>{formatKES(lastReceipt.total ?? 0)}</span>
            </div>
            {lastReceipt.payments?.map((p: any, i: number) => (
              <div key={i} className="flex justify-between text-muted-foreground">
                <span className="capitalize">{p.method}</span>
                <span>{formatKES(p.amount ?? 0)}</span>
              </div>
            ))}
          </div>
        )}
        <Button size="lg" onClick={() => { setSaleComplete(false); setLastReceipt(null) }}>
          New Sale
        </Button>
      </div>
    )
  }

  // ─── Main layout ───────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden bg-background">

      {/* ════════════════════════════════════════
          LEFT — product catalogue
      ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden p-5">

        {/* Page heading row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Make Sale</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Search and add products to cart</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 mt-1"
            onClick={() => setShowHeldOrders(true)}
          >
            <Clock className="h-4 w-4" />
            Held Orders
          </Button>
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
      ════════════════════════════════════════ */}
      <div className="w-72 xl:w-80 border-l bg-card flex flex-col shrink-0">

        {/* Cart header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              Cart ({totalQty})
            </h2>
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
