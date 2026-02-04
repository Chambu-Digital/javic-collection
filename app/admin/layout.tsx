'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Menu,
  X,
  LogOut,
  Shield,
  Loader2,
  Home
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/lib/user-store'
import { useNotifications } from '@/lib/use-notifications'
import { usePermissions } from '@/lib/use-permissions'
import { NAVIGATION_CONFIG, filterNavigationByPermissions, getNavigationItem } from '@/lib/admin-navigation'
import NotificationBadge from '@/components/admin/notification-badge'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, checkAuth, logout, isLoaded } = useUserStore()
  const { notifications } = useNotifications()
  const permissionChecker = usePermissions()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Filter navigation based on user permissions
  const navigation = permissionChecker 
    ? filterNavigationByPermissions(NAVIGATION_CONFIG, permissionChecker)
    : []

  // Skip auth check for login and register pages
  const isPublicPage = pathname === '/admin/login' || pathname === '/admin/register'

  useEffect(() => {
    if (!isLoaded) {
      checkAuth()
    }
  }, [checkAuth, isLoaded])

  useEffect(() => {
    if (isLoaded && !isPublicPage) {
      if (!user) {
        // Not logged in, redirect to admin login
        router.push('/admin/login')
      } else if (!['admin', 'super_admin'].includes(user.role)) {
        // Logged in but not admin/super_admin, redirect to admin login with error
        router.push('/admin/login')
      }
    }
  }, [user, isLoaded, isPublicPage, router])

  // Show loading for protected routes
  if (!isLoaded && !isPublicPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show public pages without layout
  if (isPublicPage) {
    return children
  }

  // Show loading if user is not loaded yet or not admin/super_admin
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const notificationCount = item.notificationKey ? notifications[item.notificationKey as keyof typeof notifications] : 0
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-6 w-6 shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {item.notificationKey && (
                    (item.notificationKey === 'requests' && user?.role === 'super_admin') ||
                    (item.notificationKey !== 'requests')
                  ) && (
                    <NotificationBadge count={notificationCount} />
                  )}
                </Link>
              )
            })}
          </nav>
          
          {/* Mobile Admin Info & Logout */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link href="/" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Home className="h-4 w-4 mr-2" />
                  View Site
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center shrink-0 px-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <nav className="mt-5 flex-1 flex flex-col divide-y divide-gray-200 overflow-y-auto">
            <div className="px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const notificationCount = item.notificationKey ? notifications[item.notificationKey as keyof typeof notifications] : 0
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="mr-3 h-6 w-6 shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {item.notificationKey && user?.role === 'super_admin' && (
                      <NotificationBadge count={notificationCount} />
                    )}
                    {item.notificationKey && item.notificationKey !== 'requests' && (
                      <NotificationBadge count={notificationCount} />
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 shrink-0 flex h-16 bg-white shadow">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate">
                {getNavigationItem(pathname)?.name || 'Admin'}
              </h2>
            </div>
            <div className="ml-4 flex items-center md:ml-6 gap-4">
              {/* Admin User Info */}
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-slate-600" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  View Site
                </Button>
              </Link>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
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