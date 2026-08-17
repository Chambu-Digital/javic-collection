import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Branch from '@/models/Branch'
import { requireAuth } from '@/lib/auth'

// GET /api/admin/branches - List all branches
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await connectDB()

    const branches = await Branch.find().sort({ isMainBranch: -1, createdAt: 1 })

    return NextResponse.json({ branches })
  } catch (error: any) {
    console.error('Error fetching branches:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch branches' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// POST /api/admin/branches - Create new branch
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await connectDB()

    const body = await request.json()
    const { name, branchCode, location, address, isActive, isMainBranch } = body

    // Validation
    if (!name || !branchCode) {
      return NextResponse.json(
        { error: 'Name and branch code are required' },
        { status: 400 }
      )
    }

    // Check if branch code already exists
    const existing = await Branch.findOne({ 
      branchCode: branchCode.toUpperCase() 
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Branch code already exists' },
        { status: 400 }
      )
    }

    // If setting as main branch, ensure only one main branch exists
    if (isMainBranch) {
      const existingMain = await Branch.findOne({ isMainBranch: true })
      if (existingMain) {
        return NextResponse.json(
          { error: 'A main branch already exists. Only one main branch is allowed.' },
          { status: 400 }
        )
      }
    }

    const branch = new Branch({
      name: name.trim(),
      branchCode: branchCode.toUpperCase().trim(),
      location: location?.trim(),
      address: address?.trim(),
      isActive: isActive !== undefined ? isActive : true,
      isMainBranch: isMainBranch || false
    })

    await branch.save()

    return NextResponse.json({ 
      success: true, 
      branch 
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating branch:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create branch' },
      { status: 500 }
    )
  }
}
