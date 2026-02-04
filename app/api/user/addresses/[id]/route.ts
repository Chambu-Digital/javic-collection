import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import mongoose from 'mongoose'

const addressSchema = z.object({
  type: z.enum(['shipping', 'billing']),
  name: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  county: z.string().min(1, 'County is required'),
  area: z.string().min(1, 'Area is required'),
  isDefault: z.boolean().default(false)
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { id } = await params
    
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
    
    // Find the address to update
    const addressIndex = userData.addresses.findIndex(
      (addr: any) => addr._id.toString() === id
    )
    
    if (addressIndex === -1) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }
    
    // If this is set as default, unset other defaults of the same type
    if (validatedData.isDefault) {
      userData.addresses.forEach((addr: any, index: number) => {
        if (addr.type === validatedData.type && index !== addressIndex) {
          addr.isDefault = false
        }
      })
    }
    
    // Update the address
    userData.addresses[addressIndex] = {
      ...userData.addresses[addressIndex],
      ...validatedData
    }
    
    await userData.save()
    
    return NextResponse.json({
      message: 'Address updated successfully',
      address: userData.addresses[addressIndex]
    })
    
  } catch (error: any) {
    console.error('Update address error:', error)
    
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
      { error: 'Failed to update address' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    await connectDB()
    
    const userData = await User.findById(user.id)
    
    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Find and remove the address
    const addressIndex = userData.addresses.findIndex(
      (addr: any) => addr._id.toString() === id
    )
    
    if (addressIndex === -1) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }
    
    userData.addresses.splice(addressIndex, 1)
    await userData.save()
    
    return NextResponse.json({
      message: 'Address deleted successfully'
    })
    
  } catch (error: any) {
    console.error('Delete address error:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    )
  }
}