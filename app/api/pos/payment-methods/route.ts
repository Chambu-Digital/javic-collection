import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import POSPaymentMethod from '@/models/POSPaymentMethod'
import { requireAuth } from '@/lib/auth'

// GET /api/pos/payment-methods
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()

    // Seed defaults if none exist
    await (POSPaymentMethod as any).seedDefaults()

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')

    // Return default methods + branch-specific methods
    const methods = await POSPaymentMethod.find({
      isActive: true,
      $or: [
        { branchId: null },
        ...(branchId ? [{ branchId }] : [])
      ]
    }).sort({ isDefault: -1, createdAt: 1 })

    return NextResponse.json({ methods })

  } catch (error: any) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 })
  }
}

// POST /api/pos/payment-methods — add custom method
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { name, icon, branchId } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!icon?.trim()) {
      return NextResponse.json({ error: 'Icon is required' }, { status: 400 })
    }

    const method = await POSPaymentMethod.create({
      name: name.trim(),
      icon: icon.trim(),
      isDefault: false,
      isActive: true,
      branchId: branchId || null,
    })

    return NextResponse.json({ method })

  } catch (error: any) {
    console.error('Error creating payment method:', error)
    return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 })
  }
}
