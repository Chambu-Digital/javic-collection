import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { createPosPermissionChecker, PosPermission, PosPermissionChecker } from '@/lib/pos/permissions'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const POS_COOKIE = 'pos-token'

export interface PosAuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: 'customer' | 'admin' | 'super_admin'
  posRole?: string
  permissions?: string[]
}

// ---------------------------------------------------------------------------
// Read and verify the pos-token cookie — completely independent of auth-token
// ---------------------------------------------------------------------------
export async function getPosUser(request: NextRequest): Promise<PosAuthUser | null> {
  const token = request.cookies.get(POS_COOKIE)?.value
  if (!token) return null

  let decoded: any
  try {
    decoded = jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }

  // Re-validate from DB so revoked access is caught immediately
  await connectDB()
  const user = await User.findById(decoded.id).select(
    'firstName lastName email phone role posRole permissions isActive'
  )

  if (!user || !user.isActive) return null

  const hasPosAccess =
    user.role === 'admin' ||
    user.role === 'super_admin' ||
    Boolean(user.posRole)

  if (!hasPosAccess) return null

  let posRole = user.posRole as string | undefined
  if (!posRole) {
    posRole = user.role === 'super_admin' ? 'administrator' : 'manager'
  }

  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    posRole,
    permissions: user.permissions ?? [],
  }
}

export async function requirePosAuth(request: NextRequest): Promise<{
  user: PosAuthUser
  checker: PosPermissionChecker
}> {
  const user = await getPosUser(request)
  if (!user) throw new PosAuthError('POS authentication required', 401)

  const checker = createPosPermissionChecker(user as any)
  if (!checker.canAccessPos()) throw new PosAuthError('POS access denied', 403)

  return { user, checker }
}

export async function requirePosPermission(
  request: NextRequest,
  permission: PosPermission
): Promise<{ user: PosAuthUser; checker: PosPermissionChecker }> {
  const ctx = await requirePosAuth(request)
  if (!ctx.checker.hasPosPermission(permission)) {
    throw new PosAuthError('Insufficient POS permissions', 403)
  }
  return ctx
}

export class PosAuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function handlePosAuthError(error: unknown): NextResponse | null {
  if (error instanceof PosAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  if (error instanceof Error && error.message === 'Authentication required') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  return null
}
