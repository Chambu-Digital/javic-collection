import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'

const createStaffSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'super_admin']),
  permissions: z.array(z.string()).optional().default([]),
})

// GET — list all staff (admin + super_admin)
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super_admin can manage staff' }, { status: 403 })
    }

    await connectDB()

    const staff = await User.find({ role: { $in: ['admin', 'super_admin'] } })
      .select('-password -passwordResetToken -emailVerificationToken')
      .populate('approvedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ staff })
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

// POST — create a new staff member with optional permissions
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super_admin can create staff' }, { status: 403 })
    }

    const body = await request.json()
    const validated = createStaffSchema.parse(body)

    await connectDB()

    const existing = await User.findOne({ email: validated.email })
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
    }

    const user = new User({
      firstName: validated.firstName,
      lastName: validated.lastName,
      email: validated.email,
      password: validated.password,
      phone: validated.phone,
      role: validated.role,
      permissions: validated.permissions,
      isEmailVerified: true,
      isApproved: true,
      isActive: true,
      provider: 'local',
      approvedBy: admin.id,
      approvedAt: new Date(),
    })

    await user.save()

    console.log(`[admin/staff] ${admin.email} created staff: ${validated.email} (${validated.role})`)

    return NextResponse.json(
      {
        message: 'Staff member created successfully',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          permissions: user.permissions,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[admin/staff POST] Error:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
    }
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 })
  }
}
