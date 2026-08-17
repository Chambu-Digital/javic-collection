import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  wholesalePrice?: number
  wholesaleThreshold?: number
  image: string          // thumbnail shown in cart (first image or selected image)
  quantity: number
  selectedSize?: string  // size the buyer picked
  selectedImage?: string // image the buyer picked from the carousel (URL)
  imageIndex: number    // index of the selected image in product.images array
  sku?: string          // variant SKU if available
  groupId?: string      // for grouping logic (same variant, different angle)
  branchId?: string     // branch this product belongs to
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
        const items = get().items
        
        // Primary match: same product + same imageIndex + same size
        let existingItemIndex = items.findIndex(
          (item) =>
            item.id === newItem.id &&
            item.imageIndex === newItem.imageIndex &&
            item.selectedSize === newItem.selectedSize
        )

        // Secondary match: same product + same groupId + same size (same variant, different angle)
        if (existingItemIndex === -1 && newItem.groupId) {
          existingItemIndex = items.findIndex(
            (item) =>
              item.id === newItem.id &&
              item.groupId === newItem.groupId &&
              item.selectedSize === newItem.selectedSize
          )
        }

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
          isWholesale: !!isWholesale,
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