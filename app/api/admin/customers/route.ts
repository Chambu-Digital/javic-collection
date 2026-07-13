import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['customer', 'admin', 'super_admin']).default('customer'),
})

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth(request)

    if (admin.role !== 'admin' && admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Only super_admin can create admin/super_admin accounts
    const body = await request.json()
    const validated = createUserSchema.parse(body)

    if (
      (validated.role === 'admin' || validated.role === 'super_admin') &&
      admin.role !== 'super_admin'
    ) {
      return NextResponse.json(
        { error: 'Only super_admin can create admin accounts' },
        { status: 403 }
      )
    }

    await connectDB()

    const existing = await User.findOne({ email: validated.email })
    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    const user = new User({
      ...validated,
      isEmailVerified: true,   // admin-created accounts are pre-verified
      isApproved: true,
      isActive: true,
      provider: 'local',
      ...(validated.role !== 'customer' && {
        approvedBy: admin.id,
        approvedAt: new Date(),
      }),
    })

    await user.save()

    console.log(`[admin/customers] ${admin.email} created user: ${validated.email} (${validated.role})`)

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[admin/customers POST] Error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Only admins and super admins can access customer data
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || 'all'
    const status = searchParams.get('status') || 'all'
    
    await connectDB()
    
    // Build query - Only show customers (not admins)
    const query: any = { role: 'customer' }
    
    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Status filter
    if (status !== 'all') {
      query.isActive = status === 'active'
    }
    
    const skip = (page - 1) * limit
    
    // Get customers with pagination
    const customers = await User.find(query)
      .select('-password -passwordResetToken -emailVerificationToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    // Get total count
    const total = await User.countDocuments(query)
    
    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
    
  } catch (error: any) {
    console.error('Error fetching customers:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
