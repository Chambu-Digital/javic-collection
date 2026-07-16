import { NextRequest, NextResponse } from 'next/server'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'
import { queryLedger, getLedgerSummaries } from '@/lib/pos/ledger-service'

export async function GET(request: NextRequest) {
  try {
    await requirePosPermission(request, POS_PERMISSIONS.REPORTS_OWN)
    const { searchParams } = new URL(request.url)

    const period = searchParams.get('period')
    let startDate: Date | undefined
    let endDate: Date | undefined
    const now = new Date()

    if (period === 'today') {
      startDate = new Date(now.setHours(0, 0, 0, 0))
      endDate = new Date()
    } else if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      endDate = new Date()
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date()
    } else {
      if (searchParams.get('startDate')) startDate = new Date(searchParams.get('startDate')!)
      if (searchParams.get('endDate')) endDate = new Date(searchParams.get('endDate')!)
    }

    const filters = {
      startDate,
      endDate,
      channel: searchParams.get('channel') || undefined,
      outletId: searchParams.get('outletId') || undefined,
      cashierId: searchParams.get('cashierId') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      eventType: searchParams.get('eventType') || undefined,
      paymentMethod: searchParams.get('paymentMethod') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    }

    const [ledger, summaries] = await Promise.all([
      queryLedger(filters),
      getLedgerSummaries(filters),
    ])

    return NextResponse.json({
      ...ledger,
      summaries: {
        posSales: summaries.posSalesMinor / 100,
        onlineSales: summaries.onlineSalesMinor / 100,
        cashCollected: summaries.cashCollectedMinor / 100,
        mpesaCollected: summaries.mpesaCollectedMinor / 100,
        creditIssued: summaries.creditIssuedMinor / 100,
        discounts: summaries.discountsMinor / 100,
        returns: summaries.returnsMinor / 100,
        offlineTransactions: summaries.offlineTransactions,
        syncConflicts: summaries.syncConflicts,
      },
    })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 })
  }
}
