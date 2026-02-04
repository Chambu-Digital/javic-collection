import { NextRequest, NextResponse } from 'next/server'
import { ensureDBConnection } from '@/lib/db-utils'
import User from '@/models/User'
import { generateToken } from '@/lib/auth'
import { setAuthCookie } from '@/lib/auth-server'
import { z } from 'zod'

const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential is required')
})

// Function to verify Google ID token
async function verifyGoogleToken(credential: string) {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`)
    
    if (!response.ok) {
      throw new Error('Invalid Google token')
    }
    
    const payload = await response.json()
    
    // Verify the token is for our app
    if (payload.aud !== process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      throw new Error('Invalid audience')
    }
    
    return {
      googleId: payload.sub,
      email: payload.email,
      firstName: payload.given_name || '',
      lastName: payload.family_name || '',
      profileImage: payload.picture,
      emailVerified: payload.email_verified === 'true'
    }
  } catch (error) {
    console.error('Google token verification failed:', error)
    throw new Error('Invalid Google token')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = googleAuthSchema.parse(body)
    
    // Ensure DB connection is ready (no new connection created)
    await ensureDBConnection()
    
    // Verify Google token and get user info
    const googleUser = await verifyGoogleToken(validatedData.credential)
    
    // Check if user already exists by email or Google ID
    let user = await User.findOne({
      $or: [
        { email: googleUser.email },
        { googleId: googleUser.googleId }
      ],
      isActive: true
    })
    
    if (user) {
      // User exists - update Google info if needed
      if (!user.googleId && user.provider === 'local') {
        // Link existing local account with Google
        user.googleId = googleUser.googleId
        user.profileImage = googleUser.profileImage
        user.isEmailVerified = true
        await user.save()
      } else if (user.googleId && user.provider === 'google') {
        // Update existing Google user info
        user.profileImage = googleUser.profileImage
        await user.save()
      }
    } else {
      // Create new user from Google account
      user = new User({
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        email: googleUser.email,
        password: 'google-oauth-user', // Placeholder - won't be used
        googleId: googleUser.googleId,
        profileImage: googleUser.profileImage,
        provider: 'google',
        isEmailVerified: true,
        role: 'customer'
      })
      
      await user.save()
    }
    
    // Generate JWT token
    const token = generateToken(user)
    
    // Set auth cookie
    await setAuthCookie(token)
    
    // Return user data
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      addresses: user.addresses,
      profileImage: user.profileImage,
      provider: user.provider
    }
    
    return NextResponse.json({
      success: true,
      user: userResponse,
      message: 'Google authentication successful'
    })
    
  } catch (error: any) {
    console.error('Google auth error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Google authentication failed' },
      { status: 400 }
    )
  }
}