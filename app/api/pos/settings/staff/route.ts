import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'

export async function GET(request: NextRequest) {
  try {
    await requirePosPermission(request, POS_PERMISSIONS.SETTINGS)
    await connectDB()

    // Return all users who have a posRole set, plus admins/super_admins
    const staff = await User.find({
      $or: [
        { posRole: { $exists: true, $ne: null } },
        { role: { $in: ['admin', 'super_admin'] } },
      ],
      isActive: true,
    })
      .select('firstName lastName email phone posRole posOutletId role permissions isActive createdAt')
      .sort({ firstName: 1 })
      .lean()

    return NextResponse.json({ staff })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePosPermission(request, POS_PERMISSIONS.SETTINGS)
    await connectDB()

    const body = await request.json() as {
      firstName: string
      lastName: string
      email: string
      phone?: string
      password: string
      posRole: string
      posOutletId?: string
      permissions?: string[]
    }

    if (!body.firstName?.trim() || !body.email?.trim() || !body.password || !body.posRole) {
      return NextResponse.json({ error: 'First name, email, password and role are required' }, { status: 400 })
    }

    const existing = await User.findOne({ email: body.email.toLowerCase().trim() })
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    }

    const user = new User({
      firstName:   body.firstName.trim(),
      lastName:    body.lastName?.trim() || '',
      email:       body.email.toLowerCase().trim(),
      phone:       body.phone?.trim(),
      password:    body.password,
      role:        'admin',        // staff get admin role so they can access the POS
      posRole:     body.posRole,
      posOutletId: body.posOutletId || undefined,
      permissions: body.permissions || [],
      isActive:    true,
      isApproved:  true,
      isEmailVerified: true,
      provider:    'local',
    })

    await user.save()

    return NextResponse.json({
      staff: {
        _id:       user._id,
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
        phone:     user.phone,
        posRole:   user.posRole,
        role:      user.role,
        permissions: user.permissions,
      },
    }, { status: 201 })
  } catch (error: any) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/settings/staff POST]', error)
    return NextResponse.json({ error: error.message || 'Failed to create staff' }, { status: 500 })
  }
}
