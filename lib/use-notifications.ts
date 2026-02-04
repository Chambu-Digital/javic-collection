import { useState, useEffect } from 'react'
import { useUserStore } from '@/lib/user-store'

interface Notifications {
  requests: number
  orders: number
  products: number
  // customers: number // Commented out - not using customers
  reports: number
  // reviews: number // Commented out - not using reviews
}

export function useNotifications() {
  const { user, isLoaded } = useUserStore()
  const [notifications, setNotifications] = useState<Notifications>({
    requests: 0,
    orders: 0,
    products: 0,
    // customers: 0, // Commented out - not using customers
    reports: 0,
    // reviews: 0 // Commented out - not using reviews
  })
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    // Only fetch if user is loaded and is an admin
    if (!isLoaded || !user || !['admin', 'super_admin'].includes(user.role)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/notifications', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      } else if (response.status === 401) {
        console.log('Authentication required for notifications')
        // Don't log this as an error since it's expected for non-admin users
      } else {
        console.error('Failed to fetch notifications:', response.status)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only start fetching when user data is loaded
    if (!isLoaded) return
    
    fetchNotifications()
    
    // Only set up interval if user is admin
    if (user && ['admin', 'super_admin'].includes(user.role)) {
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user, isLoaded])

  return {
    notifications,
    loading,
    refresh: fetchNotifications
  }
}