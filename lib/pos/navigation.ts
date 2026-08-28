import {
  ShoppingCart,
  Users,
  BarChart3,
  RefreshCw,
  Settings,
  Package,
} from 'lucide-react'
import { POS_PERMISSIONS, PosPermission } from '@/lib/pos/permissions'
import { PosPermissionChecker } from '@/lib/pos/permissions'

export interface PosNavItem {
  name: string
  href: string
  icon: typeof ShoppingCart
  permission?: PosPermission
}

export const POS_NAVIGATION: PosNavItem[] = [
  { name: 'Make Sale',       href: '/pos/make-sale',  icon: ShoppingCart, permission: POS_PERMISSIONS.SALE },
  { name: 'Stock',           href: '/pos/stock',      icon: Package,      permission: POS_PERMISSIONS.INVENTORY_VIEW },
  { name: 'Customers',       href: '/pos/customers',  icon: Users,        permission: POS_PERMISSIONS.CUSTOMERS_VIEW },
  { name: 'Reports & Ledger',href: '/pos/reports',    icon: BarChart3,    permission: POS_PERMISSIONS.REPORTS_OWN },
  { name: 'Sync Status',     href: '/pos/sync-status',icon: RefreshCw },
  { name: 'POS Settings',    href: '/pos/settings',   icon: Settings,     permission: POS_PERMISSIONS.SETTINGS },
]

export function filterPosNavigation(checker: PosPermissionChecker): PosNavItem[] {
  return POS_NAVIGATION.filter(item => {
    if (!item.permission) return true
    return checker.hasPosPermission(item.permission)
  })
}
