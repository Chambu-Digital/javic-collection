'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { PosNavItem } from '@/lib/pos/navigation'
import { Button } from '@/components/ui/button'
import { X, Menu, LogOut, Building2 } from 'lucide-react'

interface Branch {
  _id: string
  name: string
  branchCode: string
}

interface PosSidebarProps {
  navigation: PosNavItem[]
  open: boolean
  onClose: () => void
  onLogout: () => void
  branches: Branch[]
  selectedBranchId: string
  onBranchChange: (branchId: string) => void
  loadingBranches?: boolean
}

export default function PosSidebar({ 
  navigation, 
  open, 
  onClose, 
  onLogout,
  branches,
  selectedBranchId,
  onBranchChange,
  loadingBranches = false
}: PosSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <Link href="/pos/make-sale" className="flex items-center gap-2">
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-white flex items-center justify-center">
              <img 
                src="/javic-logo1.png" 
                alt="Javic" 
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
            <span className="font-display font-bold text-primary text-lg">Javic POS</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Branch Selector */}
        <div className="p-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-primary" />
            <label className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wide">
              Current Branch
            </label>
          </div>
          <select
            value={selectedBranchId}
            onChange={(e) => onBranchChange(e.target.value)}
            disabled={loadingBranches || branches.length === 0}
            className={cn(
              "w-full px-3 py-2 text-sm font-medium rounded-lg border transition-colors",
              "bg-background text-foreground",
              "border-input hover:border-primary/50",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {branches.length === 0 && (
              <option value="">{loadingBranches ? 'Loading...' : 'No branches available'}</option>
            )}
            {branches.map(branch => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
          {selectedBranchId && branches.length > 0 && (
            <p className="text-xs text-sidebar-foreground/60 mt-1.5">
              {branches.find(b => b._id === selectedBranchId)?.branchCode || ''}
            </p>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}

