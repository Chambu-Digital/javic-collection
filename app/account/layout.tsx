'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Package, 
  Settings, 
  LogOut, 
  Home,
  Leaf,
  Menu,
  X,
  Star
} from 'lucide-react'
import { useUserStore } from '@/lib/user-store'
import { Loader2 } from 'lucide-react'

const publicPaths = ['/account/login', '/account/register', '/account/forgot-password']

const navigationItems = [
  {
    href: '/account',
    label: 'Dashboard',
    icon: Home,
    exact: true
  },
  {
    href: '/account/orders',
    label: 'Orders',
    icon: Package
  },
  // {
  //   href: '/account/reviews',
  //   label: 'My Reviews',
  //   icon: Star
  // },
  {
    href: '/account/profile',
    label: 'Profile & Settings',
    icon: Settings
  }
]

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, checkAuth, logout, isLoading, isLoaded } = useUserStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isPublicPath = publicPaths.includes(pathname)

  useEffect(() => {
    if (!isLoaded) {
      checkAuth()
    }
  }, [checkAuth, isLoaded])

  useEffect(() => {
    if (isLoaded && !user && !isPublicPath) {
      router.push('/account/login')
    }
  }, [user, isLoaded, isPublicPath, router])

  const handleLogout = async () => {
    await logout()
    router.push('/account/login')
  }

  // Show loading for protected routes
  if (!isLoaded && !isPublicPath) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show public pages (login, register) without layout
  if (isPublicPath) {
    return children
  }

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">Electromatt</span>
            </Link>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>

            {/* Desktop user info */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-8 w-8 p-2 bg-gray-100 rounded-full" />
                {user.role === 'admin' && (
                  <Badge variant="secondary" className="text-xs">Admin</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className={`md:w-64 ${sidebarOpen ? 'block' : 'hidden md:block'}`}>
            <Card className="p-6">
              {/* Mobile user info */}
              <div className="md:hidden mb-6 pb-6 border-b">
                <div className="flex items-center gap-3">
                  <User className="h-10 w-10 p-2 bg-gray-100 rounded-full" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {user.role === 'admin' && (
                      <Badge variant="secondary" className="text-xs mt-1">Admin</Badge>
                    )}
                  </div>
                </div>
              </div>

              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = item.exact 
                    ? pathname === item.href 
                    : pathname.startsWith(item.href)
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <Separator className="my-6" />

              <div className="space-y-2">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  Back to Store
                </Link>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </Card>
          </div>

          {/* Main content */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}