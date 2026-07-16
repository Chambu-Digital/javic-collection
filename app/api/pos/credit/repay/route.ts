import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import CustomerCreditAccount from '@/models/CustomerCreditAccount'
import CreditRepayment from '@/models/CreditRepayment'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'
import { createLedgerEntry } from '@/lib/pos/ledger-service'
import { toMinorUnits } from '@/lib/pos/money'

export async function POST(request: NextRequest) {
  try {
    const { user } = await requirePosPermission(request, POS_PERMISSIONS.REPAYMENTS)
    await connectDB()
    const body = await request.json()

    const {
      customerId,
      cashAmount = 0,
      mpesaAmount = 0,
      mpesaReference,
      outletId,
      notes,
      deviceId,
      clientId,
      wasOffline,
    } = body

    const totalMinor = toMinorUnits(cashAmount) + toMinorUnits(mpesaAmount)
    if (totalMinor <= 0) {
      return NextResponse.json({ error: 'Repayment amount must be positive' }, { status: 400 })
    }

    if (mpesaAmount > 0 && !mpesaReference) {
      return NextResponse.json({ error: 'M-Pesa reference required' }, { status: 400 })
    }

    if (clientId) {
      const existing = await CreditRepayment.findOne({ clientId })
      if (existing) return NextResponse.json({ repayment: existing })
    }

    const session = await mongoose.startSession()
    let repayment: InstanceType<typeof CreditRepayment>

    await session.withTransaction(async () => {
      const account = await CustomerCreditAccount.findOne({ customerId }).session(session)
      if (!account) throw new Error('Credit account not found')
      if (totalMinor > account.outstandingBalanceMinor) {
        throw new Error('Repayment exceeds outstanding balance')
      }

      const prevBalance = account.outstandingBalanceMinor
      account.outstandingBalanceMinor -= totalMinor
      account.availableCreditMinor = Math.max(
        0,
        account.creditLimitMinor - account.outstandingBalanceMinor
      )
      await account.save({ session })

      const methods: ('cash' | 'mpesa')[] = []
      if (cashAmount > 0) methods.push('cash')
      if (mpesaAmount > 0) methods.push('mpesa')

      repayment = new CreditRepayment({
        customerId,
        amountMinor: totalMinor,
        cashAmountMinor: toMinorUnits(cashAmount),
        mpesaAmountMinor: toMinorUnits(mpesaAmount),
        mpesaReference,
        previousBalanceMinor: prevBalance,
        newBalanceMinor: account.outstandingBalanceMinor,
        paymentMethods: methods,
        cashierId: user.id,
        outletId,
        notes,
        deviceId,
        wasOffline: wasOffline || false,
        syncStatus: wasOffline ? 'pending' : 'synced',
        clientId,
      })
      await repayment!.save({ session })

      await createLedgerEntry({
        eventType: 'customer_repayment',
        source: 'pos',
        channel: 'pos',
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        customerId,
        outletId,
        totalMinor,
        paymentMethod: methods.length > 1 ? 'split' : methods[0],
        paymentBreakdown: [
          ...(cashAmount > 0 ? [{ method: 'cash', amountMinor: toMinorUnits(cashAmount) }] : []),
          ...(mpesaAmount > 0 ? [{ method: 'mpesa', amountMinor: toMinorUnits(mpesaAmount), reference: mpesaReference }] : []),
        ],
        referenceNumber: repayment!.repaymentNumber,
        previousValue: String(prevBalance / 100),
        newValue: String(account.outstandingBalanceMinor / 100),
        deviceId,
        wasOffline,
      })
    })

    session.endSession()

    return NextResponse.json({
      repayment: {
        repaymentNumber: repayment!.repaymentNumber,
        amount: totalMinor / 100,
        cashAmount,
        mpesaAmount,
        previousBalance: repayment!.previousBalanceMinor / 100,
        newBalance: repayment!.newBalanceMinor / 100,
      },
    })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    const msg = error instanceof Error ? error.message : 'Failed to process repayment'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
