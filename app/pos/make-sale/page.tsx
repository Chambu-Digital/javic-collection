'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Search, Clock, Plus, Minus, Trash2, ShoppingCart,
  ChevronDown, X, Check, Package2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/user-store'
import {
  resolveVariantPricing,
  resolveUnitPrice,
  resolveUnitPriceDirect,
} from '@/lib/pos-pricing'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VariantRow {
  stockId: string
  variantIndex: number             // which variant (position in product.images[])
  size: string                    // 'One Size' or actual size string
  quantity: number
  stockIdentifier: string
  variantImageUrl: string | null   // this variant's image URL
  variantPrice: number | null     // per-variant retail override
  variantWholesalePrice: number | null
  variantSku: string | null
  vendor: { id: string; name: string; code: string }
}

interface ProductItem {
  productId: string
  name: string
  sku: string
  image: string | null            // first image — used as fallback on cards
  price: number                   // product-level retail
  wholesalePrice: number | null
  totalQuantity: number
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
  variants: VariantRow[]
}

interface CartItem {
  productId: string
  name: string
  variantImageUrl: string | null   // variant-specific image (this variant IS this image)
  // Raw prices (stored so we can recalc when wholesale toggles)
  productRetail: number
  productWholesale: number | null
  variantRetail: number | null
  variantWholesale: number | null
  // Current resolved price — updated whenever isWholesale changes
  resolvedPrice: number
  // Cart identity
  quantity: number
  size: string
  variantIndex: number             // which variant (image index) this line represents
  stockId: string
  sku: string
  maxStock: number
}

interface Category {
  _id: string
  name: string
}

// ─── Variant Picker Modal ─────────────────────────────────────────────────────

/**
 * Groups variant rows by variantIndex (each group = one variant / image in product.images[]).
 * Displays image thumbnails. For each group the cashier picks a size (or the
 * single "One Size" option), sets a quantity, then clicks Add to Cart.
 */
