'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PosCartItem {
  id: string
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
  lineDiscountType?: 'percent' | 'fixed'
  lineDiscountValue?: number
  lineDiscountMinor: number
  lineSubtotalMinor: number
  lineTotalMinor: number
  pricingMode: 'retail' | 'wholesale'
  priceOverride?: number
  priceOverrideReason?: string
  addedBy?: string
  addedAt: string
  // Branch inventory tracking
  branchId: string
  branchCode: string
  branchStockId: string
  // Vendor tracking (NEW)
  vendorId: string
  vendorCode: string
}

export interface PosCustomer {
  id: string
  name: string
  phone?: string
  email?: string
  creditEnabled?: boolean
  availableCredit?: number
  outstandingBalance?: number
  creditLimit?: number
}

interface PosCartStore {
  items: PosCartItem[]
  pricingMode: 'retail' | 'wholesale'
  cartDiscountType?: 'percent' | 'fixed'
  cartDiscountValue?: number
  cartDiscountReason?: string
  customer: PosCustomer | null
  notes: string
  outletId: string | null
  deviceId: string | null
  currentBranchId: string | null  // NEW: Sticky branch context
  currentBranchCode: string | null  // NEW: Branch code for display

  setOutlet: (outletId: string) => void
  setDeviceId: (deviceId: string) => void
  setCurrentBranch: (branchId: string, branchCode: string) => void  // NEW
  setPricingMode: (mode: 'retail' | 'wholesale') => void
  addItem: (item: Omit<PosCartItem, 'addedAt' | 'lineDiscountMinor' | 'lineSubtotalMinor' | 'lineTotalMinor'>) => void
  updateItem: (index: number, updates: Partial<PosCartItem>) => void
  removeItem: (index: number) => void
  setCartDiscount: (type?: 'percent' | 'fixed', value?: number, reason?: string) => void
  setCustomer: (customer: PosCustomer | null) => void
  setNotes: (notes: string) => void
  clearCart: () => void
  loadHeldOrder: (data: {
    items: PosCartItem[]
    pricingMode: 'retail' | 'wholesale'
    cartDiscountType?: 'percent' | 'fixed'
    cartDiscountValue?: number
    cartDiscountReason?: string
    customer?: PosCustomer | null
    notes?: string
  }) => void

  getSubtotalMinor: () => number
  getTotalDiscountMinor: () => number
  getTotalMinor: () => number
  getItemCount: () => number
  getTotalQuantity: () => number
  isMultiBranchCart: () => boolean  // Now checks if items deviate from current branch
  isMultiVendorCart: () => boolean  // NEW: Check if multiple vendors in cart
}

function calcLineTotals(item: Omit<PosCartItem, 'lineDiscountMinor' | 'lineSubtotalMinor' | 'lineTotalMinor'>) {
  const unitMinor = Math.round((item.priceOverride ?? item.actualUnitPrice) * 100)
  let lineSubtotalMinor = unitMinor * item.quantity
  let lineDiscountMinor = 0

  if (item.lineDiscountType === 'percent' && item.lineDiscountValue) {
    lineDiscountMinor = Math.round(lineSubtotalMinor * (item.lineDiscountValue / 100))
  } else if (item.lineDiscountType === 'fixed' && item.lineDiscountValue) {
    lineDiscountMinor = Math.round(item.lineDiscountValue * 100)
  }

  const lineTotalMinor = Math.max(0, lineSubtotalMinor - lineDiscountMinor)
  return { lineDiscountMinor, lineSubtotalMinor, lineTotalMinor }
}

