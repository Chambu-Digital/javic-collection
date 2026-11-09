'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Types
export interface Product {
  _id: string
  name: string
  description?: string
  price: number
  comparePrice?: number
  category: string
  images: string[]
  stock: number
  sku?: string
  featured?: boolean
  slug?: string
  // ... add other product fields as needed
}

export interface ProductsResponse {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProductFilters {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  featured?: boolean
  page?: number
  limit?: number
  sort?: string
}

// API Functions
async function fetchProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
  const params = new URLSearchParams()
  
  if (filters.category) params.append('category', filters.category)
  if (filters.search) params.append('search', filters.search)
  if (filters.minPrice) params.append('minPrice', filters.minPrice.toString())
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
  if (filters.featured) params.append('featured', 'true')
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  if (filters.sort) params.append('sort', filters.sort)

  const response = await fetch(`/api/products?${params.toString()}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch products')
  }
  
  return response.json()
}

async function fetchProduct(id: string): Promise<Product> {
  const response = await fetch(`/api/products/${id}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch product')
  }
  
  return response.json()
}

async function fetchProductBySlug(slug: string): Promise<Product> {
  const response = await fetch(`/api/products/slug/${slug}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch product')
  }
  
  return response.json()
}

// Hooks

/**
 * Hook to fetch multiple products with filters
 * Automatically caches and deduplicates requests
 * 
 * @example
 * const { data, isLoading, error } = useProducts({ category: 'lingerie', page: 1 })
 */
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes - products don't change that often
  })
}

/**
 * Hook to fetch a single product by ID
 * 
 * @example
 * const { data: product, isLoading } = useProduct(productId)
 */
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id!),
    enabled: !!id, // Only run query if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes - individual products are stable
  })
}

/**
 * Hook to fetch a single product by slug
 * 
 * @example
 * const { data: product, isLoading } = useProductBySlug('luxury-bra-set')
 */
export function useProductBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['product', 'slug', slug],
    queryFn: () => fetchProductBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch featured products
 * 
 * @example
 * const { data, isLoading } = useFeaturedProducts({ limit: 8 })
 */
export function useFeaturedProducts(options: { limit?: number } = {}) {
  return useQuery({
    queryKey: ['products', 'featured', options.limit],
    queryFn: () => fetchProducts({ featured: true, limit: options.limit || 8 }),
    staleTime: 10 * 60 * 1000, // 10 minutes - featured products are stable
  })
}

/**
 * Mutation hook for updating product stock (optimistic updates)
 * 
 * @example
 * const updateStock = useUpdateProductStock()
 * updateStock.mutate({ productId: '123', quantity: -1 })
 */
export function useUpdateProductStock() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const response = await fetch(`/api/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update stock')
      }
      
      return response.json()
    },
    // Optimistically update the cache
    onMutate: async ({ productId, quantity }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['product', productId] })
      
      // Snapshot the previous value
      const previousProduct = queryClient.getQueryData(['product', productId])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['product', productId], (old: any) => ({
        ...old,
        stock: old.stock + quantity,
      }))
      
      return { previousProduct }
    },
    // If the mutation fails, rollback
    onError: (err, { productId }, context) => {
      queryClient.setQueryData(['product', productId], context?.previousProduct)
    },
    // Always refetch after error or success
    onSettled: (data, error, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
