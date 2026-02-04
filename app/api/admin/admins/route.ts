import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Only super admins can access admin management
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin access required' },
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
    
    // Build query - Only show admin and super_admin users
    const query: any = { 
      role: { $in: ['admin', 'super_admin'] }
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Role filter
    if (role !== 'all') {
      query.role = role
    }
    
    // Status filter
    if (status !== 'all') {
      query.isActive = status === 'active'
    }
    
    const skip = (page - 1) * limit
    
    // Get admins with pagination
    const admins = await User.find(query)
      .select('-password -passwordResetToken -emailVerificationToken')
      .populate('approvedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    // Get total count
    const total = await User.countDocuments(query)
    
    return NextResponse.json({
      admins,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
    
  } catch (error: any) {
    console.error('Error fetching admins:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    )
  }
}
