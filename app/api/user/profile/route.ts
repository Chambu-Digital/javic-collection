import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import mongoose from 'mongoose'

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  phone: z.string().optional()
})

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    // Validate input
    const validatedData = updateProfileSchema.parse(body)
    
    await connectDB()
    
    // Check if email is already taken by another user
    if (validatedData.email !== user.email) {
      const existingUser = await User.findOne({ 
        email: validatedData.email,
        _id: { $ne: new mongoose.Types.ObjectId(user.id) }
      })
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already taken' },
          { status: 400 }
        )
      }
    }
    
    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      validatedData,
      { new: true }
    ).select('-password')
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isEmailVerified: updatedUser.isEmailVerified
      }
    })
    
  } catch (error: any) {
    console.error('Update profile error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
