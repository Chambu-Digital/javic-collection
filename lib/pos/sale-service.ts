import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import Branch from '@/models/Branch'
import Order, { IOrder, IPaymentAllocation } from '@/models/Order'
import Outlet from '@/models/Outlet'
import CustomerCreditAccount from '@/models/CustomerCreditAccount'
import CreditTransaction from '@/models/CreditTransaction'
import User from '@/models/User'
import { getVariantInfo, resolveUnitPrice } from '@/lib/pos/product-pricing'
import {
  toMinorUnits,
  fromMinorUnits,
  addMinor,
  multiplyMinor,
  applyPercentDiscountMinor,
  applyFixedDiscountMinor,
  allocateCartDiscountMinor,
} from '@/lib/pos/money'
import { createLedgerEntry } from '@/lib/pos/ledger-service'
import { createAuditEntry } from '@/lib/pos/audit-service'
import { deductBranchStock, getBranchStock } from '@/lib/branch-inventory'

export interface SaleCartItemInput {
  productId: string
  branchId: string  // Which branch's inventory to deduct from
  vendorId: string  // NEW: Which vendor's inventory to deduct from
  selectedImageIndex: number
  selectedSize?: string
  quantity: number
  lineDiscountType?: 'percent' | 'fixed'
  lineDiscountValue?: number
  priceOverride?: number
  priceOverrideReason?: string
}

export interface PaymentAllocationInput {
  method: 'cash' | 'mpesa' | 'credit'
  amount: number
  cashReceived?: number
  mpesaReference?: string
  mpesaPhone?: string
  mpesaStatus?: 'pending' | 'confirmed' | 'pending_offline'
}

export interface CompleteSaleInput {
  items: SaleCartItemInput[]
  pricingMode: 'retail' | 'wholesale'
  cartDiscountType?: 'percent' | 'fixed'
  cartDiscountValue?: number
  cartDiscountReason?: string
  customerId?: string
  customerEmail?: string
  customerPhone?: string
  customerName?: string
  paymentAllocations: PaymentAllocationInput[]
  outletId: string
  deviceId?: string
  notes?: string
  wasOffline?: boolean
  clientId?: string
  idempotencyKey?: string
  wholesaleActivatedBy?: string
  discountApprovedBy?: string
}

export interface SaleContext {
  cashierId: string
  cashierName: string
  cashierRole: string
}

function generatePosOrderNumber(): string {
  const date = new Date()
  const y = date.getFullYear().toString().slice(-2)
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  const rand = Math.floor(Math.random() * 900 + 100)
  return `POS${y}${m}${d}${rand}`
}

