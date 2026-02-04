import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import AdminRequest from '@/models/AdminRequest'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import mongoose from 'mongoose'

const approveRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
  permissions: z.object({
    products: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false)
    }).optional(),
    orders: z.object({
      view: z.boolean().default(false),
      edit: z.boolean().default(false),
      cancel: z.boolean().default(false)
    }).optional(),
    blog: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false)
    }).optional(),
    customers: z.object({
      view: z.boolean().default(false),
      edit: z.boolean().default(false)
    }).optional(),
    reports: z.object({
      view: z.boolean().default(false),
      export: z.boolean().default(false)
    }).optional(),
    settings: z.object({
      view: z.boolean().default(false),
      edit: z.boolean().default(false)
    }).optional(),
    locations: z.object({
      view: z.boolean().default(false),
      edit: z.boolean().default(false)
    }).optional()
  }).optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    // Only super admins can approve/reject requests
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const validatedData = approveRequestSchema.parse(body)
    
    await connectDB()
    
    // Find the admin request
    const adminRequest = await AdminRequest.findById(id)
    if (!adminRequest) {
      return NextResponse.json(
        { error: 'Admin request not found' },
        { status: 404 }
      )
    }
    
    if (adminRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      )
    }
    
    if (validatedData.action === 'approve') {
      // Create new admin user
      const newAdmin = new User({
        firstName: adminRequest.firstName,
        lastName: adminRequest.lastName,
        email: adminRequest.email,
        password: adminRequest.password, // Already hashed in AdminRequest
        role: 'admin',
        permissions: validatedData.permissions || {},
        isActive: true,
        isEmailVerified: true,
        isApproved: true,
        approvedBy: new mongoose.Types.ObjectId(user.id),
        approvedAt: new Date()
      })
      
      // Mark password as not modified to prevent double hashing
      // The password is already hashed in AdminRequest, so we don't want
      // the User model's pre-save hook to hash it again
      newAdmin.markModified('password', false)
      
      console.log('Creating admin user from approved request:', {
        email: newAdmin.email,
        role: newAdmin.role,
        passwordAlreadyHashed: true
      })
      
      await newAdmin.save()
      
      // Update request status
      adminRequest.status = 'approved'
      adminRequest.reviewedAt = new Date()
      adminRequest.reviewedBy = new mongoose.Types.ObjectId(user.id)
      await adminRequest.save()
      
      return NextResponse.json({
        message: 'Admin request approved successfully',
        adminId: newAdmin._id
      })
      
    } else if (validatedData.action === 'reject') {
      // Update request status
      adminRequest.status = 'rejected'
      adminRequest.reviewedAt = new Date()
      adminRequest.reviewedBy = new mongoose.Types.ObjectId(user.id)
      adminRequest.rejectionReason = validatedData.rejectionReason || 'No reason provided'
      await adminRequest.save()
      
      return NextResponse.json({
        message: 'Admin request rejected successfully'
      })
    }
    
  } catch (error: any) {
    console.error('Error processing admin request:', error)
    
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
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'An admin with this email already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to process admin request' },
      { status: 500 }
    )
  }
}