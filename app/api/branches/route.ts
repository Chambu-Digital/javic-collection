import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Branch from '@/models/Branch'
import { requireAuth } from '@/lib/auth'

// GET /api/branches - List active branches (for POS use)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Check if user has POS access or is admin
    if (user.role !== 'super_admin' && (!user.canAccessPOS || !['admin', 'super_admin'].includes(user.role))) {
      return NextResponse.json(
        { error: 'POS access required' },
        { status: 403 }
      )
    }

    await connectDB()

    // Fetch only active branches, sorted with main branch first
    const branches = await Branch.find({ isActive: true })
      .select('_id name branchCode location address isMainBranch')
      .sort({ isMainBranch: -1, name: 1 })
      .lean()

    return NextResponse.json({ 
      success: true,
      branches 
    })
  } catch (error: any) {
    console.error('Error fetching branches:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch branches' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
