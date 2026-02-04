import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const addressSchema = z.object({
  type: z.enum(['shipping', 'billing']),
  name: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  county: z.string().min(1, 'County is required'),
  area: z.string().min(1, 'Area is required'),
  isDefault: z.boolean().default(false)
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    await connectDB()
    
    const userData = await User.findById(user.id).select('addresses')
    
    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      addresses: userData.addresses || []
    })
    
  } catch (error: any) {
    console.error('Get addresses error:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    console.log('Adding address for user:', user.id, 'Address data:', body)
    
    // Validate input
    const validatedData = addressSchema.parse(body)
    
    await connectDB()
    
    const userData = await User.findById(user.id)
    
    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    console.log('User found, current addresses count:', userData.addresses?.length || 0)
    
    // If this is the first address of this type, make it default
    const existingAddressesOfType = userData.addresses.filter((addr: any) => addr.type === validatedData.type)
    if (existingAddressesOfType.length === 0) {
      validatedData.isDefault = true
    }
    
    // If this is set as default, unset other defaults of the same type
    if (validatedData.isDefault) {
      userData.addresses.forEach((addr: any) => {
        if (addr.type === validatedData.type) {
          addr.isDefault = false
        }
      })
    }
    
    // Add new address
    userData.addresses.push(validatedData)
    await userData.save()
    
    console.log('Address saved successfully, new addresses count:', userData.addresses.length)
    
    // Get the newly added address
    const newAddress = userData.addresses[userData.addresses.length - 1]
    
    return NextResponse.json({
      message: 'Address added successfully',
      address: newAddress
    })
    
  } catch (error: any) {
    console.error('Add address error:', error)
    
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
      { error: 'Failed to add address' },
      { status: 500 }
    )
  }
}
