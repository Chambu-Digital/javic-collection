import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import User, { IUser } from '@/models/User'
import connectDB from '@/lib/mongodb'


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '7d'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: 'customer' | 'admin' | 'super_admin'
  profileImage?: string
  provider?: 'local' | 'google'
  addresses?: Array<{
    _id?: string
    type: 'shipping' | 'billing'
    name: string
    phone: string
    county: string
    area: string
    isDefault: boolean
  }>
}

export function generateToken(user: IUser): string {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export function verifyToken(token: string): (AuthUser & { userId: string }) | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      ...decoded,
      userId: decoded.id
    }
  } catch (error) {
    return null
  }
}

export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    // For API routes, get token from request cookies
    const token = request.cookies.get('auth-token')?.value
    console.log('Auth token from request cookies:', token ? 'Present' : 'Missing')
    
    if (!token) {
      console.log('No auth token found')
      return null
    }
    
    const decoded = verifyToken(token)
    if (!decoded) {
      console.log('Token verification failed')
      return null
    }
    
    console.log('Token decoded successfully for user:', decoded.email)
    
    // Verify user still exists and is active, and get full user data including addresses
    await connectDB()
    const user = await User.findById(decoded.id).select('-password')
    
    if (!user || !user.isActive) {
      console.log('User not found or inactive')
      return null
    }
    
    console.log('User authenticated successfully:', decoded.email)
    
    // Return full user data including addresses
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      provider: user.provider,
      addresses: user.addresses || []
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(request)
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request)
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    throw new Error('Admin access required')
  }
  return user
}

