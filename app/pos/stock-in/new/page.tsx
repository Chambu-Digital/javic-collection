'use client'

import { useState, useEffect, useRef } from 'react'
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
  Save,
  CheckCircle2,
} from 'lucide-react'

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

interface DraftLine {
  key: string
  productId: string
  productName: string
  variants: { url: string; sizes: string[] }[]
  imageIndex: number
  selectedSize?: string
  quantity: number
  unitCost: number
}

let lineKeyCounter = 0

export default function NewPurchasePage() {
  const router = useRouter()
  const [branchId, setBranchId] = useState('')
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [vendorsLoading, setVendorsLoading] = useState(true)

  // Purchase header
  const [vendorId, setVendorId] = useState('')
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentStatus, setPaymentStatus] = useState('unpaid')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')

  // Lines
  const [lines, setLines] = useState<DraftLine[]>([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('pos-selected-branch')
    if (saved) setBranchId(saved)
  }, [])

  // Fetch vendors for the branch
  useEffect(() => {
    if (!branchId) return
    setVendorsLoading(true)
    fetch(`/api/admin/vendors?branchId=${branchId}&activeOnly=true`)
      .then((r) => r.json())
      .then((data) => {
        setVendors(data.vendors || [])
        // Default to house-stock vendor if present
        const house = (data.vendors || []).find((v: Vendor) => v.isHouseStock)
        if (house) setVendorId(house._id)
      })
      .catch(console.error)
      .finally(() => setVendorsLoading(false))
  }, [branchId])

  // Debounced product search
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }
    setSearchLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(search)}&limit=10`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.products || [])
          setShowResults(true)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const addLine = (product: SearchProduct) => {
    const variants = (product.images || []).map((img) => ({
      url: img.url,
      sizes: img.sizes || product.sizes || [],
    }))
    const firstSizes = variants[0]?.sizes || []
    setLines((prev) => [
      ...prev,
      {
        key: `line-${lineKeyCounter++}`,
        productId: product._id,
        productName: product.name,
        variants,
        imageIndex: 0,
        selectedSize: firstSizes[0],
        quantity: 1,
        unitCost: product.buyingPrice || 0,
      },
    ])
    setSearch('')
    setShowResults(false)
  }

  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key))
  }

  const changeVariant = (key: string, imageIndex: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l
        const newSizes = l.variants[imageIndex]?.sizes || []
        const sizeStillValid = l.selectedSize ? newSizes.includes(l.selectedSize) : false
        return {
          ...l,
          imageIndex,
          selectedSize: sizeStillValid ? l.selectedSize : newSizes[0],
        }
      })
    )
  }

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0)
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

  const validate = (): string | null => {
    if (!branchId) return 'Select a branch first (top-left branch selector).'
    if (!vendorId) return 'Select a supplier.'
    if (lines.length === 0) return 'Add at least one product line.'
    for (const l of lines) {
      if (l.quantity < 1) return `Quantity must be at least 1 for ${l.productName}.`
      if (l.unitCost < 0) return `Buying price cannot be negative for ${l.productName}.`
      const sizes = l.variants[l.imageIndex]?.sizes || []
      if (sizes.length > 0 && !l.selectedSize) return `Select a size for ${l.productName}.`
    }
    return null
  }

  const submit = async (status: 'draft' | 'received') => {
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/pos/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          vendorId,
          supplierInvoiceNo,
          date,
          paymentStatus,
          paymentMethod,
          notes,
          status,
          lines: lines.map((l) => ({
            productId: l.productId,
            imageIndex: l.imageIndex,
            selectedSize: l.selectedSize,
            quantity: Number(l.quantity),
            unitCost: Number(l.unitCost),
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save purchase')
      router.push('/pos/stock-in')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/pos/stock-in')}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Purchase / Stock In</h1>
          <p className="text-sm text-gray-500">Record goods received from a supplier</p>
        </div>
      </div>

      {!branchId ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Select a receiving branch in the sidebar before creating a purchase.
          </p>
        </div>
      ) : (
        <>
          {/* Purchase information */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-semibold text-gray-700 mb-4">Purchase Information</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Supplier *</label>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    disabled={vendorsLoading}
                    className={inputClass}
                  >
                    <option value="">{vendorsLoading ? 'Loading suppliers…' : 'Select supplier'}</option>
                    {vendors.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name} {v.isHouseStock ? '(House Stock)' : ''}
                      </option>
                    ))}
                  </select>
                  {!vendorsLoading && vendors.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No suppliers assigned to this branch. Assign one in the admin Vendors area first.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Supplier Invoice No.</label>
                  <input
                    type="text"
                    value={supplierInvoiceNo}
                    onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                    placeholder="e.g. INV-2024-0456"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
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
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
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
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes"
                    className={inputClass}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product lines */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-semibold text-gray-700 mb-4">Products</p>

              {/* Product search */}
              <div className="relative" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    placeholder="Search products by name to add to this purchase…"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  {searchLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>

                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                    {searchResults.map((p) => (
                      <button
                        key={p._id}
                        onClick={() => addLine(p)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-50 transition text-left border-b border-gray-50 last:border-0"
                      >
                        <div className="w-9 h-9 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                          {p.images?.[0]?.url ? (
                            <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package2 className="w-4 h-4 text-gray-300 m-auto mt-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {p.sku ? `SKU: ${p.sku}` : ''} · Sell: KSh {p.price.toLocaleString()}
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
                {showResults && searchResults.length === 0 && !searchLoading && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-gray-500">
                    No products found. Create the product first via Create Item on the Inventory page.
                  </div>
                )}
              </div>

              {/* Lines list */}
              {lines.length === 0 ? (
                <div className="text-center py-10 mt-4 border border-dashed border-gray-200 rounded-xl">
                  <Package2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No products added yet. Search above to add products.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {lines.map((line) => {
                    const sizes = line.variants[line.imageIndex]?.sizes || []
                    return (
                      <div
                        key={line.key}
                        className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-lg p-3"
                      >
                        {/* Thumb */}
                        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                          {line.variants[line.imageIndex]?.url ? (
                            <img
                              src={line.variants[line.imageIndex].url}
                              alt={line.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package2 className="w-4 h-4 text-gray-300 m-auto mt-3" />
                          )}
                        </div>

                        {/* Name + variant + size */}
                        <div className="flex-1 min-w-[160px]">
                          <p className="text-sm font-medium text-gray-900 truncate">{line.productName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {line.variants.length > 1 && (
                              <select
                                value={line.imageIndex}
                                onChange={(e) => changeVariant(line.key, Number(e.target.value))}
                                className="px-2 py-1 border border-gray-300 rounded text-xs"
                              >
                                {line.variants.map((_, i) => (
                                  <option key={i} value={i}>
                                    Variant {i + 1}
                                  </option>
                                ))}
                              </select>
                            )}
                            {sizes.length > 0 && (
                              <select
                                value={line.selectedSize || ''}
                                onChange={(e) => updateLine(line.key, { selectedSize: e.target.value })}
                                className="px-2 py-1 border border-gray-300 rounded text-xs"
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

                        {/* Quantity */}
                        <div className="w-24">
                          <label className="block text-xs text-gray-400 mb-0.5">Qty</label>
                          <input
                            type="number"
                            min={1}
                            value={line.quantity}
                            onChange={(e) => updateLine(line.key, { quantity: Math.max(1, Number(e.target.value)) })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          />
                        </div>

                        {/* Unit cost */}
                        <div className="w-32">
                          <label className="block text-xs text-gray-400 mb-0.5">Buying Price</label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={line.unitCost}
                            onChange={(e) => updateLine(line.key, { unitCost: Math.max(0, Number(e.target.value)) })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          />
                        </div>

                        {/* Line total */}
                        <div className="text-right w-24">
                          <label className="block text-xs text-gray-400 mb-0.5">Total</label>
                          <p className="text-sm font-semibold text-gray-900">
                            KSh {(line.quantity * line.unitCost).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeLine(line.key)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Totals */}
              {lines.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <div className="w-64 space-y-1">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Subtotal</span>
                      <span>KSh {round2(subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                      <span>Purchase Total</span>
                      <span>KSh {round2(subtotal).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pb-6">
            <button
              onClick={() => submit('draft')}
              disabled={submitting}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button
              onClick={() => submit('received')}
              disabled={submitting}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {submitting ? 'Saving…' : 'Receive & Save'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
