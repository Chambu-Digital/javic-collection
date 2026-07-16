import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const POS_COOKIE = 'pos-token'

const schema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = schema.parse(body)

    await connectDB()

    const user = await User.findOne({ email, isActive: true })

    if (!user || !(await user.comparePassword(password))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // POS access: must be admin/super_admin OR have an explicit posRole assigned
    const hasPosAccess =
      user.role === 'admin' ||
      user.role === 'super_admin' ||
      Boolean(user.posRole)

    if (!hasPosAccess) {
      return NextResponse.json(
        { error: 'You do not have POS access. Contact your manager.' },
        { status: 403 }
      )
    }

    // Derive effective POS role
    let posRole = user.posRole as string | undefined
    if (!posRole) {
      posRole = user.role === 'super_admin' ? 'administrator' : 'manager'
    }

    const payload = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      posRole,
      permissions: user.permissions ?? [],
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' })

    const cookieStore = await cookies()
    cookieStore.set(POS_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12, // 12 hours — POS shift length
      path: '/',
    })

    return NextResponse.json({ user: payload })
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    console.error('[pos/auth/login]', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
