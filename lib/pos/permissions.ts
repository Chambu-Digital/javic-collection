import { PermissionChecker, User, PERMISSIONS as ADMIN_PERMISSIONS } from '@/lib/permissions'

export const POS_PERMISSIONS = {
  SALE: 'pos.sale',
  WHOLESALE: 'pos.wholesale',
  DISCOUNT_SMALL: 'pos.discount.small',
  DISCOUNT_LARGE: 'pos.discount.large',
  PRICE_OVERRIDE: 'pos.price.override',
  APPROVE_DISCOUNTS: 'pos.discount.approve',
  CUSTOMERS_VIEW: 'pos.customers.view',
  CUSTOMERS_CREATE: 'pos.customers.create',
  CUSTOMERS_ID_VIEW: 'pos.customers.id.view',
  CREDIT_ENABLE: 'pos.credit.enable',
  CREDIT_LIMIT: 'pos.credit.limit',
  CREDIT_SALE: 'pos.credit.sale',
  CREDIT_OVERRIDE: 'pos.credit.override',
  REPAYMENTS: 'pos.repayments',
  REPAYMENTS_REVERSE: 'pos.repayments.reverse',
  HOLD_ORDERS: 'pos.held.create',
  CANCEL_HELD: 'pos.held.cancel',
  RETURNS: 'pos.returns',
  REFUNDS: 'pos.refunds',
  REVERSE_SALES: 'pos.sales.reverse',
  REPORTS_OWN: 'pos.reports.own',
  REPORTS_OUTLET: 'pos.reports.outlet',
  REPORTS_ALL: 'pos.reports.all',
  REPORTS_EXPORT: 'pos.reports.export',
  SYNC_RESOLVE: 'pos.sync.resolve',
  SETTINGS: 'pos.settings',
} as const

export type PosPermission = typeof POS_PERMISSIONS[keyof typeof POS_PERMISSIONS]

export const POS_ROLE_PERMISSIONS: Record<string, PosPermission[]> = {
  cashier: [
    POS_PERMISSIONS.SALE,
    POS_PERMISSIONS.DISCOUNT_SMALL,
    POS_PERMISSIONS.CUSTOMERS_VIEW,
    POS_PERMISSIONS.HOLD_ORDERS,
    POS_PERMISSIONS.REPORTS_OWN,
  ],
  senior_cashier: [
    POS_PERMISSIONS.SALE,
    POS_PERMISSIONS.WHOLESALE,
    POS_PERMISSIONS.DISCOUNT_SMALL,
    POS_PERMISSIONS.DISCOUNT_LARGE,
    POS_PERMISSIONS.CUSTOMERS_VIEW,
    POS_PERMISSIONS.CUSTOMERS_CREATE,
    POS_PERMISSIONS.CREDIT_SALE,
    POS_PERMISSIONS.REPAYMENTS,
    POS_PERMISSIONS.HOLD_ORDERS,
    POS_PERMISSIONS.CANCEL_HELD,
    POS_PERMISSIONS.REPORTS_OWN,
    POS_PERMISSIONS.REPORTS_OUTLET,
  ],
  supervisor: [
    POS_PERMISSIONS.SALE,
    POS_PERMISSIONS.WHOLESALE,
    POS_PERMISSIONS.DISCOUNT_SMALL,
    POS_PERMISSIONS.DISCOUNT_LARGE,
    POS_PERMISSIONS.PRICE_OVERRIDE,
    POS_PERMISSIONS.APPROVE_DISCOUNTS,
    POS_PERMISSIONS.CUSTOMERS_VIEW,
    POS_PERMISSIONS.CUSTOMERS_CREATE,
    POS_PERMISSIONS.CUSTOMERS_ID_VIEW,
    POS_PERMISSIONS.CREDIT_ENABLE,
    POS_PERMISSIONS.CREDIT_SALE,
    POS_PERMISSIONS.CREDIT_OVERRIDE,
    POS_PERMISSIONS.REPAYMENTS,
    POS_PERMISSIONS.HOLD_ORDERS,
    POS_PERMISSIONS.CANCEL_HELD,
    POS_PERMISSIONS.RETURNS,
    POS_PERMISSIONS.REFUNDS,
    POS_PERMISSIONS.REPORTS_OUTLET,
    POS_PERMISSIONS.SYNC_RESOLVE,
  ],
  manager: Object.values(POS_PERMISSIONS),
  administrator: Object.values(POS_PERMISSIONS),
}

export const POS_DISCOUNT_LIMITS = {
  cashier: { percent: 5, fixedMinor: 50000 },
  senior_cashier: { percent: 15, fixedMinor: 200000 },
  supervisor: { percent: 30, fixedMinor: 500000 },
  manager: { percent: 100, fixedMinor: Number.MAX_SAFE_INTEGER },
  administrator: { percent: 100, fixedMinor: Number.MAX_SAFE_INTEGER },
}

export function getPosRole(user: User & { posRole?: string }): string {
  if (user.posRole) return user.posRole
  if (user.role === 'super_admin') return 'administrator'
  if (user.role === 'admin') return 'manager'
  return 'cashier'
}

export class PosPermissionChecker extends PermissionChecker {
  private posPermissions: Set<PosPermission>
  private posRole: string

  constructor(user: User & { posRole?: string; permissions?: string[] }) {
    super(user)
    this.posRole = getPosRole(user)
    const rolePerms = POS_ROLE_PERMISSIONS[this.posRole] || []
    const customPosPerms = (user.permissions || []).filter(p =>
      p.startsWith('pos.')
    ) as PosPermission[]
    this.posPermissions = new Set([...rolePerms, ...customPosPerms])
    if (user.role === 'super_admin') {
      Object.values(POS_PERMISSIONS).forEach(p => this.posPermissions.add(p))
    }
  }

  hasPosPermission(permission: PosPermission): boolean {
    return this.posPermissions.has(permission)
  }

  getPosRole(): string {
    return this.posRole
  }

  getPosRoleLabel(): string {
    return this.posRole.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  getDiscountLimits() {
    return POS_DISCOUNT_LIMITS[this.posRole as keyof typeof POS_DISCOUNT_LIMITS] ||
      POS_DISCOUNT_LIMITS.cashier
  }

  canAccessPos(): boolean {
    return (
      this.isAdmin() ||
      this.posPermissions.size > 0 ||
      (this as PermissionChecker).hasPermission(ADMIN_PERMISSIONS.ORDERS_VIEW)
    )
  }
}

export function createPosPermissionChecker(user: User & { posRole?: string }): PosPermissionChecker {
  return new PosPermissionChecker(user)
}
