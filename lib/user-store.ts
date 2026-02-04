import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Address {
  _id?: string
  type: 'shipping' | 'billing'
  name: string
  phone: string
  county: string
  area: string
  isDefault: boolean
}

export interface User {
  id: string
  _id?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: 'customer' | 'admin' | 'super_admin'
  isEmailVerified: boolean
  addresses?: Address[]
  permissions?: string[]
  profileImage?: string
  provider?: 'local' | 'google'
}

interface UserState {
  user: User | null
  isLoading: boolean
  isLoaded: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: (credential: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  refreshUser: () => Promise<void>
}

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isLoaded: false,
      
      setUser: (user) => set({ user, isLoaded: true }),
      setLoading: (isLoading) => set({ isLoading }),
      
      login: async (email, password) => {
        set({ isLoading: true })
        
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })
          
          const data = await response.json()
          
          if (response.ok) {
            set({ user: data.user, isLoading: false, isLoaded: true })
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, error: data.error || 'Login failed' }
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Network error' }
        }
      },
      
      loginWithGoogle: async (credential) => {
        set({ isLoading: true })
        
        try {
          const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ credential }),
          })
          
          const data = await response.json()
          
          if (response.ok) {
            set({ user: data.user, isLoading: false, isLoaded: true })
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, error: data.error || 'Google login failed' }
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Network error' }
        }
      },
      
      register: async (data) => {
        set({ isLoading: true })
        
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })
          
          const result = await response.json()
          
          if (response.ok) {
            set({ user: result.user, isLoading: false, isLoaded: true })
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, error: result.error || 'Registration failed' }
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Network error' }
        }
      },
      
      logout: async () => {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
          })
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({ user: null, isLoaded: true })
        }
      },
      
      checkAuth: async () => {
        if (get().isLoaded) return
        
        set({ isLoading: true })
        
        try {
          const response = await fetch('/api/auth/me')
          
          if (response.ok) {
            const data = await response.json()
            set({ user: data.user, isLoading: false, isLoaded: true })
          } else {
            set({ user: null, isLoading: false, isLoaded: true })
          }
        } catch (error) {
          set({ user: null, isLoading: false, isLoaded: true })
        }
      },
      
      refreshUser: async () => {
        try {
          const response = await fetch('/api/auth/me')
          
          if (response.ok) {
            const data = await response.json()
            set({ user: data.user })
          }
        } catch (error) {
          console.error('Error refreshing user data:', error)
        }
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user, isLoaded: state.isLoaded }),
    }
  )
)
// Make store globally accessible for cart store
if (typeof window !== 'undefined') {
  (window as any).__userStore = useUserStore
}