function VariantPickerModal({
  product,
  isWholesale,
  preselectedVariantIndex,
  preselectedSize,
  onAdd,
  onClose,
}: {
  product: ProductItem
  isWholesale: boolean
  preselectedVariantIndex?: number
  preselectedSize?: string
  onAdd: (variant: VariantRow, qty: number) => void
  onClose: () => void
}) {
  // Group variants by variantIndex, preserving the order they appear
  const groups = useMemo(() => {
    const map = new Map<number, VariantRow[]>()
    for (const v of product.variants) {
      const rows = map.get(v.variantIndex) ?? []
      rows.push(v)
      map.set(v.variantIndex, rows)
    }
    // Convert to array sorted by variantIndex
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([variantIndex, rows]) => ({
        variantIndex,
        variantImageUrl: rows[0].variantImageUrl,
        rows,
        // Is every size in this group out of stock?
        allOutOfStock: rows.every(r => r.quantity === 0),
      }))
  }, [product.variants])

  // Which variantIndex is currently active (highlighted)
  const defaultVariantIndex = preselectedVariantIndex ?? groups.find(g => !g.allOutOfStock)?.variantIndex ?? groups[0]?.variantIndex ?? 0
  const [activeVariantIndex, setActiveVariantIndex] = useState(defaultVariantIndex)

  // Which size is selected within the active variant group
  const activeGroup  = groups.find(g => g.variantIndex === activeVariantIndex) ?? groups[0]
  const defaultSize  = preselectedSize
    ?? (activeGroup?.rows.find(r => r.quantity > 0)?.size)
    ?? activeGroup?.rows[0]?.size
    ?? 'One Size'
  const [selectedSize, setSelectedSize] = useState(defaultSize)
  const [qty, setQty] = useState(1)

  // When the active variant group changes, reset size to the first available one
  const handleVariantSelect = (variantIndex: number) => {
    setActiveVariantIndex(variantIndex)
    const grp = groups.find(g => g.variantIndex === variantIndex)
    const firstAvailable = grp?.rows.find(r => r.quantity > 0)?.size ?? grp?.rows[0]?.size ?? 'One Size'
    setSelectedSize(firstAvailable)
    setQty(1)
  }

  // When size changes reset qty to 1
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size)
    setQty(1)
  }

  // The currently selected variant row
  const selectedRow = activeGroup?.rows.find(r => r.size === selectedSize) ?? activeGroup?.rows[0]
  const maxQty      = selectedRow?.quantity ?? 0
  const outOfStock  = maxQty === 0

  // Resolved price for this specific variant
  const pricing = selectedRow
    ? resolveVariantPricing(
        product.price,
        product.wholesalePrice,
        selectedRow.variantPrice,
        selectedRow.variantWholesalePrice,
      )
    : { retail: product.price, wholesale: product.wholesalePrice }

  const unitPrice = resolveUnitPrice(pricing, isWholesale)

  const handleAdd = () => {
    if (!selectedRow || outOfStock) return
    onAdd(selectedRow, qty)
  }

  // Keyboard: Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-gray-900 truncate">{product.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {product.sku && product.sku !== 'N/A' ? `SKU: ${product.sku} · ` : ''}
                {isWholesale ? 'Wholesale' : 'Retail'} mode
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-3 flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* ── Variant image row ────────────────────────────────── */}
            {groups.length > 1 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Select variant
                </p>
                <div className="flex gap-2 flex-wrap">
                  {groups.map(g => (
                    <button
                      key={g.variantIndex}
                      onClick={() => !g.allOutOfStock && handleVariantSelect(g.variantIndex)}
                      disabled={g.allOutOfStock}
                      className={`relative w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 transition ${
                        g.allOutOfStock
                          ? 'opacity-40 cursor-not-allowed border-gray-200'
                          : g.variantIndex === activeVariantIndex
                          ? 'border-emerald-500 shadow-md'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      {g.variantImageUrl ? (
                        <img
                          src={g.variantImageUrl}
                          alt={`Variant ${g.variantIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Package2 className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                      {g.variantIndex === activeVariantIndex && (
                        <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      {g.allOutOfStock && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-red-500 leading-tight text-center px-0.5">Out of stock</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Selected variant image (when only one or after selection) ── */}
            {groups.length === 1 && activeGroup?.variantImageUrl && (
              <div className="flex justify-center">
                <div className="w-28 h-28 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <img
                    src={activeGroup.variantImageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* ── Size selection ────────────────────────────────────── */}
            {activeGroup && !(activeGroup.rows.length === 1 && activeGroup.rows[0].size === 'One Size') && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Select size
                </p>
                <div className="flex gap-2 flex-wrap">
                  {activeGroup.rows.map(row => {
                    const isSelected = row.size === selectedSize
                    const noStock    = row.quantity === 0
                    return (
                      <button
                        key={row.size}
                        onClick={() => !noStock && handleSizeSelect(row.size)}
                        disabled={noStock}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                          noStock
                            ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                            : isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
                        }`}
                      >
                        {row.size}
                        <span className={`ml-1.5 text-xs ${noStock ? 'text-red-400' : 'text-gray-400'}`}>
                          {noStock ? '✕' : `(${row.quantity})`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Stock info for "One Size" variants ─────────────────── */}
            {activeGroup && activeGroup.rows.length === 1 && activeGroup.rows[0].size === 'One Size' && (
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                <span className="text-gray-500">Available stock</span>
                <span className={`font-bold ${outOfStock ? 'text-red-600' : 'text-emerald-700'}`}>
                  {maxQty} unit{maxQty !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* ── Price display ─────────────────────────────────────── */}
            {selectedRow && (
              <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                <div className="text-sm text-gray-600">
                  {isWholesale ? 'Wholesale price' : 'Retail price'}
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-emerald-700">
                    KSh {unitPrice.toLocaleString()}
                  </span>
                  {isWholesale && pricing.wholesale && pricing.wholesale !== pricing.retail && (
                    <p className="text-xs text-gray-400 line-through">
                      KSh {pricing.retail.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Quantity selector ─────────────────────────────────── */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Quantity
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="number"
                  min={1}
                  max={maxQty}
                  value={qty}
                  onChange={e => {
                    const v = parseInt(e.target.value) || 1
                    setQty(Math.min(maxQty, Math.max(1, v)))
                  }}
                  className="w-20 text-center px-2 py-2 border border-gray-300 rounded-lg text-base font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />

                <button
                  onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty}
                  className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <span className="text-sm text-gray-400 ml-1">
                  of {maxQty}
                </span>
              </div>

              {/* Line total preview */}
              {selectedRow && (
                <p className="text-sm text-gray-500 mt-2">
                  Line total:{' '}
                  <span className="font-semibold text-gray-900">
                    KSh {(unitPrice * qty).toLocaleString()}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100">
            {outOfStock ? (
              <p className="text-center text-sm font-medium text-red-500 py-2">
                Out of stock — select another variant or size
              </p>
            ) : (
              <button
                onClick={handleAdd}
                className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart — KSh {(unitPrice * qty).toLocaleString()}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MakeSalePage() {
  const { user }  = useUserStore()
  const router    = useRouter()

  const [branchId, setBranchId]             = useState('')
  const [products, setProducts]             = useState<ProductItem[]>([])
  const [categories, setCategories]         = useState<Category[]>([])
  const [cart, setCart]                     = useState<CartItem[]>([])
  const [search, setSearch]                 = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isWholesale, setIsWholesale]       = useState(false)
  const [barcode, setBarcode]               = useState('')
  const [discount, setDiscount]             = useState('')
  const [loading, setLoading]               = useState(false)

  // Variant picker state
  const [pickerProduct, setPickerProduct]             = useState<ProductItem | null>(null)
  const [pickerPreVariantIndex, setPickerPreVariantIndex] = useState<number | undefined>()
  const [pickerPreSize, setPickerPreSize]             = useState<string | undefined>()

  const searchRef  = useRef<HTMLInputElement>(null)
  const barcodeRef = useRef<HTMLInputElement>(null)

  // ─── Restore cart from sessionStorage (returning from payment page) ──────

  useEffect(() => {
    const saved = sessionStorage.getItem('pos-cart')
    if (saved) {
      try {
        const { cart: savedCart, discount: savedDiscount, isWholesale: savedWholesale } = JSON.parse(saved)
        if (savedCart?.length > 0) {
          setCart(savedCart)
          setDiscount(savedDiscount || '')
          setIsWholesale(savedWholesale || false)
        }
      } catch (e) {
        console.error('Error restoring cart:', e)
      }
      sessionStorage.removeItem('pos-cart')
    }
  }, [])

  // ─── Branch ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const saved = localStorage.getItem('pos-selected-branch')
    if (saved) setBranchId(saved)
  }, [])

  // ─── Categories ───────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(data))
      .catch(console.error)
  }, [])

  // ─── Products ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!branchId) return
    const fetch_ = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ branchId, limit: '100' })
        if (search)         params.set('search', search)
        if (categoryFilter) params.set('category', categoryFilter)
        const res = await fetch(`/api/pos/inventory?${params}`)
        if (res.ok) {
          const data = await res.json()
          setProducts(data.items)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    const t = setTimeout(fetch_, 300)
    return () => clearTimeout(t)
  }, [branchId, search, categoryFilter])

  // ─── Recalculate resolvedPrice on every cart item when wholesale toggles ──

  useEffect(() => {
    setCart(prev =>
      prev.map(item => ({
        ...item,
        resolvedPrice: resolveUnitPriceDirect(
          item.productRetail,
          item.productWholesale,
          item.variantRetail,
          item.variantWholesale,
          isWholesale,
        ),
      }))
    )
  }, [isWholesale])

  // ─── Cart calculations ────────────────────────────────────────────────────

  const subtotal       = cart.reduce((sum, item) => sum + item.resolvedPrice * item.quantity, 0)
  const discountAmount = parseFloat(discount) || 0
  const total          = Math.max(0, subtotal - discountAmount)

  // ─── Cart helpers ─────────────────────────────────────────────────────────

  /**
   * Builds a CartItem from a product + specific variant row + qty.
   * resolvedPrice is computed at add-time using the current isWholesale state.
   */
  const buildCartItem = (product: ProductItem, variant: VariantRow, qty: number): CartItem => {
    const resolvedPrice = resolveUnitPriceDirect(
      product.price,
      product.wholesalePrice,
      variant.variantPrice,
      variant.variantWholesalePrice,
      isWholesale,
    )
    return {
      productId:        product.productId,
      name:             product.name,
      variantImageUrl:  variant.variantImageUrl ?? product.image,
      productRetail:    product.price,
      productWholesale: product.wholesalePrice,
      variantRetail:    variant.variantPrice,
      variantWholesale: variant.variantWholesalePrice,
      resolvedPrice,
      quantity:         qty,
      size:             variant.size,
      variantIndex:     variant.variantIndex,
      stockId:          variant.stockId,
      sku:              variant.variantSku ?? product.sku,
      maxStock:         variant.quantity,
    }
  }

  const cartKey = (productId: string, variantIndex: number, size: string) =>
    `${productId}-${variantIndex}-${size}`

  const addVariantToCart = (product: ProductItem, variant: VariantRow, qty: number) => {
    const key = cartKey(product.productId, variant.variantIndex, variant.size)

    setCart(prev => {
      const existingIdx = prev.findIndex(
        c => cartKey(c.productId, c.variantIndex, c.size) === key
      )

      if (existingIdx !== -1) {
        // Merge into existing line — clamp at maxStock
        return prev.map((c, i) => {
          if (i !== existingIdx) return c
          const newQty = Math.min(c.maxStock, c.quantity + qty)
          return { ...c, quantity: newQty }
        })
      }

      return [...prev, buildCartItem(product, variant, qty)]
    })

    // Close picker
    setPickerProduct(null)
    setPickerPreVariantIndex(undefined)
    setPickerPreSize(undefined)
  }

  /**
   * Fast-path for truly simple products: single variant row, size === 'One Size'.
   * Skips the picker and adds directly (qty 1, merges if already in cart).
   */
  const addSimpleProduct = (product: ProductItem) => {
    const variant = product.variants[0]
    if (!variant || variant.quantity === 0) return
    addVariantToCart(product, variant, 1)
  }

  /**
   * Decides whether to open the picker or use the fast-path.
   */
  const handleProductClick = (product: ProductItem) => {
    const isSimple =
      product.variants.length === 1 &&
      product.variants[0].size === 'One Size'

    if (isSimple) {
      addSimpleProduct(product)
    } else {
      setPickerPreVariantIndex(undefined)
      setPickerPreSize(undefined)
      setPickerProduct(product)
    }
  }

  const updateQty = (idx: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const newQty = item.quantity + delta
      if (newQty < 1 || newQty > item.maxStock) return item
      return { ...item, quantity: newQty }
    }))
  }

  const removeFromCart = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx))
  }

  // ─── Barcode handling ─────────────────────────────────────────────────────

  const handleBarcode = () => {
    const raw = barcode.trim()
    if (!raw) return

    // 1. Try to match a specific variant by stockId or stockIdentifier
    for (const product of products) {
      const matchedVariant = product.variants.find(
        v => v.stockId === raw || v.stockIdentifier?.toLowerCase() === raw.toLowerCase()
      )
      if (matchedVariant) {
        // Specific variant matched
        const isSimple =
          product.variants.length === 1 &&
          matchedVariant.size === 'One Size'

        if (isSimple) {
          addSimpleProduct(product)
        } else {
          // Open picker pre-selected to this variant
          setPickerPreVariantIndex(matchedVariant.variantIndex)
          setPickerPreSize(matchedVariant.size !== 'One Size' ? matchedVariant.size : undefined)
          setPickerProduct(product)
        }
        setBarcode('')
        return
      }
    }

    // 2. Fall back: match by product barcode or SKU (product-level)
    const productMatch = products.find(
      p =>
        p.sku?.toLowerCase() === raw.toLowerCase() ||
        // barcode field is on the product returned from the API
        (p as any).barcode === raw
    )
    if (productMatch) {
      handleProductClick(productMatch)
      setBarcode('')
      return
    }

    // No match — keep the value so the cashier can see it
    searchRef.current?.focus()
  }

  // ─── Complete Sale ────────────────────────────────────────────────────────

  const handleCompleteSale = () => {
    if (cart.length === 0) return

    sessionStorage.setItem('pos-checkout', JSON.stringify({
      cart,
      subtotal,
      discountAmount,
      total,
      branchId,
      isWholesale,
      cashierId:   user?.id,
      cashierName: `${user?.firstName} ${user?.lastName}`,
    }))

    router.push('/pos/make-sale/payment')
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden -m-8">

        {/* ── Left Panel ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 p-6">

          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Make Sale</h1>
              <p className="text-sm text-gray-500 mt-0.5">Search and add products to cart</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-2">
                <span>Cart Nav: ↑↓ select</span>
                <span className="mx-1 text-gray-300">·</span>
                <span>Enter/Tab checkout</span>
                <span className="mx-1 text-gray-300">·</span>
                <span>Q qty</span>
                <span className="mx-1 text-gray-300">·</span>
                <span>D disc</span>
                <span className="mx-1 text-gray-300">·</span>
                <span>Del remove</span>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Clock className="w-4 h-4" />
                Held Orders
              </button>
            </div>
          </div>

          {/* Search + Category + Wholesale toggle */}
          <div className="flex gap-3 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search by name, brand, model, variant..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="appearance-none pl-4 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 min-w-[160px]"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {/* Retail / Wholesale toggle */}
            <div className="flex items-center gap-2 px-3 border border-gray-300 rounded-lg">
              <span className={`text-sm font-medium transition ${!isWholesale ? 'text-emerald-700' : 'text-gray-400'}`}>R</span>
              <button
                onClick={() => setIsWholesale(v => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isWholesale ? 'bg-emerald-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isWholesale ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm font-medium transition ${isWholesale ? 'text-emerald-700' : 'text-gray-400'}`}>W</span>
            </div>
          </div>

          {/* Barcode */}
          <div className="flex gap-2 mb-4">
            <input
              ref={barcodeRef}
              type="text"
              placeholder="Enter barcode manually..."
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleBarcode()}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleBarcode}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Add
            </button>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                No products found
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map(product => {
                  const outOfStock = product.stockStatus === 'out_of_stock'
                  // Resolve price for the card display: best available variant price
                  const displayPrice = (() => {
                    const firstAvailable = product.variants.find(v => v.quantity > 0) ?? product.variants[0]
                    if (!firstAvailable) return product.price
                    return resolveUnitPriceDirect(
                      product.price,
                      product.wholesalePrice,
                      firstAvailable.variantPrice,
                      firstAvailable.variantWholesalePrice,
                      isWholesale,
                    )
                  })()

                  return (
                    <button
                      key={product.productId}
                      onClick={() => !outOfStock && handleProductClick(product)}
                      disabled={outOfStock}
                      className={`flex items-center gap-3 p-3 border rounded-lg text-left transition hover:shadow-sm ${
                        outOfStock
                          ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                          : 'bg-white border-gray-200 hover:border-emerald-400 active:scale-[0.98]'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                            <Package2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-sm font-bold text-emerald-700">
                          KSh {displayPrice.toLocaleString()}
                        </p>
                      </div>

                      {/* Stock badge */}
                      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        outOfStock
                          ? 'bg-red-500'
                          : product.stockStatus === 'low_stock'
                          ? 'bg-yellow-500'
                          : 'bg-emerald-600'
                      }`}>
                        {product.totalQuantity > 99 ? '99+' : product.totalQuantity}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel (Cart) ──────────────────────────────────────────── */}
        <div className="w-80 flex flex-col bg-white">

          {/* Cart Header */}
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200">
            <div className="p-1.5 bg-emerald-100 rounded">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Cart ({cart.length})</h2>
            {isWholesale && (
              <span className="ml-auto text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Wholesale
              </span>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-5 py-3">
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-gray-400">
                Cart is empty
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 pb-3 border-b border-gray-100 last:border-0">
                    {/* Thumbnail */}
                    <div className="w-9 h-9 rounded bg-gray-100 overflow-hidden flex-shrink-0 mt-0.5">
                      {item.variantImageUrl ? (
                        <img src={item.variantImageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                      {item.size !== 'One Size' && (
                        <p className="text-xs text-gray-500">{item.size}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs font-bold text-emerald-700">
                          KSh {(item.resolvedPrice * item.quantity).toLocaleString()}
                        </p>
                        <span className="text-xs text-gray-400">
                          @ KSh {item.resolvedPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => updateQty(idx, -1)}
                        className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(idx, 1)}
                        className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          <div className="border-t border-gray-200 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">KSh {subtotal.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-sm gap-3">
              <span className="text-gray-600">Cart Discount:</span>
              <input
                type="number"
                placeholder="Discount"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-gray-900">Total:</span>
              <span className="text-lg font-bold text-emerald-600">KSh {total.toLocaleString()}</span>
            </div>

            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0}
              className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Sale
            </button>

            <button
              disabled={cart.length === 0}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock className="w-4 h-4" />
              Hold Sale
            </button>
          </div>
        </div>
      </div>

      {/* ── Variant Picker Modal ──────────────────────────────────────────── */}
      {pickerProduct && (
        <VariantPickerModal
          product={pickerProduct}
          isWholesale={isWholesale}
          preselectedVariantIndex={pickerPreVariantIndex}
          preselectedSize={pickerPreSize}
          onAdd={(variant, qty) => addVariantToCart(pickerProduct, variant, qty)}
          onClose={() => {
            setPickerProduct(null)
            setPickerPreVariantIndex(undefined)
            setPickerPreSize(undefined)
          }}
        />
      )}
    </>
  )
}
