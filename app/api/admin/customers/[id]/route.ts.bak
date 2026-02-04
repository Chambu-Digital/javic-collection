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
    
    // Only admins and super admins can update customers
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await request.json()
    
    await connectDB()
    
    // Validate customer ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      )
    }
    
    // Find the customer
    const customer = await User.findById(id)
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Prevent non-super admins from modifying other admins
    if (user.role === 'admin' && (customer.role === 'admin' || customer.role === 'super_admin')) {
      return NextResponse.json(
        { error: 'Cannot modify admin users' },
        { status: 403 }
      )
    }
    
    // Prevent modifying super admin (except by other super admins)
    if (customer.role === 'super_admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot modify super admin' },
        { status: 403 }
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
    
    // Update customer
    const updatedCustomer = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -emailVerificationToken')
    
    return NextResponse.json({
      message: 'Customer updated successfully',
      customer: updatedCustomer
    })
    
  } catch (error: any) {
    console.error('Error updating customer:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update customer' },
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
    
    // Only admins and super admins can view customer details
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const { id } = params
    
    await connectDB()
    
    // Validate customer ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      )
    }
    
    // Find the customer
    const customer = await User.findById(id)
      .select('-password -passwordResetToken -emailVerificationToken')
      .populate('approvedBy', 'firstName lastName email')
      .lean()
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ customer })
    
  } catch (error: any) {
    console.error('Error fetching customer:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}