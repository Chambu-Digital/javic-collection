// Permission constants
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  
  // Products
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  
  // Categories
  CATEGORIES_VIEW: 'categories.view',
  CATEGORIES_MANAGE: 'categories.manage',
  
  // Orders
  ORDERS_VIEW: 'orders.view',
  ORDERS_MANAGE: 'orders.manage',
  ORDERS_EXPORT: 'orders.export',
  
  // Customers
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_MANAGE: 'customers.manage',
  
  // Reviews
  REVIEWS_VIEW: 'reviews.view',
  REVIEWS_MODERATE: 'reviews.moderate',
  
  // Blog
  BLOG_VIEW: 'blog.view',
  BLOG_CREATE: 'blog.create',
  BLOG_EDIT: 'blog.edit',
  BLOG_DELETE: 'blog.delete',
  
  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  
  // Shipping
  SHIPPING_VIEW: 'shipping.view',
  SHIPPING_MANAGE: 'shipping.manage',
  
  // Admins (Super Admin only)
  ADMINS_VIEW: 'admins.view',
  ADMINS_CREATE: 'admins.create',
  ADMINS_MANAGE: 'admins.manage',
  
  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',
  
  // Requests (Super Admin only)
  REQUESTS_VIEW: 'requests.view',
  REQUESTS_MANAGE: 'requests.manage',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// Role-based permission sets
export const ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.CATEGORIES_MANAGE,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_MANAGE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.REVIEWS_VIEW,
    PERMISSIONS.REVIEWS_MODERATE,
    PERMISSIONS.BLOG_VIEW,
    PERMISSIONS.BLOG_CREATE,
    PERMISSIONS.BLOG_EDIT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.SHIPPING_VIEW,
    PERMISSIONS.SHIPPING_MANAGE,
    PERMISSIONS.SETTINGS_VIEW,
  ],
} as const

// Permission checking utilities
export interface User {
  _id?: string
  id?: string
  role: 'super_admin' | 'admin' | 'customer'
  permissions?: Permission[]
  firstName: string
  lastName: string
  email: string
}

export class PermissionChecker {
  private user: User
  private userPermissions: Set<Permission>

  constructor(user: User) {
    this.user = user
    this.userPermissions = new Set([
      // Role-based permissions
      ...(ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || []),
      // Custom permissions
      ...(user.permissions || [])
    ])
  }

  // Check if user has a specific permission
  hasPermission(permission: Permission): boolean {
    return this.userPermissions.has(permission)
  }

  // Check if user has any of the provided permissions (OR logic)
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission))
  }

  // Check if user has all of the provided permissions (AND logic)
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission))
  }

  // Get all user permissions
  getAllPermissions(): Permission[] {
    return Array.from(this.userPermissions)
  }

  // Check if user is super admin
  isSuperAdmin(): boolean {
    return this.user.role === 'super_admin'
  }

  // Check if user is admin or higher
  isAdmin(): boolean {
    return ['admin', 'super_admin'].includes(this.user.role)
  }
}

// Utility function to create permission checker
export function createPermissionChecker(user: User): PermissionChecker {
  return new PermissionChecker(user)
}

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  'Product Management': [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.CATEGORIES_MANAGE,
  ],
  'Order Management': [
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_MANAGE,
    PERMISSIONS.ORDERS_EXPORT,
  ],
  'Customer Management': [
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_MANAGE,
    PERMISSIONS.REVIEWS_VIEW,
    PERMISSIONS.REVIEWS_MODERATE,
  ],
  'Content Management': [
    PERMISSIONS.BLOG_VIEW,
    PERMISSIONS.BLOG_CREATE,
    PERMISSIONS.BLOG_EDIT,
    PERMISSIONS.BLOG_DELETE,
  ],
  'Analytics & Reports': [
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.DASHBOARD_VIEW,
  ],
  'System Management': [
    PERMISSIONS.SHIPPING_VIEW,
    PERMISSIONS.SHIPPING_MANAGE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_MANAGE,
  ],
  'Admin Management': [
    PERMISSIONS.ADMINS_VIEW,
    PERMISSIONS.ADMINS_CREATE,
    PERMISSIONS.ADMINS_MANAGE,
    PERMISSIONS.REQUESTS_VIEW,
    PERMISSIONS.REQUESTS_MANAGE,
  ],
} as const