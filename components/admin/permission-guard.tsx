'use client'

import { ReactNode } from 'react'
import { usePermissions } from '@/lib/use-permissions'
import { Permission } from '@/lib/permissions'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, AlertTriangle } from 'lucide-react'

interface PermissionGuardProps {
  permissions: Permission[]
  requireAll?: boolean
  fallback?: ReactNode
  children: ReactNode
}

export default function PermissionGuard({
  permissions,
  requireAll = false,
  fallback,
  children
}: PermissionGuardProps) {
  const permissionChecker = usePermissions()

  if (!permissionChecker) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading permissions...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasPermission = requireAll
    ? permissionChecker.hasAllPermissions(permissions)
    : permissionChecker.hasAnyPermission(permissions)

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to access this feature.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Contact your administrator if you believe this is an error.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}

// Utility component for conditional rendering based on permissions
interface PermissionCheckProps {
  permissions: Permission[]
  requireAll?: boolean
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionCheck({
  permissions,
  requireAll = false,
  children,
  fallback = null
}: PermissionCheckProps) {
  const permissionChecker = usePermissions()

  if (!permissionChecker) {
    return <>{fallback}</>
  }

  const hasPermission = requireAll
    ? permissionChecker.hasAllPermissions(permissions)
    : permissionChecker.hasAnyPermission(permissions)

  return hasPermission ? <>{children}</> : <>{fallback}</>
}