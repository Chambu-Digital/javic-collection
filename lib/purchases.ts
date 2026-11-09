/**
 * Purchase / Stock-In helpers.
 *
 * generatePurchaseRef  — sequential, human-readable purchase reference.
 * receivePurchaseIntoStock — applies a draft purchase to BranchStock and
 *                            records the movement history. Only callable on a
 *                            draft; flips it to 'received'.
 */

import mongoose from 'mongoose'
import Purchase from '@/models/Purchase'
import Product from '@/models/Product'
import Branch from '@/models/Branch'
import { addBranchStock, syncProductStockQuantity } from '@/lib/branch-inventory'
import { recordStockMovement } from '@/lib/inventory-ledger'

/**
 * Generate a sequential purchase reference: PUR-YYYYMMDD-NNN
 */
export async function generatePurchaseRef(
  session?: mongoose.ClientSession
): Promise<string> {
  const date = new Date()
  const stamp =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0')

  const last = await Purchase.findOne(
    { purchaseRef: new RegExp(`^PUR-${stamp}`) },
    { purchaseRef: 1 },
    { session: session || undefined }
  ).sort({ purchaseRef: -1 })

  let seq = 1
  if (last) {
    const m = last.purchaseRef.match(/(\d+)$/)
    if (m) seq = parseInt(m[1], 10) + 1
  }

  return `PUR-${stamp}-${String(seq).padStart(3, '0')}`
}

/**
 * Validate that a purchase's lines are still consistent with the catalog and
 * that the vendor is assigned to the branch. Throws on any problem.
 */
export async function validatePurchaseForReceiving(
  purchase: any,
  session?: mongoose.ClientSession
): Promise<void> {
  const Vendor = mongoose.model('Vendor')
  const BranchVendor = mongoose.model('BranchVendor')

  const vendor = await Vendor.findById(purchase.vendorId).session(session || null)
  if (!vendor || !vendor.isActive) {
    throw new Error('Supplier is missing or inactive')
  }

  const isAssigned = await BranchVendor.isVendorAssignedToBranch(
    purchase.branchId,
    purchase.vendorId,
    true
  )
  if (!isAssigned) {
    throw new Error(
      `Supplier "${vendor.name}" is not assigned to this branch. Assign the supplier to the branch first.`
    )
  }

  const branch = await Branch.findById(purchase.branchId).session(session || null)
  if (!branch || !branch.isActive) {
    throw new Error('Receiving branch is missing or inactive')
  }

  for (const line of purchase.lines) {
    const product = await Product.findById(line.productId).session(session || null)
    if (!product) {
      throw new Error(`Product not found: ${line.productName}`)
    }
    if (line.imageIndex >= (product.images?.length || 0)) {
      throw new Error(`Invalid variant for ${product.name}`)
    }
    const image = product.images[line.imageIndex]
    const sizes = image.sizes || product.sizes || []
    if (sizes.length > 0 && !line.selectedSize) {
      throw new Error(`Size is required for ${product.name}`)
    }
    if (line.selectedSize && !sizes.includes(line.selectedSize)) {
      throw new Error(`Invalid size "${line.selectedSize}" for ${product.name}`)
    }
  }
}

/**
 * Apply a draft purchase to inventory: increase BranchStock for every line,
 * update each product's current buying price to the latest unit cost, sync the
 * aggregate stock quantity, record an inventory movement, and mark the
 * purchase as received. Must run inside a transaction.
 */
export async function receivePurchaseIntoStock(
  purchase: any,
  user: { id: string; firstName: string; lastName: string },
  session?: mongoose.ClientSession
): Promise<void> {
  if (purchase.status === 'received') {
    throw new Error('This purchase has already been received')
  }

  const Vendor = mongoose.model('Vendor')
  const vendor = await Vendor.findById(purchase.vendorId).session(session || null)
  const branch = await Branch.findById(purchase.branchId).session(session || null)

  for (const line of purchase.lines) {
    const product = await Product.findById(line.productId).session(session || null)
    if (!product) throw new Error(`Product not found: ${line.productName}`)

    const result = await addBranchStock(
      purchase.branchId,
      line.productId,
      purchase.vendorId,
      line.imageIndex,
      line.selectedSize,
      line.quantity,
      session
    )

    const previousQty = result.newQuantity - line.quantity

    // Update the product's current buying price to the latest unit cost.
    // This does NOT overwrite historical purchase prices — those live on the
    // immutable Purchase documents.
    if (line.unitCost > 0) {
      await Product.findByIdAndUpdate(
        line.productId,
        { buyingPrice: line.unitCost },
        { session: session || undefined }
      )
    }

    await syncProductStockQuantity(line.productId, session)

    await recordStockMovement(
      'inventory_added',
      'pos',
      line.quantity,
      previousQty,
      result.newQuantity,
      {
        branchId: purchase.branchId,
        branchCode: branch?.branchCode,
        branchStockId: result.stockIdentifier,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        productId: line.productId,
        productName: line.productName,
        variantImageUrl: product.images?.[line.imageIndex]?.url,
        size: line.selectedSize,
        referenceNumber: purchase.purchaseRef,
        notes: `Stock In — ${vendor?.name || ''}`,
        metadata: {
          vendorId: purchase.vendorId,
          vendorName: vendor?.name,
          vendorCode: vendor?.vendorCode,
          unitCost: line.unitCost,
          source: 'purchase',
        },
        session,
      }
    )
  }

  purchase.status = 'received'
  purchase.receivedAt = new Date()
  await purchase.save({ session: session || undefined })
}
