import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { generateToken } from '@/lib/auth'
import { setAuthCookie } from '@/lib/auth-server'
import { z } from 'zod'

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    
    await connectDB()
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }
    
    // Create new user
    const user = new User(validatedData)
    await user.save()
    
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
      message: 'Account created successfully',
      user: userResponse
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Registration error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}