'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PosSidebar from '@/components/pos/pos-sidebar'
import PosHeader from '@/components/pos/pos-header'
import { usePosAuthStore } from '@/lib/pos/pos-auth-store'
import { usePosCartStore } from '@/lib/pos/cart-store'
import { POS_NAVIGATION } from '@/lib/pos/navigation'

interface Branch {
  _id: string
  name: string
  branchCode: string
  isMainBranch?: boolean
  isActive: boolean
}

// Rendered only on the client (imported via dynamic with ssr:false in layout.tsx).
// Uses the independent POS auth store — zero coupling to useUserStore or the
// main website's auth-token cookie.
export default function PosShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoaded, logout, checkAuth } = usePosAuthStore()
  const { items, clearCart, setCurrentBranch } = usePosCartStore()
  const [sidebarOpen, setSidebarOpen] = useState(false) // starts closed; opens on desktop after mount
  
  // Branch management state
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [loadingBranches, setLoadingBranches] = useState(false)

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

  // Load branches
  useEffect(() => {
    const loadBranches = async () => {
      setLoadingBranches(true)
      try {
        const response = await fetch('/api/pos/branches')
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load branches')
        }
        
        setBranches(data.branches || [])
        
        // Auto-select main branch or first branch
        if (data.branches && data.branches.length > 0) {
          const mainBranch = data.branches.find((b: Branch) => b.isMainBranch)
          const branchToSelect = mainBranch || data.branches[0]
          
          // DEBUG: Log branch selection
          console.log('[POS Shell Branch Selected]', {
            branchId: branchToSelect._id,
            branchName: branchToSelect.name,
            branchCode: branchToSelect.branchCode,
            branchIdType: typeof branchToSelect._id
          })
          
          setSelectedBranchId(branchToSelect._id)
          setCurrentBranch(branchToSelect._id, branchToSelect.branchCode)
        }
      } catch (error) {
        console.error('Failed to load branches:', error)
        setBranches([])
      } finally {
        setLoadingBranches(false)
      }
    }
    
    if (user) {
      loadBranches()
    }
  }, [user, setCurrentBranch])

  // Handle branch change
  const handleBranchChange = (branchId: string) => {
    const branch = branches.find(b => b._id === branchId)
    if (!branch) return
    
    // Warn if cart has items
    if (items.length > 0) {
      const confirm = window.confirm(
        'Changing branch will clear the current cart. Continue?'
      )
      if (!confirm) return
      clearCart()
    }
    
    setSelectedBranchId(branch._id)
    setCurrentBranch(branch._id, branch.branchCode)
  }

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
        branches={branches}
        selectedBranchId={selectedBranchId}
        onBranchChange={handleBranchChange}
        loadingBranches={loadingBranches}
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
