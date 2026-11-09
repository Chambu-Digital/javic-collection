'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { getQueryClient } from '@/lib/query-client'
import { ReactNode } from 'react'

/**
 * TanStack Query Provider
 * Wraps the app to enable React Query functionality
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  // NOTE: Don't use useState for the queryClient, that would create a new client on every render
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools - only shows in development */}
      <ReactQueryDevtools 
        initialIsOpen={false} 
        position="bottom-right"
        buttonPosition="bottom-right"
      />
    </QueryClientProvider>
  )
}
