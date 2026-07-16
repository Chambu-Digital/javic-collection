import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import CustomerCreditAccount from '@/models/CustomerCreditAccount'
import CreditTransaction from '@/models/CreditTransaction'
import User from '@/models/User'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'
import { createLedgerEntry } from '@/lib/pos/ledger-service'
import { toMinorUnits } from '@/lib/pos/money'

export async function GET(request: NextRequest) {
  try {
    await requirePosPermission(request, POS_PERMISSIONS.CUSTOMERS_VIEW)
    await connectDB()

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const search = searchParams.get('search')

    if (customerId) {
      const account = await CustomerCreditAccount.findOne({ customerId }).lean()
      const transactions = await CreditTransaction.find({ customerId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
      const customer = await User.findById(customerId).select('firstName lastName email phone').lean()
      return NextResponse.json({ account, transactions, customer })
    }

    const query: Record<string, unknown> = { creditEnabled: true }
    const accounts = await CustomerCreditAccount.find(query).limit(100).lean()

    const enriched = await Promise.all(
      accounts.map(async a => {
        const customer = await User.findById(a.customerId).select('firstName lastName phone email').lean()
        if (search) {
          const term = search.toLowerCase()
          const name = `${customer?.firstName} ${customer?.lastName}`.toLowerCase()
          if (!name.includes(term) && !customer?.phone?.includes(term)) return null
        }
        return {
          ...a,
          creditLimit: a.creditLimitMinor / 100,
          outstanding: a.outstandingBalanceMinor / 100,
          available: a.availableCreditMinor / 100,
          customer,
        }
      })
    )

    return NextResponse.json({ accounts: enriched.filter(Boolean) })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    return NextResponse.json({ error: 'Failed to fetch credit accounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requirePosPermission(request, POS_PERMISSIONS.CREDIT_ENABLE)
    await connectDB()
    const body = await request.json()
    const { customerId, creditLimit, creditEnabled, nationalId, notes } = body

    let account = await CustomerCreditAccount.findOne({ customerId })
    const limitMinor = toMinorUnits(creditLimit || 0)

    if (!account) {
      account = new CustomerCreditAccount({
        customerId,
        creditEnabled: creditEnabled ?? true,
        creditLimitMinor: limitMinor,
        outstandingBalanceMinor: 0,
        availableCreditMinor: limitMinor,
        nationalId,
        notes,
        origin: 'pos',
        createdBy: user.id,
      })
    } else {
      const prevLimit = account.creditLimitMinor
      account.creditEnabled = creditEnabled ?? account.creditEnabled
      account.creditLimitMinor = limitMinor
      account.availableCreditMinor = Math.max(0, limitMinor - account.outstandingBalanceMinor)
      if (nationalId) account.nationalId = nationalId
      if (notes) account.notes = notes

      await createLedgerEntry({
        eventType: 'credit_limit_change',
        source: 'pos',
        channel: 'pos',
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        customerId,
        totalMinor: limitMinor,
        previousValue: String(prevLimit / 100),
        newValue: String(creditLimit),
      })
    }

    await account.save()
    return NextResponse.json({ account })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    return NextResponse.json({ error: 'Failed to update credit account' }, { status: 500 })
  }
}