export async function completePosSale(
  input: CompleteSaleInput,
  ctx: SaleContext
): Promise<{ order: IOrder; receipt: Record<string, unknown> }> {
  await connectDB()
  const session = await mongoose.startSession()

  try {
    let result: { order: IOrder; receipt: Record<string, unknown> }

    await session.withTransaction(async () => {
      if (input.idempotencyKey) {
        const existing = await Order.findOne({ idempotencyKey: input.idempotencyKey }).session(session)
        if (existing) {
          result = { order: existing.toObject(), receipt: buildReceipt(existing.toObject()) }
          return
        }
      }

      const outlet = await Outlet.findById(input.outletId).session(session)
      if (!outlet || !outlet.isActive) {
        throw new SaleValidationError('Invalid or inactive outlet')
      }

      if (!input.items.length) {
        throw new SaleValidationError('Cart is empty')
      }

      const orderItems: IOrder['items'] = []
      let subtotalMinor = 0
      let totalLineDiscountMinor = 0

      for (const item of input.items) {
        const product = await Product.findById(item.productId).session(session)
        if (!product || !product.isActive) {
          throw new SaleValidationError(`Product not found: ${item.productId}`)
        }

        // Verify branch exists and is active
        const branch = await Branch.findById(item.branchId).session(session)
        if (!branch) {
          throw new SaleValidationError(`Branch not found for ${product.name}`)
        }
        if (!branch.isActive) {
          throw new SaleValidationError(`Cannot sell from inactive branch: ${branch.name}`)
        }

        // Verify vendor exists and is active
        const Vendor = mongoose.model('Vendor')
        const vendor = await Vendor.findById(item.vendorId).session(session)
        if (!vendor) {
          throw new SaleValidationError(`Vendor not found for ${product.name}`)
        }
        if (!vendor.isActive) {
          throw new SaleValidationError(`Cannot sell from inactive vendor: ${vendor.name}`)
        }

        const variant = getVariantInfo(product, item.selectedImageIndex, item.selectedSize)
        const sizes = variant.sizes
        if (sizes.length > 0 && !item.selectedSize) {
          throw new SaleValidationError(`Size required for ${product.name}`)
        }
        if (product.images.length > 1 && item.selectedImageIndex < 0) {
          throw new SaleValidationError(`Variant required for ${product.name}`)
        }

        // Check branch-specific and vendor-specific stock
        const branchStock = await getBranchStock(
          item.branchId,
          item.productId,
          item.selectedImageIndex,
          item.selectedSize,
          item.vendorId  // NEW: Include vendor
        )

        if (branchStock < item.quantity) {
          throw new SaleValidationError(
            `Insufficient stock for ${product.name} at ${branch.name}. Available: ${branchStock}`
          )
        }

        const pricing = resolveUnitPrice(variant, input.pricingMode, item.quantity)
        let unitPriceMinor = toMinorUnits(pricing.unitPrice)

        if (item.priceOverride !== undefined) {
          unitPriceMinor = toMinorUnits(item.priceOverride)
        }

        const originalUnitMinor = toMinorUnits(variant.retailPrice)
        let lineSubtotalMinor = multiplyMinor(unitPriceMinor, item.quantity)
        let lineDiscountMinor = 0

        if (item.lineDiscountType === 'percent' && item.lineDiscountValue) {
          lineDiscountMinor = lineSubtotalMinor - applyPercentDiscountMinor(lineSubtotalMinor, item.lineDiscountValue)
        } else if (item.lineDiscountType === 'fixed' && item.lineDiscountValue) {
          lineDiscountMinor = toMinorUnits(item.lineDiscountValue)
        }

        lineSubtotalMinor = Math.max(0, lineSubtotalMinor - lineDiscountMinor)
        totalLineDiscountMinor += lineDiscountMinor
        subtotalMinor += lineSubtotalMinor

        // Deduct from vendor-specific branch stock
        const stockResult = await deductBranchStock(
          item.branchId,
          item.productId,
          item.vendorId,  // NEW: Include vendor
          item.selectedImageIndex,
          item.selectedSize,
          item.quantity,
          session
        )

        orderItems.push({
          productId: product._id as any,
          productName: product.name,
          productImage: variant.image.url,
          selectedImage: variant.image.url,
          selectedImageIndex: item.selectedImageIndex,
          selectedSize: item.selectedSize,
          sku: variant.sku,
          quantity: item.quantity,
          price: fromMinorUnits(unitPriceMinor),
          retailPrice: variant.retailPrice,
          wholesalePrice: variant.wholesalePrice,
          originalPrice: fromMinorUnits(originalUnitMinor),
          lineDiscount: fromMinorUnits(lineDiscountMinor),
          pricingMode: pricing.isWholesale ? 'wholesale' : 'retail',
          totalPrice: fromMinorUnits(lineSubtotalMinor),
          // Branch tracking
          branchId: branch._id as any,
          branchCode: branch.branchCode,
          branchStockId: stockResult.stockIdentifier,
          // Vendor tracking
          vendorId: vendor._id as any,
          vendorCode: vendor.vendorCode,
        })

        // Also update product-level stock for backward compatibility
        await deductInventory(product, item.selectedImageIndex, item.quantity, item.selectedSize, session)
      }

      let cartDiscountMinor = 0
      
      // Check if cart contains items from multiple branches
      const uniqueBranches = new Set(input.items.map(item => item.branchId))
      const isMultiBranch = uniqueBranches.size > 1

      // Enforce discount rules based on branch composition
      if (isMultiBranch && (input.cartDiscountType || input.cartDiscountValue)) {
        throw new SaleValidationError(
          'General cart discount is not allowed for multi-branch carts. Please apply discounts to individual items instead.'
        )
      }

      // Apply cart discount only if single-branch cart
      if (!isMultiBranch) {
        if (input.cartDiscountType === 'percent' && input.cartDiscountValue) {
          cartDiscountMinor = subtotalMinor - applyPercentDiscountMinor(subtotalMinor, input.cartDiscountValue)
        } else if (input.cartDiscountType === 'fixed' && input.cartDiscountValue) {
          cartDiscountMinor = toMinorUnits(input.cartDiscountValue)
        }
      }
      
      cartDiscountMinor = Math.min(cartDiscountMinor, subtotalMinor)

      const totalDiscountMinor = totalLineDiscountMinor + cartDiscountMinor
      const totalMinor = subtotalMinor - cartDiscountMinor

      if (totalMinor < 0) {
        throw new SaleValidationError('Total cannot be negative')
      }

      // Distribute cart discount to line items for reporting
      for (const oi of orderItems) {
        const lineMinor = toMinorUnits(oi.totalPrice)
        const allocation = allocateCartDiscountMinor(lineMinor, subtotalMinor, cartDiscountMinor)
        oi.cartDiscountAllocation = fromMinorUnits(allocation)
        oi.totalPrice = fromMinorUnits(Math.max(0, lineMinor - allocation))
      }

      validatePayments(input.paymentAllocations, totalMinor, input.customerId)

      const creditAllocation = input.paymentAllocations
        .filter(p => p.method === 'credit')
        .reduce((s, p) => s + toMinorUnits(p.amount), 0)

      let customerOutstandingAfter: number | undefined
      if (creditAllocation > 0 && input.customerId) {
        customerOutstandingAfter = await processCreditPayment(
          input.customerId,
          creditAllocation,
          ctx,
          input.outletId,
          input.deviceId,
          input.wasOffline,
          input.clientId,
          session
        )
      }

      const paymentMethod = resolvePaymentMethod(input.paymentAllocations)
      const paymentAllocations: IPaymentAllocation[] = input.paymentAllocations.map(p => {
        const alloc: IPaymentAllocation = {
          method: p.method,
          amount: p.amount,
          status: p.mpesaStatus === 'pending_offline' ? 'pending' : 'confirmed',
          timestamp: new Date(),
        }
        if (p.method === 'cash') {
          alloc.cashReceived = p.cashReceived
          const cashMinor = toMinorUnits(p.amount)
          const receivedMinor = toMinorUnits(p.cashReceived || p.amount)
          alloc.changeGiven = fromMinorUnits(Math.max(0, receivedMinor - cashMinor))
        }
        if (p.method === 'mpesa') {
          alloc.mpesaReference = p.mpesaReference
          alloc.mpesaPhone = p.mpesaPhone
          alloc.mpesaStatus = p.mpesaStatus || 'confirmed'
        }
        return alloc
      })

      const customerEmail =
        input.customerEmail ||
        (input.customerId
          ? (await User.findById(input.customerId).session(session))?.email
          : undefined) ||
        'pos-walk-in@javic.local'

      const order = new Order({
        orderNumber: generatePosOrderNumber(),
        userId: input.customerId || undefined,
        customerEmail,
        customerPhone: input.customerPhone,
        items: orderItems,
        subtotal: fromMinorUnits(subtotalMinor),
        shippingCost: 0,
        taxAmount: 0,
        discountAmount: fromMinorUnits(totalDiscountMinor),
        totalAmount: fromMinorUnits(totalMinor),
        shippingAddress: {
          name: input.customerName || outlet.name,
          phone: input.customerPhone || outlet.phone || 'N/A',
          county: 'POS',
          area: outlet.name,
        },
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod,
        channel: 'pos',
        outletId: outlet._id,
        outletName: outlet.name,
        cashierId: ctx.cashierId,
        cashierName: ctx.cashierName,
        pricingMode: input.pricingMode,
        paymentAllocations,
        wholesaleActivatedBy: input.wholesaleActivatedBy,
        wholesaleActivatedAt: input.pricingMode === 'wholesale' ? new Date() : undefined,
        discountReason: input.cartDiscountReason,
        discountApprovedBy: input.discountApprovedBy,
        wasOffline: input.wasOffline || false,
        syncStatus: input.wasOffline ? 'pending' : 'synced',
        clientId: input.clientId,
        idempotencyKey: input.idempotencyKey,
        creditAmount: fromMinorUnits(creditAllocation),
        customerOutstandingAfter,
        customerNotes: input.notes,
      })

      await order.save({ session })

      if (creditAllocation > 0 && input.customerId) {
        await CreditTransaction.create([{
          customerId: input.customerId,
          orderId: order._id,
          orderNumber: order.orderNumber,
          type: 'credit_sale',
          amountMinor: creditAllocation,
          previousBalanceMinor: (customerOutstandingAfter || 0) * 100 - creditAllocation,
          newBalanceMinor: toMinorUnits(customerOutstandingAfter || 0),
          cashierId: ctx.cashierId,
          outletId: input.outletId,
          deviceId: input.deviceId,
          wasOffline: input.wasOffline || false,
          syncStatus: input.wasOffline ? 'pending' : 'synced',
          clientId: input.clientId ? `${input.clientId}-credit` : undefined,
        }], { session })
      }

      await createLedgerEntry({
        eventType: input.pricingMode === 'wholesale' ? 'wholesale_sale' : 'pos_sale',
        source: 'pos',
        channel: 'pos',
        outletId: outlet._id as any,
        outletName: outlet.name,
        userId: ctx.cashierId,
        userName: ctx.cashierName,
        customerId: input.customerId,
        customerName: input.customerName,
        orderId: order._id as any,
        orderNumber: order.orderNumber,
        totalMinor,
        paymentMethod,
        paymentBreakdown: paymentAllocations.map(p => ({
          method: p.method,
          amountMinor: toMinorUnits(p.amount),
          reference: p.mpesaReference,
        })),
        wasOffline: input.wasOffline || false,
        deviceId: input.deviceId,
        session,
      })

      // Create inventory removal ledger entries per branch
      for (const item of orderItems) {
        if (item.branchId) {
          await createLedgerEntry({
            eventType: 'inventory_removed',
            source: 'pos',
            channel: 'pos',
            outletId: outlet._id as any,
            outletName: outlet.name,
            branchId: item.branchId,
            branchCode: item.branchCode,
            branchStockId: item.branchStockId,
            productId: item.productId,
            productName: item.productName,
            variantImageUrl: item.selectedImage,
            size: item.selectedSize,
            quantity: item.quantity,
            totalMinor: toMinorUnits(item.totalPrice),
            orderId: order._id as any,
            orderNumber: order.orderNumber,
            wasOffline: input.wasOffline || false,
            deviceId: input.deviceId,
            session,
          })
        }
      }

      for (const alloc of paymentAllocations) {
        const eventType =
          alloc.method === 'cash' ? 'cash_payment' :
          alloc.method === 'mpesa' ? 'mpesa_payment' :
          alloc.method === 'credit' ? 'credit_issued' : 'split_payment'
        await createLedgerEntry({
          eventType: paymentAllocations.length > 1 ? 'split_payment' : eventType,
          source: 'pos',
          channel: 'pos',
          outletId: outlet._id as any,
          outletName: outlet.name,
          userId: ctx.cashierId,
          userName: ctx.cashierName,
          orderId: order._id as any,
          orderNumber: order.orderNumber,
          totalMinor: toMinorUnits(alloc.amount),
          paymentMethod: alloc.method,
          referenceNumber: alloc.mpesaReference,
          wasOffline: input.wasOffline || false,
          deviceId: input.deviceId,
          session,
        })
      }

      await createAuditEntry({
        userId: ctx.cashierId,
        userName: ctx.cashierName,
        userRole: ctx.cashierRole,
        action: 'pos_sale_completed',
        targetType: 'order',
        targetId: order._id?.toString(),
        outletId: input.outletId,
        deviceId: input.deviceId,
        newValue: order.orderNumber,
        session,
      })

      result = { order: order.toObject(), receipt: buildReceipt(order.toObject()) }
    })

    return result!
  } finally {
    session.endSession()
  }
}

