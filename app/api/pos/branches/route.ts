import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Branch from '@/models/Branch'
import { requirePosAuth, handlePosAuthError } from '@/lib/pos/auth'

// Force dynamic — branches data should not be cached
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/pos/branches
 * 
 * Returns all active branches for POS branch selector
 * Requires POS authentication (pos-token cookie)
 */
export async function GET(request: NextRequest) {
  try {
    await requirePosAuth(request)
    await connectDB()

    const branches = await Branch.find({ isActive: true })
      .select('name branchCode location address isMainBranch isActive')
      .sort({ isMainBranch: -1, name: 1 })
      .lean()

    return NextResponse.json({ 
      branches 
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    
    console.error('[pos/branches] Error fetching branches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    )
  }
}
