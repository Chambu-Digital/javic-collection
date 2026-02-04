import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { z } from 'zod'

const simpleResetSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = simpleResetSchema.parse(body)
    
    await connectDB()
    
    // Find user by email
    const user = await User.findOne({ 
      email: validatedData.email
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with that email address' },
        { status: 404 }
      )
    }
    
    console.log('Simple password reset for:', {
      email: user.email,
      userId: user._id,
      currentRole: user.role
    })
    
    // Update password directly (will be hashed by pre-save hook)
    user.password = validatedData.newPassword
    
    // Ensure user is active
    user.isActive = true
    
    // Clear any existing reset tokens
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    
    await user.save()
    
    console.log('Password reset successful for:', user.email)
    
    return NextResponse.json({
      message: 'Password reset successful! You can now login with your new password.',
      email: user.email,
      role: user.role
    })
    
  } catch (error: any) {
    console.error('Simple reset error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
