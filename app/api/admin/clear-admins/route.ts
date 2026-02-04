import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Only super admins can clear all admins
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super administrators can clear admin users' },
        { status: 403 }
      )
    }

    await connectDB()
    
    // Find all admin users first (for logging)
    const adminUsers = await User.find({
      role: { $in: ['admin', 'super_admin'] }
    }).select('firstName lastName email role')
    
    console.log(`Found ${adminUsers.length} admin users to remove:`)
    adminUsers.forEach(admin => {
      console.log(`  - ${admin.firstName} ${admin.lastName} (${admin.email}) - ${admin.role}`)
    })
    
    if (adminUsers.length === 0) {
      return NextResponse.json({
        message: 'No admin users found to remove',
        removedCount: 0
      })
    }
    
    // Delete all admin users
    const result = await User.deleteMany({
      role: { $in: ['admin', 'super_admin'] }
    })
    
    console.log(`Successfully removed ${result.deletedCount} admin users`)
    
    return NextResponse.json({
      message: `Successfully removed ${result.deletedCount} admin users`,
      removedCount: result.deletedCount,
      removedUsers: adminUsers.map(admin => ({
        name: `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
        role: admin.role
      }))
    })
    
  } catch (error: any) {
    console.error('Error clearing admin users:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to clear admin users' },
      { status: 500 }
    )
  }
}