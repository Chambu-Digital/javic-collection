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

  setOutlet: (outletId: string) => void
  setDeviceId: (deviceId: string) => void
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

      setOutlet: (outletId) => set({ outletId }),
      setDeviceId: (deviceId) => set({ deviceId }),
      setPricingMode: (mode) => set({ pricingMode: mode }),

      addItem: (newItem) => {
        const totals = calcLineTotals(newItem)
        const item: PosCartItem = { ...newItem, ...totals, addedAt: new Date().toISOString() }
        const items = get().items
        const idx = items.findIndex(
          i =>
            i.productId === item.productId &&
            i.selectedImageIndex === item.selectedImageIndex &&
            i.selectedSize === item.selectedSize
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
          items: data.items,
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
        if (cartDiscountType === 'percent' && cartDiscountValue) {
          cartDisc = Math.round(sub * (cartDiscountValue / 100))
        } else if (cartDiscountType === 'fixed' && cartDiscountValue) {
          cartDisc = Math.round(cartDiscountValue * 100)
        }
        return lineDisc + Math.min(cartDisc, sub)
      },
      getTotalMinor: () => {
        const sub = get().getSubtotalMinor()
        const { cartDiscountType, cartDiscountValue } = get()
        let cartDisc = 0
        if (cartDiscountType === 'percent' && cartDiscountValue) {
          cartDisc = Math.round(sub * (cartDiscountValue / 100))
        } else if (cartDiscountType === 'fixed' && cartDiscountValue) {
          cartDisc = Math.round(cartDiscountValue * 100)
        }
        return Math.max(0, sub - Math.min(cartDisc, sub))
      },
      getItemCount: () => get().items.length,
      getTotalQuantity: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'javic-pos-cart' }
  )
)
