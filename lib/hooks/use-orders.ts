'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Order {
  _id: string
  orderNumber: string
  customer: {
    name: string
    email: string
    phone: string
  }
  items: Array<{
    productId: string
    name: string
    price: number
    quantity: number
  }>
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed'
  shippingAddress: any
  createdAt: string
  updatedAt: string
}

export interface OrdersResponse {
  orders: Order[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface OrderFilters {
  status?: string
  paymentStatus?: string
  search?: string
  page?: number
  limit?: number
}

// API Functions
async function fetchOrders(filters: OrderFilters = {}): Promise<OrdersResponse> {
  const params = new URLSearchParams()
  
  if (filters.status) params.append('status', filters.status)
  if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus)
  if (filters.search) params.append('search', filters.search)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())

  const response = await fetch(`/api/orders?${params.toString()}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch orders')
  }
  
  return response.json()
}

async function fetchOrder(id: string): Promise<Order> {
  const response = await fetch(`/api/orders/${id}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch order')
  }
  
  return response.json()
}

async function trackOrder(orderNumber: string): Promise<Order> {
  const response = await fetch(`/api/orders/track?orderNumber=${orderNumber}`)
  
  if (!response.ok) {
    throw new Error('Failed to track order')
  }
  
  return response.json()
}

// Hooks

/**
 * Hook to fetch orders with filters
 * 
 * @example
 * const { data, isLoading } = useOrders({ status: 'pending', page: 1 })
 */
export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => fetchOrders(filters),
    staleTime: 60 * 1000, // 1 minute - orders change frequently
  })
}

/**
 * Hook to fetch a single order by ID
 * 
 * @example
 * const { data: order, isLoading } = useOrder(orderId)
 */
export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes for status updates
  })
}

/**
 * Hook to track an order by order number
 * 
 * @example
 * const { data: order } = useTrackOrder('ORD-12345')
 */
export function useTrackOrder(orderNumber: string | undefined) {
  return useQuery({
    queryKey: ['order', 'track', orderNumber],
    queryFn: () => trackOrder(orderNumber!),
    enabled: !!orderNumber,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh tracking info
  })
}

/**
 * Hook to create a new order
 * 
 * @example
 * const createOrder = useCreateOrder()
 * createOrder.mutate(orderData)
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create order')
      }
      
      return response.json()
    },
    onSuccess: () => {
      // Invalidate orders list to show the new order
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

/**
 * Hook to update order status
 * 
 * @example
 * const updateStatus = useUpdateOrderStatus()
 * updateStatus.mutate({ orderId: '123', status: 'shipped' })
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update order status')
      }
      
      return response.json()
    },
    onSuccess: (data, { orderId }) => {
      // Update the specific order in cache
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      // Update orders list
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
