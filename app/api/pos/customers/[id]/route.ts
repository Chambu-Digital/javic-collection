import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import CustomerCreditAccount from '@/models/CustomerCreditAccount'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'
import { createLedgerEntry } from '@/lib/pos/ledger-service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requirePosPermission(request, POS_PERMISSIONS.CUSTOMERS_CREATE)
    await connectDB()

    const { id } = await params
    const body = await request.json() as {
      phone?: string
      email?: string
      creditEnabled?: boolean
      creditLimit?: number
    }

    // Update contact fields on the User record
    const updates: Record<string, unknown> = {}
    if (body.phone  !== undefined) updates.phone = body.phone
    if (body.email  !== undefined) updates.email = body.email.toLowerCase().trim()

    const customer = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password').lean()
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    // Handle credit account
    let credit = await CustomerCreditAccount.findOne({ customerId: id })

    if (body.creditEnabled !== undefined || body.creditLimit !== undefined) {
      // Only supervisors and above may change credit settings
      if (!user.permissions?.includes('pos.credit.enable') &&
          user.posRole !== 'supervisor' &&
          user.posRole !== 'manager' &&
          user.posRole !== 'administrator' &&
          user.role !== 'admin' &&
          user.role !== 'super_admin') {
        return NextResponse.json({ error: 'Insufficient permissions to change credit settings' }, { status: 403 })
      }

      if (!credit) {
        credit = new CustomerCreditAccount({
          customerId: id,
          creditEnabled: body.creditEnabled ?? false,
          creditLimitMinor: (body.creditLimit ?? 0) * 100,
          outstandingBalanceMinor: 0,
          availableCreditMinor: (body.creditLimit ?? 0) * 100,
          status: 'active',
        })
      } else {
        if (body.creditEnabled !== undefined) credit.creditEnabled = body.creditEnabled
        if (body.creditLimit   !== undefined) {
          const prevLimitMinor = credit.creditLimitMinor
          credit.creditLimitMinor = body.creditLimit * 100
          // Recalculate available credit based on new limit
          credit.availableCreditMinor = Math.max(
            0,
            credit.creditLimitMinor - credit.outstandingBalanceMinor
          )

          await createLedgerEntry({
            eventType: 'credit_limit_change',
            source: 'pos',
            channel: 'pos',
            userId: user.id as any,
            userName: `${user.firstName} ${user.lastName}`,
            customerId: id as any,
            customerName: `${(customer as any).firstName} ${(customer as any).lastName}`,
            previousValue: String(prevLimitMinor / 100),
            newValue: String(body.creditLimit),
            totalMinor: credit.creditLimitMinor,
            wasOffline: false,
          })
        }
      }
      await credit.save()
    }

    return NextResponse.json({
      customer: {
        id: (customer as any)._id.toString(),
        name: `${(customer as any).firstName} ${(customer as any).lastName}`,
        firstName: (customer as any).firstName,
        lastName: (customer as any).lastName,
        phone: (customer as any).phone,
        email: (customer as any).email,
        orderCount: 0, // caller can refetch if needed
        credit: credit ? {
          enabled:     credit.creditEnabled,
          limit:       credit.creditLimitMinor / 100,
          outstanding: credit.outstandingBalanceMinor / 100,
          available:   credit.availableCreditMinor / 100,
          status:      credit.status,
        } : null,
      },
    })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    console.error('[pos/customers/[id] PUT]', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}
