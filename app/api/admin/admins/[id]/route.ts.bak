import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    
    // Only super admins can update admin users
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await request.json()
    
    await connectDB()
    
    // Validate admin ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid admin ID' },
        { status: 400 }
      )
    }
    
    // Find the admin
    const admin = await User.findById(id)
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }
    
    // Ensure we're only updating admin/super_admin users
    if (!['admin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json(
        { error: 'User is not an admin' },
        { status: 400 }
      )
    }
    
    // Prevent self-modification of super admin status
    if (admin._id.toString() === user.id && body.isActive === false) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      )
    }
    
    // Update allowed fields
    const allowedUpdates = ['isActive', 'permissions']
    const updates: any = {}
    
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }
    
    // Update admin
    const updatedAdmin = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -emailVerificationToken')
    
    return NextResponse.json({
      message: 'Admin updated successfully',
      admin: updatedAdmin
    })
    
  } catch (error: any) {
    console.error('Error updating admin:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update admin' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    
    // Only super admins can view admin details
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      )
    }

    const { id } = params
    
    await connectDB()
    
    // Validate admin ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid admin ID' },
        { status: 400 }
      )
    }
    
    // Find the admin
    const admin = await User.findById(id)
      .select('-password -passwordResetToken -emailVerificationToken')
      .populate('approvedBy', 'firstName lastName email')
      .lean()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }
    
    // Ensure we're only returning admin/super_admin users
    if (!['admin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json(
        { error: 'User is not an admin' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ admin })
    
  } catch (error: any) {
    console.error('Error fetching admin:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch admin' },
      { status: 500 }
    )
  }
}