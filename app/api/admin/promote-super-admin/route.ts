import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

const PROMOTE_SECRET = process.env.PROMOTE_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    if (!PROMOTE_SECRET) {
      return NextResponse.json(
        { error: 'PROMOTE_SECRET env variable is not set.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { email, secret } = body

    if (!email || !secret) {
      return NextResponse.json(
        { error: 'email and secret are required' },
        { status: 400 }
      )
    }

    if (secret !== PROMOTE_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 403 }
      )
    }

    await connectDB()

    const user = await User.findOne({ email: email.toLowerCase().trim() })

    if (!user) {
      return NextResponse.json(
        { error: `No user found with email: ${email}` },
        { status: 404 }
      )
    }

    if (user.role === 'super_admin') {
      return NextResponse.json({
        message: `${email} is already a super_admin`,
        user: { email: user.email, role: user.role }
      })
    }

    user.role = 'super_admin'
    user.isApproved = true
    user.isActive = true
    await user.save()

    console.log(`[promote-super-admin] ${email} promoted to super_admin`)

    return NextResponse.json({
      success: true,
      message: `${email} has been promoted to super_admin`,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    })
  } catch (error: any) {
    console.error('[promote-super-admin] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', detail: error.message },
      { status: 500 }
    )
  }
}
