import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Only super admins can fix passwords
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      )
    }
    
    await connectDB()
    
    // Find users who might have double-hashed passwords
    // These would be users created from AdminRequest approval
    const suspiciousUsers = await User.find({
      role: { $in: ['admin', 'super_admin'] },
      createdAt: { $exists: true }
    }).select('_id firstName lastName email createdAt')
    
    console.log('Found users to potentially fix:', suspiciousUsers.length)
    
    const results = []
    
    for (const suspiciousUser of suspiciousUsers) {
      // For each user, we'll generate a password reset token
      // This allows them to set a new password properly
      const resetToken = require('crypto').randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      
      suspiciousUser.passwordResetToken = resetToken
      suspiciousUser.passwordResetExpires = resetTokenExpiry
      
      // Mark password as not modified to avoid re-hashing the reset token fields
      suspiciousUser.markModified('passwordResetToken')
      suspiciousUser.markModified('passwordResetExpires')
      suspiciousUser.markModified('password', false)
      
      await suspiciousUser.save()
      
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/reset-password?token=${resetToken}`
      
      results.push({
        userId: suspiciousUser._id,
        email: suspiciousUser.email,
        name: `${suspiciousUser.firstName} ${suspiciousUser.lastName}`,
        resetToken,
        resetUrl
      })
      
      console.log(`Generated reset token for ${suspiciousUser.email}: ${resetUrl}`)
    }
    
    return NextResponse.json({
      message: `Generated password reset tokens for ${results.length} admin users`,
      users: results,
      note: 'These users can now use the reset links to set new passwords'
    })
    
  } catch (error: any) {
    console.error('Error fixing passwords:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fix passwords' },
      { status: 500 }
    )
  }
}