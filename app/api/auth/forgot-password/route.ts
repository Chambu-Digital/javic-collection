import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { z } from 'zod'
import crypto from 'crypto'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = forgotPasswordSchema.parse(body)
    
    await connectDB()
    
    // Find user by email (including inactive users for password reset)
    const user = await User.findOne({ 
      email: validatedData.email
    })
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        message: 'If an account with that email exists, we have sent a password reset link.'
      })
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    
    // Save reset token to user
    user.passwordResetToken = resetToken
    user.passwordResetExpires = resetTokenExpiry
    await user.save()
    
    console.log('Password reset requested for:', {
      email: user.email,
      resetToken,
      expiresAt: resetTokenExpiry
    })
    
    // In a real app, you would send an email here
    // For now, we'll just log the reset link
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/reset-password?token=${resetToken}`
    console.log('🔗 Password reset link generated:', resetUrl)
    console.log('📧 In production, this would be sent to:', user.email)
    
    return NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset link.',
      // In development, include the reset link
      ...(process.env.NODE_ENV === 'development' && { 
        resetLink: resetUrl,
        note: 'In production, this would be sent via email'
      })
    })
    
  } catch (error: any) {
    console.error('Forgot password error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}