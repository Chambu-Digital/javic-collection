import { useMemo } from 'react'
import { useUserStore } from './user-store'
import { createPermissionChecker, Permission, PermissionChecker } from './permissions'

export function usePermissions(): PermissionChecker | null {
  const { user } = useUserStore()

  return useMemo(() => {
    if (!user) return null
    return createPermissionChecker(user)
  }, [user])
}

export function useHasPermission(permission: Permission): boolean {
  const permissionChecker = usePermissions()
  return permissionChecker?.hasPermission(permission) ?? false
}

export function useHasAnyPermission(permissions: Permission[]): boolean {
  const permissionChecker = usePermissions()
  return permissionChecker?.hasAnyPermission(permissions) ?? false
}

export function useHasAllPermissions(permissions: Permission[]): boolean {
  const permissionChecker = usePermissions()
  return permissionChecker?.hasAllPermissions(permissions) ?? false
}

export function useIsSuperAdmin(): boolean {
  const permissionChecker = usePermissions()
  return permissionChecker?.isSuperAdmin() ?? false
}

export function useIsAdmin(): boolean {
  const permissionChecker = usePermissions()
  return permissionChecker?.isAdmin() ?? false
}