async function deductInventory(
  product: InstanceType<typeof Product>,
  imageIndex: number,
  quantity: number,
  selectedSize: string | undefined,
  session: mongoose.ClientSession
) {
  const images = product.images || []
  const img = images[imageIndex]

  if (img) {
    // Per-size stock deduction — most accurate path
    if (selectedSize && img.sizeStock && img.sizeStock instanceof Map) {
      const current = (img.sizeStock.get(selectedSize) as number) ?? 0
      img.sizeStock.set(selectedSize, Math.max(0, current - quantity))
      // Recalculate image-level stock from sizeStock totals
      let total = 0
      img.sizeStock.forEach((v: number) => { total += v })
      img.stock = total
    } else if (img.stock !== undefined) {
      // Flat per-image stock
      img.stock = Math.max(0, (img.stock || 0) - quantity)
    }

    // Recalculate product-level stock as sum of all image stocks
    const allHaveStock = images.every(i => i.stock !== undefined)
    if (allHaveStock) {
      product.stockQuantity = images.reduce((s, i) => s + (i.stock || 0), 0)
    } else {
      product.stockQuantity = Math.max(0, (product.stockQuantity || 0) - quantity)
    }
  } else {
    // No image — deduct from product total directly
    product.stockQuantity = Math.max(0, (product.stockQuantity || 0) - quantity)
  }

  product.inStock = product.stockQuantity > 0
  await product.save({ session })

  await createLedgerEntry({
    eventType: 'inventory_removed',
    source: 'pos',
    channel: 'pos',
    productId: product._id as any,
    productName: product.name,
    variantImageUrl: img?.url,
    size: selectedSize,
    quantity,
    totalMinor: 0,
    session,
  })
}

