'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PosSidebar from '@/components/pos/pos-sidebar'
import PosHeader from '@/components/pos/pos-header'
import { usePosAuthStore } from '@/lib/pos/pos-auth-store'
import { POS_NAVIGATION } from '@/lib/pos/navigation'

// Rendered only on the client (imported via dynamic with ssr:false in layout.tsx).
// Uses the independent POS auth store — zero coupling to useUserStore or the
// main website's auth-token cookie.
export default function PosShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoaded, logout, checkAuth } = usePosAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false) // starts closed; opens on desktop after mount

  useEffect(() => {
    // Open sidebar by default on desktop (≥1024px), keep closed on mobile
    const openOnDesktop = () => setSidebarOpen(window.innerWidth >= 1024)
    openOnDesktop()
    window.addEventListener('resize', openOnDesktop)
    return () => window.removeEventListener('resize', openOnDesktop)
  }, [])

  // Validate the pos-token cookie on every shell mount
  useEffect(() => {
    checkAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect to POS login when there's no valid session
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/pos-login')
    }
  }, [isLoaded, user, router])

  const handleLogout = async () => {
    await logout()
    router.push('/pos-login')
  }

  // Validating session
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
      </div>
    )
  }

  // Session invalid — redirect is in flight
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <PosSidebar
        navigation={POS_NAVIGATION}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/*
        On desktop the sidebar is `static` (in flow) so NO margin-left is needed —
        the sidebar already occupies its 256 px column.
        On mobile the sidebar is `fixed` (out of flow) so we also need no margin —
        the content fills the full width and the sidebar overlays it.
        The old `lg:ml-64` was doubling the space on desktop.
      */}
      <div className="flex-1 flex flex-col min-w-0">
        <PosHeader
          cashierName={`${user.firstName} ${user.lastName}`.trim() || user.email?.split('@')[0] || 'Cashier'}
          cashierRole={user.posRole || user.role}
          outletName="Marikiti Shop — Biashara Street, Mombasa"
          status="online"
          onMenuOpen={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-auto min-w-0">{children}</main>
      </div>
    </div>
  )
}
