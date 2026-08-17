import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Vendor from '@/models/Vendor'
import { requireAdmin } from '@/lib/auth'

// GET /api/admin/vendors - List all vendors
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    await connectDB()

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const query = activeOnly ? { isActive: true } : {}
    const vendors = await Vendor.find(query)
      .sort({ isHouseStock: -1, name: 1 })
      .lean()

    return NextResponse.json({
      vendors,
      total: vendors.length
    })
  } catch (error: any) {
    console.error('Error fetching vendors:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}

// POST /api/admin/vendors - Create new vendor
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)
    await connectDB()

    const body = await request.json()
    const { name, vendorCode, phone, email, notes, isActive = true, isHouseStock = false } = body

    // Validation
    if (!name || !vendorCode) {
      return NextResponse.json(
        { error: 'Name and vendor code are required' },
        { status: 400 }
      )
    }

    // Check if vendor code already exists
    const existing = await Vendor.findOne({ 
      vendorCode: vendorCode.toUpperCase() 
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Vendor code already exists' },
        { status: 400 }
      )
    }

    // Create vendor
    const vendor = new Vendor({
      name: name.trim(),
      vendorCode: vendorCode.toUpperCase().trim(),
      phone,
      email,
      notes,
      isActive,
      isHouseStock
    })

    await vendor.save()

    return NextResponse.json({
      success: true,
      vendor
    })
  } catch (error: any) {
    console.error('Error creating vendor:', error)
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    )
  }
}
