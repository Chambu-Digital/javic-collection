import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import mongoose from 'mongoose'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await requireAuth(request)
    const body = await request.json()
    
    // Validate input
    const validatedData = changePasswordSchema.parse(body)
    
    await connectDB()
    
    // Get user with password
    const user = await User.findById(authUser.id)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(validatedData.currentPassword)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }
    
    // Update password
    user.password = validatedData.newPassword
    await user.save()
    
    return NextResponse.json({
      message: 'Password changed successfully'
    })
    
  } catch (error: any) {
    console.error('Change password error:', error)
    
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
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
