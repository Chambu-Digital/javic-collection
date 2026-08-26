'use client'

import { Wifi, WifiOff, RefreshCw, Bell, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PosHeaderProps {
  cashierName: string
  cashierRole: string
  outletName: string
  status: 'online' | 'offline' | 'syncing'
  lastSync?: string | null
  onMenuOpen: () => void
  onLogout: () => void
}

export default function PosHeader({
  cashierName,
  cashierRole,
  outletName,
  status,
  lastSync,
  onMenuOpen,
  onLogout,
}: PosHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuOpen}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate">Welcome to Javic Collection</h1>
            <p className="text-xs text-muted-foreground truncate">
              {outletName} · {cashierName} · {cashierRole}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ConnectivityBadge status={status} lastSync={lastSync} />
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onLogout} className="hidden sm:flex">
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}

function ConnectivityBadge({
  status,
  lastSync,
}: {
  status: 'online' | 'offline' | 'syncing'
  lastSync?: string | null
}) {
  const config = {
    online: { icon: Wifi, label: 'Online', className: 'text-green-600 bg-green-50 border-green-200' },
    offline: { icon: WifiOff, label: 'Offline', className: 'text-amber-600 bg-amber-50 border-amber-200' },
    syncing: { icon: RefreshCw, label: 'Syncing', className: 'text-blue-600 bg-blue-50 border-blue-200' },
  }[status]

  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium',
        config.className
      )}
      title={lastSync ? `Last sync: ${new Date(lastSync).toLocaleString()}` : undefined}
    >
      <Icon className={cn('h-3.5 w-3.5', status === 'syncing' && 'animate-spin')} />
      <span className="hidden sm:inline">{config.label}</span>
    </div>
  )
}
