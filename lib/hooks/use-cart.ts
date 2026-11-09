'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  sku?: string
}

export interface Cart {
  items: CartItem[]
  total: number
  itemCount: number
}

// API Functions (if you have a server-side cart)
async function fetchCart(): Promise<Cart> {
  const response = await fetch('/api/cart')
  
  if (!response.ok) {
    throw new Error('Failed to fetch cart')
  }
  
  return response.json()
}

async function addToCartAPI(item: { productId: string; quantity: number }) {
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  
  if (!response.ok) {
    throw new Error('Failed to add to cart')
  }
  
  return response.json()
}

async function updateCartItemAPI(productId: string, quantity: number) {
  const response = await fetch(`/api/cart/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to update cart')
  }
  
  return response.json()
}

async function removeFromCartAPI(productId: string) {
  const response = await fetch(`/api/cart/${productId}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    throw new Error('Failed to remove from cart')
  }
  
  return response.json()
}

async function clearCartAPI() {
  const response = await fetch('/api/cart', {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    throw new Error('Failed to clear cart')
  }
  
  return response.json()
}

// Hooks

/**
 * Hook to fetch cart data
 * Cart is fetched from server and cached
 * 
 * @example
 * const { data: cart, isLoading } = useCart()
 */
export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    staleTime: 30 * 1000, // 30 seconds - cart changes frequently
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })
}

/**
 * Hook to add item to cart with optimistic update
 * 
 * @example
 * const addToCart = useAddToCart()
 * addToCart.mutate({ productId: '123', quantity: 1 })
 */
export function useAddToCart() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: addToCartAPI,
    // Optimistic update
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      
      // Snapshot current cart
      const previousCart = queryClient.getQueryData<Cart>(['cart'])
      
      // Optimistically update cart
      if (previousCart) {
        const existingItem = previousCart.items.find(
          item => item.productId === newItem.productId
        )
        
        let updatedItems
        if (existingItem) {
          // Update quantity of existing item
          updatedItems = previousCart.items.map(item =>
            item.productId === newItem.productId
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item
          )
        } else {
          // Add new item (you'd fetch product details in real implementation)
          updatedItems = [...previousCart.items, { ...newItem, name: 'Loading...', price: 0 } as CartItem]
        }
        
        const newTotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
        
        queryClient.setQueryData<Cart>(['cart'], {
          items: updatedItems,
          total: newTotal,
          itemCount: newItemCount,
        })
      }
      
      return { previousCart }
    },
    // Rollback on error
    onError: (err, newItem, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart)
      }
    },
    // Always refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

/**
 * Hook to update cart item quantity
 * 
 * @example
 * const updateCart = useUpdateCartItem()
 * updateCart.mutate({ productId: '123', quantity: 3 })
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      updateCartItemAPI(productId, quantity),
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const previousCart = queryClient.getQueryData<Cart>(['cart'])
      
      if (previousCart) {
        const updatedItems = previousCart.items.map(item =>
          item.productId === productId ? { ...item, quantity } : item
        )
        
        const newTotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
        
        queryClient.setQueryData<Cart>(['cart'], {
          items: updatedItems,
          total: newTotal,
          itemCount: newItemCount,
        })
      }
      
      return { previousCart }
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

/**
 * Hook to remove item from cart
 * 
 * @example
 * const removeItem = useRemoveFromCart()
 * removeItem.mutate('product-id-123')
 */
export function useRemoveFromCart() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: removeFromCartAPI,
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const previousCart = queryClient.getQueryData<Cart>(['cart'])
      
      if (previousCart) {
        const updatedItems = previousCart.items.filter(item => item.productId !== productId)
        const newTotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
        
        queryClient.setQueryData<Cart>(['cart'], {
          items: updatedItems,
          total: newTotal,
          itemCount: newItemCount,
        })
      }
      
      return { previousCart }
    },
    onError: (err, productId, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

/**
 * Hook to clear entire cart
 * 
 * @example
 * const clearCart = useClearCart()
 * clearCart.mutate()
 */
export function useClearCart() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: clearCartAPI,
    onSuccess: () => {
      // Clear cart in cache
      queryClient.setQueryData<Cart>(['cart'], {
        items: [],
        total: 0,
        itemCount: 0,
      })
    },
  })
}

/**
 * Get cart item count (useful for badge displays)
 * Returns 0 if cart is loading or empty
 * 
 * @example
 * const itemCount = useCartItemCount()
 * <Badge>{itemCount}</Badge>
 */
export function useCartItemCount() {
  const { data } = useCart()
  return data?.itemCount || 0
}

/**
 * Get cart total
 * Returns 0 if cart is loading or empty
 * 
 * @example
 * const total = useCartTotal()
 * <div>Total: ${total}</div>
 */
export function useCartTotal() {
  const { data } = useCart()
  return data?.total || 0
}
