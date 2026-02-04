'use client'

import { useUserStore } from '@/lib/user-store'

// Client-side auth hook for components
export function useAuth() {
  const { user, isLoading, checkAuth } = useUserStore()
  
  // Since authentication is cookie-based, we don't need to return a token
  // The cookies are automatically sent with requests
  return {
    user,
    token: null, // Not needed for cookie-based auth
    isLoading,
    checkAuth
  }
}