import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  wholesalePrice?: number
  wholesaleThreshold?: number
  image: string
  quantity: number
  selectedSize?: string
  selectedScent?: string
  variantId?: string
  addedAt: string
}

interface CartStore {
  items: CartItem[]
  isLoaded: boolean
  
  // Actions
  addItem: (item: Omit<CartItem, 'addedAt'>) => void
  removeItem: (index: number) => void
  updateQuantity: (index: number, quantity: number) => void
  clearCart: () => void
  setLoaded: () => void
  
  // Computed values
  getTotalItems: () => number
  getTotalPrice: () => number
  getItemCount: () => number
  getItemPricing: (item: CartItem) => {
    unitPrice: number
    totalPrice: number
    savings: number
    isWholesale: boolean
    hasWholesale: boolean
    wholesaleThreshold: number
  }
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoaded: false,

      addItem: (newItem) => {
        // Check if user is logged in
        const userStore = (window as any).__userStore
        if (!userStore?.getState?.()?.user) {
          // Redirect to login with return URL
          const currentPath = window.location.pathname
          window.location.href = `/account/login?returnTo=${encodeURIComponent(currentPath)}`
          return
        }

        const items = get().items
        const existingItemIndex = items.findIndex(
          (item) =>
            item.id === newItem.id &&
            item.selectedSize === newItem.selectedSize &&
            item.selectedScent === newItem.selectedScent
        )

        if (existingItemIndex > -1) {
          // Update quantity if item exists
          set((state) => ({
            items: state.items.map((item, index) =>
              index === existingItemIndex
                ? { ...item, quantity: item.quantity + newItem.quantity }
                : item
            ),
          }))
        } else {
          // Add new item
          set((state) => ({
            items: [
              ...state.items,
              {
                ...newItem,
                addedAt: new Date().toISOString(),
              },
            ],
          }))
        }
      },

      removeItem: (index) => {
        set((state) => ({
          items: state.items.filter((_, i) => i !== index),
        }))
      },

      updateQuantity: (index, quantity) => {
        if (quantity <= 0) {
          get().removeItem(index)
          return
        }

        set((state) => ({
          items: state.items.map((item, i) =>
            i === index ? { ...item, quantity } : item
          ),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      setLoaded: () => {
        set({ isLoaded: true })
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const hasWholesale = item.wholesalePrice && item.wholesaleThreshold
          const isWholesale = hasWholesale && item.quantity >= item.wholesaleThreshold!
          const unitPrice = isWholesale ? item.wholesalePrice! : item.price
          return total + unitPrice * item.quantity
        }, 0)
      },

      getItemCount: () => {
        return get().items.length
      },

      getItemPricing: (item: CartItem) => {
        const hasWholesale = item.wholesalePrice && item.wholesaleThreshold
        const isWholesale = hasWholesale && item.quantity >= item.wholesaleThreshold!
        const unitPrice = isWholesale ? item.wholesalePrice! : item.price
        const totalPrice = unitPrice * item.quantity
        const retailTotal = item.price * item.quantity
        const savings = isWholesale ? retailTotal - totalPrice : 0
        
        return {
          unitPrice,
          totalPrice,
          savings,
          isWholesale,
          hasWholesale: !!hasWholesale,
          wholesaleThreshold: item.wholesaleThreshold || 0
        }
      },
    }),
    {
      name: 'cart-storage',
      onRehydrateStorage: () => (state) => {
        state?.setLoaded()
      },
    }
  )
)