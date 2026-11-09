'use client'

import { useQuery } from '@tanstack/react-query'

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  parent?: string
  order?: number
  active?: boolean
}

// API Functions
async function fetchCategories(): Promise<Category[]> {
  const response = await fetch('/api/categories')
  
  if (!response.ok) {
    throw new Error('Failed to fetch categories')
  }
  
  return response.json()
}

async function fetchCategory(id: string): Promise<Category> {
  const response = await fetch(`/api/categories/${id}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch category')
  }
  
  return response.json()
}

// Hooks

/**
 * Hook to fetch all categories
 * Categories are heavily cached as they rarely change
 * 
 * @example
 * const { data: categories, isLoading } = useCategories()
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  })
}

/**
 * Hook to fetch a single category by ID
 * 
 * @example
 * const { data: category } = useCategory(categoryId)
 */
export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => fetchCategory(id!),
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
  })
}
