import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'
import {
  completePosSale,
  SaleValidationError,
  CompleteSaleInput,
} from '@/lib/pos/sale-service'

export async function POST(request: NextRequest) {
  try {
    const { user, checker } = await requirePosPermission(request, POS_PERMISSIONS.SALE)
    const body = await request.json() as CompleteSaleInput

    const result = await completePosSale(body, {
      cashierId: user.id,
      cashierName: `${user.firstName} ${user.lastName}`,
      cashierRole: checker.getPosRole(),
    })

    return NextResponse.json({
      success: true,
      order: result.order,
      receipt: result.receipt,
    })
  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    if (error instanceof SaleValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('[pos/sales/complete]', error)
    return NextResponse.json({ error: 'Failed to complete sale' }, { status: 500 })
  }
}