export const usePosCartStore = create<PosCartStore>()(
  persist(
    (set, get) => ({
      items: [],
      pricingMode: 'retail',
      customer: null,
      notes: '',
      outletId: null,
      deviceId: null,
      currentBranchId: null,
      currentBranchCode: null,

      setOutlet: (outletId) => set({ outletId }),
      setDeviceId: (deviceId) => set({ deviceId }),
      setCurrentBranch: (branchId, branchCode) => set({ currentBranchId: branchId, currentBranchCode: branchCode }),
      setPricingMode: (mode) =>
        set(state => ({
          pricingMode: mode,
          // Recalculate actualUnitPrice for every item when switching modes
          items: state.items.map(item => {
            const unitPrice =
              mode === 'wholesale' && item.wholesaleUnitPrice && item.wholesaleUnitPrice > 0
                ? item.wholesaleUnitPrice
                : item.retailUnitPrice
            const updated = { ...item, actualUnitPrice: unitPrice, pricingMode: mode }
            return { ...updated, ...calcLineTotals(updated) }
          }),
        })),

      addItem: (newItem) => {
        const totals = calcLineTotals(newItem)
        const item: PosCartItem = { ...newItem, ...totals, addedAt: new Date().toISOString() }
        const items = get().items
        const idx = items.findIndex(
          i =>
            i.productId === item.productId &&
            i.selectedImageIndex === item.selectedImageIndex &&
            i.selectedSize === item.selectedSize &&
            i.branchId === item.branchId &&
            i.vendorId === item.vendorId  // NEW: Also match vendor
        )
        if (idx >= 0) {
          const updated = { ...items[idx], quantity: items[idx].quantity + item.quantity }
          const newTotals = calcLineTotals(updated)
          set({
            items: items.map((it, i) => (i === idx ? { ...updated, ...newTotals } : it)),
          })
        } else {
          set({ items: [...items, item] })
        }
      },

      updateItem: (index, updates) => {
        set(state => ({
          items: state.items.map((item, i) => {
            if (i !== index) return item
            const merged = { ...item, ...updates }
            return { ...merged, ...calcLineTotals(merged) }
          }),
        }))
      },

      removeItem: (index) => set(state => ({ items: state.items.filter((_, i) => i !== index) })),

      setCartDiscount: (type, value, reason) =>
        set({ cartDiscountType: type, cartDiscountValue: value, cartDiscountReason: reason }),

      setCustomer: (customer) => set({ customer }),
      setNotes: (notes) => set({ notes }),

      clearCart: () =>
        set({
          items: [],
          customer: null,
          notes: '',
          cartDiscountType: undefined,
          cartDiscountValue: undefined,
          cartDiscountReason: undefined,
        }),

      loadHeldOrder: (data) =>
        set({
          items: data.items.map(item => ({
            ...item,
            // Ensure branch fields exist for backward compatibility
            branchId: item.branchId || '',
            branchCode: item.branchCode || '',
            branchStockId: item.branchStockId || '',
          })),
          pricingMode: data.pricingMode,
          cartDiscountType: data.cartDiscountType,
          cartDiscountValue: data.cartDiscountValue,
          cartDiscountReason: data.cartDiscountReason,
          customer: data.customer || null,
          notes: data.notes || '',
        }),

      getSubtotalMinor: () => get().items.reduce((s, i) => s + i.lineTotalMinor, 0),
      getTotalDiscountMinor: () => {
        const lineDisc = get().items.reduce((s, i) => s + i.lineDiscountMinor, 0)
        const sub = get().getSubtotalMinor()
        let cartDisc = 0
        const { cartDiscountType, cartDiscountValue } = get()
        
        // Only apply cart discount if not a multi-branch cart
        if (!get().isMultiBranchCart()) {
          if (cartDiscountType === 'percent' && cartDiscountValue) {
            cartDisc = Math.round(sub * (cartDiscountValue / 100))
          } else if (cartDiscountType === 'fixed' && cartDiscountValue) {
            cartDisc = Math.round(cartDiscountValue * 100)
          }
        }
        
        return lineDisc + Math.min(cartDisc, sub)
      },
      getTotalMinor: () => {
        const sub = get().getSubtotalMinor()
        const { cartDiscountType, cartDiscountValue } = get()
        let cartDisc = 0
        
        // Only apply cart discount if not a multi-branch cart
        if (!get().isMultiBranchCart()) {
          if (cartDiscountType === 'percent' && cartDiscountValue) {
            cartDisc = Math.round(sub * (cartDiscountValue / 100))
          } else if (cartDiscountType === 'fixed' && cartDiscountValue) {
            cartDisc = Math.round(cartDiscountValue * 100)
          }
        }
        
        return Math.max(0, sub - Math.min(cartDisc, sub))
      },
      getItemCount: () => get().items.length,
      getTotalQuantity: () => get().items.reduce((s, i) => s + i.quantity, 0),
      
      isMultiBranchCart: () => {
        const currentBranch = get().currentBranchId
        const items = get().items
        
        // If no current branch set, check if items have different branches
        if (!currentBranch) {
          const uniqueBranches = new Set(items.map(item => item.branchId))
          return uniqueBranches.size > 1
        }
        
        // Check if any item deviates from current branch
        return items.some(item => item.branchId !== currentBranch)
      },

      isMultiVendorCart: () => {
        const items = get().items
        const uniqueVendors = new Set(items.map(item => item.vendorId))
        return uniqueVendors.size > 1
      },
    }),
    { name: 'javic-pos-cart' }
  )
)
