import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Order from '@/models/Order'
import CustomerCreditAccount from '@/models/CustomerCreditAccount'
import CreditRepayment from '@/models/CreditRepayment'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'

export async function GET(request: NextRequest) {
  try {
    await requirePosPermission(request, POS_PERMISSIONS.CUSTOMERS_VIEW)
    await connectDB()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim()
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const query: Record<string, unknown> = { role: 'customer', isActive: true }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit
    const [customers, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ])

    const enriched = await Promise.all(
      customers.map(async c => {
        const credit = await CustomerCreditAccount.findOne({ customerId: c._id }).lean()
        const orderCount = await Order.countDocuments({
          $or: [{ userId: c._id }, { customerEmail: c.email }],
        })
        return {
          id: c._id,
          firstName: c.firstName,
          lastName: c.lastName,
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
          phone: c.phone,
          orderCount,
          credit: credit
            ? {
                enabled: credit.creditEnabled,
                limit: credit.creditLimitMinor / 100,
                outstanding: credit.outstandingBalanceMinor / 100,
                available: credit.availableCreditMinor / 100,
                status: credit.status,
              }
            : null,
        }
      })
    )

    return NextResponse.json({ customers: enriched, total, page })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    return NextResponse.json({ error: 'Failed to search customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requirePosPermission(request, POS_PERMISSIONS.CUSTOMERS_CREATE)
    await connectDB()
    const body = await request.json()

    const existing = await User.findOne({
      $or: [
        { email: body.email?.toLowerCase() },
        ...(body.phone ? [{ phone: body.phone }] : []),
      ],
      role: 'customer',
    })
    if (existing) {
      return NextResponse.json(
        { error: 'A matching customer already exists', customer: existing },
        { status: 409 }
      )
    }

    const customer = new User({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      role: 'customer',
      isActive: true,
      isApproved: true,
      isEmailVerified: false,
      provider: 'local',
      password: `pos-${Date.now()}`,
    })
    await customer.save()

    return NextResponse.json({
      customer: {
        id: customer._id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone,
      },
    }, { status: 201 })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