async function processCreditPayment(
  customerId: string,
  creditMinor: number,
  ctx: SaleContext,
  outletId: string,
  deviceId: string | undefined,
  wasOffline: boolean | undefined,
  clientId: string | undefined,
  session: mongoose.ClientSession
): Promise<number> {
  let account = await CustomerCreditAccount.findOne({ customerId }).session(session)
  if (!account) {
    throw new SaleValidationError('Customer has no credit account')
  }
  if (!account.creditEnabled || account.status !== 'active') {
    throw new SaleValidationError('Customer credit is not enabled')
  }
  if (account.availableCreditMinor < creditMinor) {
    throw new SaleValidationError(
      `Insufficient credit. Available: ${fromMinorUnits(account.availableCreditMinor)}`
    )
  }

  account.outstandingBalanceMinor += creditMinor
  account.availableCreditMinor = Math.max(0, account.creditLimitMinor - account.outstandingBalanceMinor)
  await account.save({ session })

  return fromMinorUnits(account.outstandingBalanceMinor)
}

function validatePayments(
  allocations: PaymentAllocationInput[],
  totalMinor: number,
  customerId?: string
) {
  const validAllocations = allocations.filter(a => a.amount > 0)
  if (!validAllocations.length) {
    throw new SaleValidationError('At least one payment allocation is required')
  }

  const allocatedMinor = validAllocations.reduce((s, a) => s + toMinorUnits(a.amount), 0)
  if (allocatedMinor !== totalMinor) {
    throw new SaleValidationError(
      `Payment total (${fromMinorUnits(allocatedMinor)}) must equal order total (${fromMinorUnits(totalMinor)})`
    )
  }

  const hasCredit = validAllocations.some(a => a.method === 'credit')
  if (hasCredit && !customerId) {
    throw new SaleValidationError('Customer required for credit payment')
  }

  for (const alloc of validAllocations) {
    if (alloc.method === 'mpesa' && !alloc.mpesaReference) {
      throw new SaleValidationError('M-Pesa reference is required')
    }
    if (alloc.method === 'cash' && alloc.cashReceived !== undefined) {
      const cashMinor = toMinorUnits(alloc.amount)
      if (toMinorUnits(alloc.cashReceived) < cashMinor) {
        throw new SaleValidationError('Cash received is less than cash allocation')
      }
    }
  }
}

