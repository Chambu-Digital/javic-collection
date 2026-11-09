import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import BranchStock from '@/models/BranchStock'
import { requireAuth } from '@/lib/auth'
import { updateBranchStock, syncProductStockQuantity } from '@/lib/branch-inventory'
import { recordStockMovement } from '@/lib/inventory-ledger'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  const session = await mongoose.startSession()

  try {
    const user = await requireAuth(request)

    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const {
      items,
      subtotal,
      discountAmount,
      totalAmount,
      branchId,
      cashierId,
      cashierName,
      pricingMode,
      paymentAllocations,
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    if (!branchId) {
      return NextResponse.json({ error: 'Branch is required' }, { status: 400 })
    }

    if (!paymentAllocations || paymentAllocations.length === 0) {
      return NextResponse.json({ error: 'Payment details are required' }, { status: 400 })
    }

    // Generate order number
    const orderNumber = `POS-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    let order: any

    await session.withTransaction(async () => {
      // Validate and deduct stock for each item
      for (const item of items) {
        const stockQuery: any = {
          productId: new mongoose.Types.ObjectId(item.productId),
          branchId: new mongoose.Types.ObjectId(branchId),
          imageIndex: item.selectedImageIndex ?? 0,
          quantity: { $gt: 0 }
        }
        if (item.selectedSize) {
          stockQuery.selectedSize = item.selectedSize
        } else {
          stockQuery.selectedSize = { $exists: false }
        }

        const stockRecord = await BranchStock.findOne(stockQuery).session(session)

        if (!stockRecord) {
          throw new Error(`Stock not found for ${item.productName}`)
        }

        if (stockRecord.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.productName}. Available: ${stockRecord.quantity}`)
        }

        await updateBranchStock(
          branchId,
          item.productId,
          stockRecord.vendorId.toString(),
          item.selectedImageIndex ?? 0,
          item.selectedSize,
          -item.quantity,
          session
        )

        await syncProductStockQuantity(item.productId, session)

        // Record the inventory movement for this sale line
        await recordStockMovement(
          'pos_sale',
          'pos',
          item.quantity,
          stockRecord.quantity,
          stockRecord.quantity - item.quantity,
          {
            branchId,
            branchStockId: stockRecord.stockIdentifier,
            userId: cashierId || user.id,
            userName: cashierName || `${user.firstName} ${user.lastName}`,
            productId: item.productId,
            productName: item.productName,
            size: item.selectedSize,
            referenceNumber: orderNumber,
            notes: `POS sale — ${pricingMode || 'retail'}`,
            metadata: {
              vendorId: stockRecord.vendorId,
              imageIndex: item.selectedImageIndex ?? 0,
            },
            session,
          }
        )
      }

      // Determine primary payment method for the paymentMethod field
      const primaryPayment = paymentAllocations[0]
      const methodMap: Record<string, string> = {
        'Cash': 'cash',
        'M-Pesa': 'mpesa',
        'Credit': 'credit',
      }
      const paymentMethod = methodMap[primaryPayment.method] || 'cash'

      // Create order
      order = new Order({
        orderNumber,
        customerEmail: 'pos-sale@javic.co.ke',
        items: items.map((item: any) => ({
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage || '',
          selectedImageIndex: item.selectedImageIndex,
          selectedSize: item.selectedSize,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.price * item.quantity,
          pricingMode: item.pricingMode || 'retail',
          branchId,
        })),
        subtotal,
        shippingCost: 0,
        taxAmount: 0,
        discountAmount: discountAmount || 0,
        totalAmount,
        shippingAddress: {
          name: cashierName || 'POS Sale',
        },
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod,
        paymentAllocations: paymentAllocations.map((p: any) => ({
          method: methodMap[p.method] || 'cash',
          amount: p.amount,
          cashReceived: p.cashReceived,
          changeGiven: p.changeGiven,
          mpesaReference: p.mpesaReference,
          mpesaPhone: p.mpesaPhone,
          status: 'confirmed',
        })),
        channel: 'pos',
        outletId: branchId,
        cashierId,
        cashierName,
        pricingMode: pricingMode || 'retail',
        review_request_status: 'not_requested',
      })

      await order.save({ session })
    })

    await session.endSession()

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order._id,
      message: 'Sale completed successfully'
    })

  } catch (error: any) {
    await session.endSession()
    console.error('Error completing POS sale:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete sale' },
      { status: 500 }
    )
  }
}
