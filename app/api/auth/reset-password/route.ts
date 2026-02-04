import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = resetPasswordSchema.parse(body)
    
    await connectDB()
    
    // Find user by reset token and check if token is still valid
    const user = await User.findOne({
      passwordResetToken: validatedData.token,
      passwordResetExpires: { $gt: new Date() } // Token not expired
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }
    
    console.log('Resetting password for user:', {
      email: user.email,
      userId: user._id
    })
    
    // Update password (will be hashed by pre-save hook)
    user.password = validatedData.password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    
    // Ensure user is active (in case they were deactivated)
    user.isActive = true
    
    await user.save()
    
    console.log('Password reset successful for:', user.email)
    
    return NextResponse.json({
      message: 'Password reset successful. You can now login with your new password.'
    })
    
  } catch (error: any) {
    console.error('Reset password error:', error)
    
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