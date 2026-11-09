'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Menu,
  X,
  LogOut,
  Store,
  Loader2,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  RefreshCw,
  MapPin,
  Mail,
  Lock,
  AlertCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/lib/user-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Login Form Component
function POSLoginForm() {
  const { login, logout } = useUserStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)

      if (!result.success) {
        throw new Error(result.error || 'Login failed')
      }

      const currentUser = useUserStore.getState().user
      
      if (!currentUser) {
        throw new Error('Login failed - no user data')
      }

      const hasAccess = currentUser.role === 'super_admin' || 
                       (currentUser.role === 'admin' && currentUser.canAccessPOS)

      if (!hasAccess) {
        await logout()
        setError('You do not have permission to access POS')
        setLoading(false)
        return
      }

      // Success - component will re-render with user
      
    } catch (err: any) {
      setError(err.message || 'Invalid credentials')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Javic POS</h1>
          <p className="text-gray-600">Point of Sale System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sign In</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="your.email@javic.co.ke"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              For assistance, contact your administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Access Denied Component
function POSAccessDenied({ user, logout }: { user: any, logout: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Your account ({user.email}) does not have permission to access the POS system.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Please contact your administrator to request POS access.
          </p>
          <button
            onClick={logout}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

interface Branch {
  _id: string
  name: string
  branchCode: string
  location?: string
  isActive: boolean
  isMainBranch?: boolean
}

const NAVIGATION_ITEMS = [
  {
    name: 'Make Sale',
    href: '/pos/make-sale',
    icon: ShoppingCart,
    enabled: true
  },
  {
    name: 'Inventory',
    href: '/pos/inventory',
    icon: Package,
    enabled: true
  },
  {
    name: 'Customers',
    href: '/pos/customers',
    icon: Users,
    enabled: true
  },
  {
    name: 'Reports',
    href: '/pos/reports',
    icon: BarChart3,
    enabled: false
  },
  {
    name: 'Sync Status',
    href: '/pos/sync',
    icon: RefreshCw,
    enabled: false
  }
]

export default function PosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, checkAuth, logout, isLoaded } = useUserStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [loadingBranches, setLoadingBranches] = useState(true)

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([])
  const [unseenCount, setUnseenCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Don't redirect, just show login UI if no access

  // Fetch and poll notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/pos/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnseenCount(data.unseenCount)
      }
    } catch (e) {
      console.error('Error fetching notifications:', e)
    }
  }

  useEffect(() => {
    const hasAccess = user?.role === 'super_admin' || (user?.role === 'admin' && user?.canAccessPOS)
    if (!user || !hasAccess) return

    fetchNotifications()

    // Poll every 30 seconds, pause when tab is hidden
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications()
      }
    }, 120000)

    return () => clearInterval(interval)
  }, [user])

  const markSeen = async (orderId: string) => {
    await fetch('/api/pos/notifications/mark-seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    })
    setNotifications(prev => prev.map(n => n.orderId === orderId ? { ...n, seen: true } : n))
    setUnseenCount(prev => Math.max(0, prev - 1))
  }

  const markAllSeen = async () => {
    await fetch('/api/pos/notifications/mark-seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true })
    })
    setNotifications(prev => prev.map(n => ({ ...n, seen: true })))
    setUnseenCount(0)
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  // Fetch branches
  useEffect(() => {
    const hasAccess = user?.role === 'super_admin' || (user?.role === 'admin' && user?.canAccessPOS)
    if (user && hasAccess) {
      fetchBranches()
    }
  }, [user])

  const handleBranchChange = (newBranchId: string) => {
    setSelectedBranchId(newBranchId)
    localStorage.setItem('pos-selected-branch', newBranchId)
  }

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true)
      const response = await fetch('/api/branches')
      if (response.ok) {
        const data = await response.json()
        setBranches(data.branches || [])
        
        if (data.branches && data.branches.length > 0) {
          const mainBranch = data.branches.find((b: Branch) => b.isMainBranch)
          const defaultBranchId = mainBranch?._id || data.branches[0]._id
          setSelectedBranchId(defaultBranchId)
          localStorage.setItem('pos-selected-branch', defaultBranchId)
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    } finally {
      setLoadingBranches(false)
    }
  }

  // Wait for auth to load
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-muted-foreground">Loading POS...</p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!user) {
    return <POSLoginForm />
  }

  const hasAccess = user.role === 'super_admin' || (user.role === 'admin' && user.canAccessPOS)
  
  // Show access denied if no POS permission
  if (!hasAccess) {
    return <POSAccessDenied user={user} logout={logout} />
  }

  const handleLogout = async () => {
    await logout()
    // No redirect needed - layout will show login form automatically
  }

  const selectedBranch = branches.find(b => b._id === selectedBranchId)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-600" />
              <h1 className="text-lg font-bold text-gray-900">POS</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Branch Selector - Mobile */}
          <div className="px-3 py-3 border-b border-gray-200">
            <Select value={selectedBranchId} onValueChange={handleBranchChange} disabled={loadingBranches}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select branch..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch._id} value={branch._id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{branch.name}</span>
                      {branch.location && (
                        <span className="text-xs text-muted-foreground">{branch.location}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.enabled ? item.href : '#'}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : item.enabled
                      ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={(e) => {
                    if (!item.enabled) {
                      e.preventDefault()
                      return
                    }
                    setSidebarOpen(false)
                  }}
                >
                  <item.icon className={`mr-3 h-5 w-5 shrink-0 ${isActive ? 'text-emerald-600' : ''}`} />
                  <span className="flex-1">{item.name}</span>
                  {!item.enabled && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Soon</span>
                  )}
                </Link>
              )
            })}
          </nav>
          
          {/* Mobile User Info & Logout */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <Store className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.role}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-200 ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}`}>
        <div className="flex flex-col grow bg-white border-r border-gray-200 pt-5 pb-2 overflow-y-auto">
          {/* Logo + Collapse toggle */}
          <div className={`flex items-center shrink-0 mb-4 ${sidebarCollapsed ? 'flex-col gap-2 px-2' : 'justify-between px-4'}`}>
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6 text-emerald-600 flex-shrink-0" />
              {!sidebarCollapsed && <h1 className="text-xl font-bold text-gray-900">POS System</h1>}
            </div>
            <button
              onClick={() => setSidebarCollapsed(v => !v)}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition flex-shrink-0"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed
                ? <ChevronRight className="h-5 w-5" />
                : <ChevronLeft className="h-5 w-5" />
              }
            </button>
          </div>

          {/* Branch Selector - Desktop (hidden when collapsed) */}
          {!sidebarCollapsed && (
            <div className="px-3 mb-4">
              <Select value={selectedBranchId} onValueChange={handleBranchChange} disabled={loadingBranches}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select branch..." />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch._id} value={branch._id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{branch.name}</span>
                        {branch.location && (
                          <span className="text-xs text-muted-foreground">{branch.location}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Branch icon when collapsed */}
          {sidebarCollapsed && (
            <div className="flex justify-center mb-4" title={selectedBranch?.name || 'Select branch'}>
              <MapPin className="h-5 w-5 text-emerald-600" />
            </div>
          )}

          <nav className="flex-1 flex flex-col overflow-y-auto">
            <div className={`space-y-1 ${sidebarCollapsed ? 'px-1' : 'px-2'}`}>
              {NAVIGATION_ITEMS.map((item) => {
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.name}
                    href={item.enabled ? item.href : '#'}
                    className={`group flex items-center rounded-md text-sm font-medium transition ${
                      sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : item.enabled
                        ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      if (!item.enabled) e.preventDefault()
                    }}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <item.icon className={`${sidebarCollapsed ? '' : 'mr-3'} h-5 w-5 shrink-0 ${isActive ? 'text-emerald-600' : ''}`} />
                    {!sidebarCollapsed && <span className="flex-1">{item.name}</span>}
                    {!sidebarCollapsed && !item.enabled && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Soon</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Desktop User Info */}
          <div className={`border-t border-gray-200 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            {sidebarCollapsed ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-9 w-9 bg-emerald-100 rounded-full flex items-center justify-center" title={`${user.firstName} ${user.lastName}`}>
                  <Store className="h-5 w-5 text-emerald-600" />
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Store className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.role}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-200 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-10 shrink-0 flex h-16 bg-white shadow">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden ml-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex items-center gap-3">
              <h2 className="text-xl font-bold leading-7 text-gray-900">
                JAVIC COLLECTION
              </h2>
              {selectedBranch && (
                <>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1.5 text-sm">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium text-gray-700">{selectedBranch.name}</span>
                  </div>
                </>
              )}
            </div>
            <div className="ml-4 flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-sm">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-gray-600">Online</span>
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(v => !v)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {unseenCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unseenCount > 99 ? '99+' : unseenCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {notifOpen && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-20" onClick={() => setNotifOpen(false)} />

                    {/* Panel */}
                    <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-30 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                          {unseenCount > 0 && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                              {unseenCount} new
                            </span>
                          )}
                        </div>
                        {unseenCount > 0 && (
                          <button
                            onClick={markAllSeen}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                            <Bell className="h-8 w-8 mb-2 opacity-30" />
                            <p className="text-sm">No notifications</p>
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <div
                              key={notif.orderId}
                              onClick={() => {
                                if (!notif.seen) markSeen(notif.orderId)
                                setNotifOpen(false)
                                router.push(`/pos/customers?orderId=${notif.orderId}`)
                              }}
                              className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${!notif.seen ? 'bg-emerald-50/50' : ''}`}
                            >
                              {/* Avatar */}
                              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-emerald-700">
                                {notif.customerName.charAt(0).toUpperCase()}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notif.customerName}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {notif.orderNumber} · KSh {notif.totalAmount.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {timeAgo(notif.createdAt)}
                                </p>
                              </div>

                              {/* Unread dot */}
                              {!notif.seen && (
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
