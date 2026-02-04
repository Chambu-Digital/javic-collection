import { 
  LayoutDashboard, 
  Package, 
  FolderOpen, 
  Users, 
  ShoppingCart, 
  Settings,
  BarChart3,
  MessageSquare,
  FileText,
  Shield,
  Truck,
  Star,
  CreditCard,
  LucideIcon
} from 'lucide-react'
import { PERMISSIONS, Permission, PermissionChecker } from './permissions'

export interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  permissions: Permission[]
  notificationKey?: string | null
  requiresAll?: boolean // If true, requires ALL permissions; if false, requires ANY permission
  children?: NavigationItem[]
}

// Navigation configuration with permissions
export const NAVIGATION_CONFIG: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    permissions: [PERMISSIONS.DASHBOARD_VIEW],
    notificationKey: null,
  },
  {
    name: 'Categories',
    href: '/admin/categories',
    icon: FolderOpen,
    permissions: [PERMISSIONS.CATEGORIES_VIEW],
    notificationKey: null,
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: Package,
    permissions: [PERMISSIONS.PRODUCTS_VIEW],
    notificationKey: 'products',
  },
  // {
  //   name: 'Blog',
  //   href: '/admin/blog',
  //   icon: FileText,
  //   permissions: [PERMISSIONS.BLOG_VIEW],
  //   notificationKey: null,
  // },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
    permissions: [PERMISSIONS.ORDERS_VIEW],
    notificationKey: 'orders',
  },
  // {
  //   name: 'M-Pesa Transactions',
  //   href: '/admin/mpesa-transactions',
  //   icon: CreditCard,
  //   permissions: [PERMISSIONS.ORDERS_VIEW], // Use orders permission since it's related
  //   notificationKey: null,
  // },
  // {
  //   name: 'Reviews',
  //   href: '/admin/reviews',
  //   icon: Star,
  //   permissions: [PERMISSIONS.REVIEWS_VIEW],
  //   notificationKey: 'reviews',
  // },
  // {
  //   name: 'Shipping Areas',
  //   href: '/admin/shipping',
  //   icon: Truck,
  //   permissions: [PERMISSIONS.SHIPPING_VIEW],
  //   notificationKey: null,
  // },
  // {
  //   name: 'Customers',
  //   href: '/admin/customers',
  //   icon: Users,
  //   permissions: [PERMISSIONS.CUSTOMERS_VIEW],
  //   notificationKey: 'customers',
  // },
  {
    name: 'Admins',
    href: '/admin/admins',
    icon: Shield,
    permissions: [PERMISSIONS.ADMINS_VIEW],
    notificationKey: null,
  },
  // {
  //   name: 'Requests',
  //   href: '/admin/requests',
  //   icon: MessageSquare,
  //   permissions: [PERMISSIONS.REQUESTS_VIEW],
  //   notificationKey: 'requests',
  // },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    permissions: [PERMISSIONS.REPORTS_VIEW],
    notificationKey: 'reports',
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    permissions: [PERMISSIONS.SETTINGS_VIEW],
    notificationKey: null,
  },
]

// Utility to filter navigation items based on permissions
export function filterNavigationByPermissions(
  navigation: NavigationItem[],
  permissionChecker: PermissionChecker
): NavigationItem[] {
  return navigation
    .filter(item => {
      // Check if user has required permissions
      if (item.requiresAll) {
        return permissionChecker.hasAllPermissions(item.permissions)
      } else {
        return permissionChecker.hasAnyPermission(item.permissions)
      }
    })
    .map(item => {
      // If item has children, filter them recursively
      if (item.children) {
        const filteredChildren = filterNavigationByPermissions(item.children, permissionChecker)
        return {
          ...item,
          children: filteredChildren
        }
      }
      return item
    })
    .filter(item => {
      // Remove parent items that have no accessible children
      if (item.children) {
        return item.children.length > 0
      }
      return true
    })
}

// Utility to check if a specific route is accessible
export function isRouteAccessible(
  href: string,
  permissionChecker: PermissionChecker
): boolean {
  const findItemByHref = (items: NavigationItem[], targetHref: string): NavigationItem | null => {
    for (const item of items) {
      if (item.href === targetHref) {
        return item
      }
      if (item.children) {
        const found = findItemByHref(item.children, targetHref)
        if (found) return found
      }
    }
    return null
  }

  const item = findItemByHref(NAVIGATION_CONFIG, href)
  if (!item) return false

  if (item.requiresAll) {
    return permissionChecker.hasAllPermissions(item.permissions)
  } else {
    return permissionChecker.hasAnyPermission(item.permissions)
  }
}

// Get navigation item by href
export function getNavigationItem(href: string): NavigationItem | null {
  const findItemByHref = (items: NavigationItem[], targetHref: string): NavigationItem | null => {
    for (const item of items) {
      if (item.href === targetHref) {
        return item
      }
      if (item.children) {
        const found = findItemByHref(item.children, targetHref)
        if (found) return found
      }
    }
    return null
  }

  return findItemByHref(NAVIGATION_CONFIG, href)
}