function resolvePaymentMethod(allocations: PaymentAllocationInput[]): IOrder['paymentMethod'] {
  const methods = [...new Set(allocations.filter(a => a.amount > 0).map(a => a.method))]
  if (methods.length > 1) return 'split'
  if (methods[0] === 'cash') return 'cash'
  if (methods[0] === 'credit') return 'credit'
  return 'mpesa'
}

function buildReceipt(order: IOrder): Record<string, unknown> {
  const cashAlloc = order.paymentAllocations?.find(p => p.method === 'cash')
  return {
    orderNumber: order.orderNumber,
    date: order.createdAt,
    outlet: order.outletName,
    cashier: order.cashierName,
    customer: order.shippingAddress?.name,
    items: order.items.map(i => ({
      name: i.productName,
      variant: i.selectedImage,
      size: i.selectedSize,
      quantity: i.quantity,
      originalPrice: i.originalPrice || i.price,
      discount: i.lineDiscount,
      price: i.price,
      total: i.totalPrice,
      pricingMode: i.pricingMode,
    })),
    subtotal: order.subtotal,
    discount: order.discountAmount,
    total: order.totalAmount,
    pricingMode: order.pricingMode,
    payments: order.paymentAllocations,
    cashReceived: cashAlloc?.cashReceived,
    change: cashAlloc?.changeGiven,
    creditAmount: order.creditAmount,
    outstandingCredit: order.customerOutstandingAfter,
  }
}

export class SaleValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SaleValidationError'
  }
}

/**
 * Check if cart contains items from multiple branches
 * Used by UI to determine if general cart discount should be disabled
 */
export function isMultiBranchCart(items: SaleCartItemInput[]): boolean {
  const uniqueBranches = new Set(items.map(item => item.branchId))
  return uniqueBranches.size > 1
}

/**
 * Get list of unique branches in cart
 */
export function getCartBranches(items: SaleCartItemInput[]): string[] {
  const uniqueBranches = new Set(items.map(item => item.branchId))
  return Array.from(uniqueBranches)
}

export { validatePayments, resolvePaymentMethod, buildReceipt }
