import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { PERMISSIONS, ROLE_PERMISSIONS, Permission } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (userId) {
      // Get permissions for a specific user
      const user = await User.findById(userId).select('role permissions legacyPermissions')
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      // Combine role-based and custom permissions
      const rolePermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || []
      const customPermissions = user.permissions || []
      const allPermissions = [...new Set([...rolePermissions, ...customPermissions])]
      
      return NextResponse.json({
        userId: user._id,
        role: user.role,
        permissions: allPermissions,
        customPermissions,
        rolePermissions
      })
    } else {
      // Get all available permissions
      return NextResponse.json({
        availablePermissions: Object.values(PERMISSIONS),
        rolePermissions: ROLE_PERMISSIONS,
        permissionGroups: {
          'Dashboard': [PERMISSIONS.DASHBOARD_VIEW],
          'Product Management': [
            PERMISSIONS.PRODUCTS_VIEW,
            PERMISSIONS.PRODUCTS_CREATE,
            PERMISSIONS.PRODUCTS_EDIT,
            PERMISSIONS.PRODUCTS_DELETE,
            PERMISSIONS.CATEGORIES_VIEW,
            PERMISSIONS.CATEGORIES_MANAGE,
          ],
          'Order Management': [
            PERMISSIONS.ORDERS_VIEW,
            PERMISSIONS.ORDERS_MANAGE,
            PERMISSIONS.ORDERS_EXPORT,
          ],
          'Customer Management': [
            PERMISSIONS.CUSTOMERS_VIEW,
            PERMISSIONS.CUSTOMERS_MANAGE,
            PERMISSIONS.REVIEWS_VIEW,
            PERMISSIONS.REVIEWS_MODERATE,
          ],
          'Content Management': [
            PERMISSIONS.BLOG_VIEW,
            PERMISSIONS.BLOG_CREATE,
            PERMISSIONS.BLOG_EDIT,
            PERMISSIONS.BLOG_DELETE,
          ],
          'Analytics & Reports': [
            PERMISSIONS.REPORTS_VIEW,
            PERMISSIONS.REPORTS_EXPORT,
          ],
          'System Management': [
            PERMISSIONS.SHIPPING_VIEW,
            PERMISSIONS.SHIPPING_MANAGE,
            PERMISSIONS.SETTINGS_VIEW,
            PERMISSIONS.SETTINGS_MANAGE,
          ],
          'Admin Management': [
            PERMISSIONS.ADMINS_VIEW,
            PERMISSIONS.ADMINS_CREATE,
            PERMISSIONS.ADMINS_MANAGE,
            PERMISSIONS.REQUESTS_VIEW,
            PERMISSIONS.REQUESTS_MANAGE,
          ],
        }
      })
    }
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const { userId, permissions } = await request.json()
    
    if (!userId || !Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    
    // Validate permissions
    const validPermissions = Object.values(PERMISSIONS)
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p as Permission))
    
    if (invalidPermissions.length > 0) {
      return NextResponse.json({ 
        error: 'Invalid permissions', 
        invalidPermissions 
      }, { status: 400 })
    }
    
    // Update user permissions
    const user = await User.findByIdAndUpdate(
      userId,
      { permissions },
      { new: true, runValidators: true }
    ).select('role permissions')
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      message: 'Permissions updated successfully',
      user: {
        _id: user._id,
        role: user.role,
        permissions: user.permissions
      }
    })
  } catch (error) {
    console.error('Error updating permissions:', error)
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 })
  }
}
