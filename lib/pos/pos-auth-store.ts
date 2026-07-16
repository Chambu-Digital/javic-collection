import { create } from 'zustand'

export interface PosUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: 'customer' | 'admin' | 'super_admin'
  posRole: string
  permissions: string[]
}

interface PosAuthState {
  user: PosUser | null
  isLoaded: boolean
  isLoading: boolean

  // Checks the pos-token cookie via /api/pos/auth/me
  checkAuth: () => Promise<void>

  // Calls /api/pos/auth/login, stores user in memory
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>

  // Calls /api/pos/auth/logout, clears user from memory
  logout: () => Promise<void>
}

export const usePosAuthStore = create<PosAuthState>()((set) => ({
  user: null,
  isLoaded: false,
  isLoading: false,

  checkAuth: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/pos/auth/me')
      if (res.ok) {
        const { user } = await res.json()
        set({ user, isLoaded: true, isLoading: false })
      } else {
        set({ user: null, isLoaded: true, isLoading: false })
      }
    } catch {
      set({ user: null, isLoaded: true, isLoading: false })
    }
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/pos/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok) {
        set({ user: data.user, isLoaded: true, isLoading: false })
        return { success: true }
      }
      set({ isLoading: false })
      return { success: false, error: data.error || 'Login failed' }
    } catch {
      set({ isLoading: false })
      return { success: false, error: 'Network error. Check your connection.' }
    }
  },

  logout: async () => {
    try {
      await fetch('/api/pos/auth/logout', { method: 'POST' })
    } catch {
      // best-effort
    } finally {
      set({ user: null, isLoaded: true, isLoading: false })
    }
  },
}))
