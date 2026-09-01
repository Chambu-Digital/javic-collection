import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  slug: string          // Product slug for navigation
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
  addItem: (item: Omit<CartItem, 'addedAt'>, maxStock?: number) => void
  removeItem: (index: number) => void
  updateQuantity: (index: number, quantity: number, maxStock?: number) => void
  clearCart: () => void
  setLoaded: () => void
  validateCartStock: () => Promise<number>
  
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

      addItem: (newItem, maxStock?) => {
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
          const existingItem = items[existingItemIndex]
          const newTotalQuantity = existingItem.quantity + newItem.quantity
          
          // Validate against stock if provided
          if (maxStock !== undefined && newTotalQuantity > maxStock) {
            throw new Error(`Only ${maxStock} items available in stock`)
          }
          
          set((state) => ({
            items: state.items.map((item, index) =>
              index === existingItemIndex
                ? { ...item, quantity: newTotalQuantity }
                : item
            ),
          }))
        } else {
          // Validate new item quantity
          if (maxStock !== undefined && newItem.quantity > maxStock) {
            throw new Error(`Only ${maxStock} items available in stock`)
          }
          
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

      updateQuantity: (index, quantity, maxStock?) => {
        if (quantity <= 0) {
          get().removeItem(index)
          return
        }

        // Validate against stock if provided
        if (maxStock !== undefined && quantity > maxStock) {
          throw new Error(`Only ${maxStock} items available in stock`)
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

      validateCartStock: async () => {
        const items = get().items
        const updates: { index: number; maxStock: number }[] = []
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          try {
            const response = await fetch(`/api/products/${item.slug}`)
            if (!response.ok) continue
            
            const { product } = await response.json()
            
            // Calculate available stock based on variant
            let availableStock = product.stockQuantity || 0
            
            // If product has multiple images/variants, check specific variant stock
            if (product.images && product.images.length > 0 && item.imageIndex !== undefined) {
              const variantImage = product.images[item.imageIndex]
              if (variantImage?.stock !== undefined) {
                availableStock = variantImage.stock
              }
            }
            
            if (item.quantity > availableStock) {
              updates.push({ index: i, maxStock: availableStock })
            }
          } catch (error) {
            console.error(`Failed to validate stock for ${item.name}:`, error)
          }
        }
        
        // Auto-adjust quantities
        updates.forEach(({ index, maxStock }) => {
          if (maxStock === 0) {
            get().removeItem(index)
          } else {
            get().updateQuantity(index, maxStock)
          }
        })
        
        return updates.length
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