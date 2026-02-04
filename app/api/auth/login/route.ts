import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { generateToken } from '@/lib/auth'
import { setAuthCookie } from '@/lib/auth-server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = loginSchema.parse(body)
    
    await connectDB()
    
    // Find user by email
    const user = await User.findOne({ 
      email: validatedData.email,
      isActive: true 
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(validatedData.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Generate token
    const token = generateToken(user)
    
    // Set cookie
    await setAuthCookie(token)
    
    // Return user data (without password)
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    }
    
    return NextResponse.json({
      message: 'Login successful',
      user: userResponse
    })
    
  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
