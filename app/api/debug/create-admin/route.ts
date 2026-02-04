import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@electromatt.co.ke' },
        { role: 'super_admin' }
      ]
    })
    
    if (existingAdmin) {
      return NextResponse.json({
        message: 'Admin user already exists',
        admin: {
          id: existingAdmin._id,
          firstName: existingAdmin.firstName,
          lastName: existingAdmin.lastName,
          email: existingAdmin.email,
          role: existingAdmin.role,
          isActive: existingAdmin.isActive,
          isApproved: existingAdmin.isApproved
        }
      })
    }
    
    // Create new admin user
    const adminUser = new User({
      firstName: 'Electromatt',
      lastName: 'Admin',
      email: 'admin@electromatt.co.ke',
      password: 'admin123',
      phone: '+254713065412',
      role: 'super_admin',
      isActive: true,
      isEmailVerified: true,
      isApproved: true,
      approvedAt: new Date(),
      provider: 'local'
    })
    
    await adminUser.save()
    
    return NextResponse.json({
      message: 'Admin user created successfully',
      admin: {
        id: adminUser._id,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        email: adminUser.email,
        role: adminUser.role,
        isActive: adminUser.isActive,
        isApproved: adminUser.isApproved
      },
      credentials: {
        email: 'admin@electromatt.co.ke',
        password: 'admin123'
      }
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Error creating admin:', error)
    
    return NextResponse.json({
      error: 'Failed to create admin user',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    await connectDB()
    
    // Get all admin users
    const admins = await User.find({ 
      role: { $in: ['admin', 'super_admin'] }
    }).select('-password').lean()
    
    return NextResponse.json({
      admins,
      count: admins.length
    })
    
  } catch (error: any) {
    console.error('Error fetching admins:', error)
    
    return NextResponse.json({
      error: 'Failed to fetch admin users',
      details: error.message
    }, { status: 500 })
  }
}
