import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Vendor from '@/models/Vendor'
import { requirePosAuth, handlePosAuthError } from '@/lib/pos/auth'

// Force dynamic — vendor data should not be cached
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/pos/vendors
 * 
 * Returns all active vendors for POS
 * Requires POS authentication (pos-token cookie)
 */
export async function GET(request: NextRequest) {
  try {
    await requirePosAuth(request)
    await connectDB()

    const vendors = await Vendor.find({ isActive: true })
      .select('name vendorCode phone email isHouseStock isActive')
      .sort({ isHouseStock: -1, name: 1 })
      .lean()

    return NextResponse.json({ 
      vendors,
      total: vendors.length
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    
    console.error('[pos/vendors] Error fetching vendors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}
