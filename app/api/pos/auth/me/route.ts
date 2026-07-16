import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const POS_COOKIE = 'pos-token'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(POS_COOKIE)?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    // Re-validate the user is still active and has POS access
    await connectDB()
    const user = await User.findById(decoded.id).select(
      'firstName lastName email phone role posRole permissions isActive'
    )

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Account not found or inactive' }, { status: 401 })
    }

    const hasPosAccess =
      user.role === 'admin' ||
      user.role === 'super_admin' ||
      Boolean(user.posRole)

    if (!hasPosAccess) {
      return NextResponse.json({ error: 'POS access revoked' }, { status: 403 })
    }

    let posRole = user.posRole as string | undefined
    if (!posRole) {
      posRole = user.role === 'super_admin' ? 'administrator' : 'manager'
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        posRole,
        permissions: user.permissions ?? [],
      },
    })
  } catch (error) {
    console.error('[pos/auth/me]', error)
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 })
  }
}
