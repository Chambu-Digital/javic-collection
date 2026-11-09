import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import { requireAuth } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import mongoose from 'mongoose'

/**
 * POST /api/pos/inventory/bulk-edit
 *
 * Apply a set of catalog field updates to multiple products at once. Only the
 * fields present in `updates` are written; every other field is left
 * untouched. Quantity is intentionally NOT editable here — stock changes go
 * through Stock In / Stock Count / Stock Out so the movement history stays
 * accurate.
 *
 * Body:
 *   productIds: string[]            (one or more)
 *   updates: {
 *     name?: string
 *     categoryId?: string           (sets both categoryId + category name)
 *     buyingPrice?: number
 *     price?: number                (selling price)
 *     barcode?: string              (unique — single product only when non-empty)
 *     lowStockThreshold?: number
 *     isActive?: boolean
 *   }
 */
export async function POST(request: NextRequest) {
  const session = await mongoose.startSession()

  try {
    const user = await requireAuth(request)

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { productIds, updates = {} } = body

    // --- Validate product selection ---
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Select at least one product to edit' },
        { status: 400 }
      )
    }

    // --- Validate that at least one editable field was supplied ---
    const allowedFields = [
      'name',
      'categoryId',
      'buyingPrice',
      'price',
      'barcode',
      'lowStockThreshold',
      'isActive',
    ] as const
    const supplied = Object.keys(updates).filter((k) =>
      (allowedFields as readonly string[]).includes(k)
    )

    if (supplied.length === 0) {
      return NextResponse.json(
        { error: 'No fields selected to update' },
        { status: 400 }
      )
    }

    // --- Build the $set / $unset objects with per-field validation ---
    const setObj: Record<string, unknown> = {}
    const unsetObj: Record<string, string> = {}

    if (supplied.includes('name')) {
      const name = String(updates.name ?? '').trim()
      if (!name) {
        return NextResponse.json({ error: 'Product name cannot be empty' }, { status: 400 })
      }
      setObj.name = name
    }

    if (supplied.includes('price')) {
      const price = Number(updates.price)
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ error: 'Selling price must be greater than 0' }, { status: 400 })
      }
      setObj.price = price
    }

    if (supplied.includes('buyingPrice')) {
      const buyingPrice = Number(updates.buyingPrice)
      if (!Number.isFinite(buyingPrice) || buyingPrice < 0) {
        return NextResponse.json({ error: 'Buying price must be 0 or greater' }, { status: 400 })
      }
      setObj.buyingPrice = buyingPrice
    }

    if (supplied.includes('lowStockThreshold')) {
      const threshold = Number(updates.lowStockThreshold)
      if (!Number.isFinite(threshold) || threshold < 0) {
        return NextResponse.json({ error: 'Minimum stock level must be 0 or greater' }, { status: 400 })
      }
      setObj.lowStockThreshold = threshold
    }

    if (supplied.includes('isActive')) {
      setObj.isActive = Boolean(updates.isActive)
    }

    if (supplied.includes('categoryId')) {
      const categoryId = String(updates.categoryId ?? '')
      if (!mongoose.isValidObjectId(categoryId)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
      }
      const Category = (await import('@/models/Category')).default
      const category = await Category.findById(categoryId).lean()
      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 400 })
      }
      // Keep the denormalized name + id in sync (Product stores both)
      setObj.categoryId = category._id
      setObj.category = category.name
    }

    // --- Barcode: unique field, special handling ---
    if (supplied.includes('barcode')) {
      const barcode = String(updates.barcode ?? '').trim()
      if (barcode === '') {
        // Clearing barcodes is allowed in bulk (sparse index skips missing)
        unsetObj.barcode = ''
      } else {
        // A single barcode can't belong to multiple products
        if (productIds.length > 1) {
          return NextResponse.json(
            {
              error:
                'A barcode must be unique. It can only be applied to one product at a time — edit barcodes individually.',
            },
            { status: 400 }
          )
        }
        // Ensure no other product already uses it
        const existing = await Product.findOne({
          barcode,
          _id: { $ne: new mongoose.Types.ObjectId(productIds[0]) },
        }).lean()
        if (existing) {
          return NextResponse.json(
            { error: `Barcode "${barcode}" is already in use by "${existing.name}"` },
            { status: 400 }
          )
        }
        setObj.barcode = barcode
      }
    }

    const ids = productIds.map((id: string) => new mongoose.Types.ObjectId(id))

    let matchedCount = 0

    await session.withTransaction(async () => {
      // Snapshot before values for the audit trail
      const before = await Product.find({ _id: { $in: ids } })
        .session(session)
        .select('name price buyingPrice barcode lowStockThreshold isActive category categoryId')
        .lean()

      const updateQuery: any = {}
      if (Object.keys(setObj).length > 0) updateQuery.$set = setObj
      if (Object.keys(unsetObj).length > 0) updateQuery.$unset = unsetObj

      if (Object.keys(updateQuery).length === 0) {
        throw new Error('Nothing to update')
      }

      const result = await Product.updateMany(
        { _id: { $in: ids } },
        updateQuery,
        { session }
      )
      matchedCount = result.matchedCount || 0

      // Audit log capturing who changed what across which products
      await createAuditLog({
        action: 'admin_action',
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role,
        targetRecordType: 'Product',
        previousValue: JSON.stringify(
          before.map((p: any) => ({
            _id: p._id.toString(),
            name: p.name,
            price: p.price,
            buyingPrice: p.buyingPrice,
            barcode: p.barcode,
            lowStockThreshold: p.lowStockThreshold,
            isActive: p.isActive,
            category: p.category,
          }))
        ),
        newValue: JSON.stringify({ set: setObj, unset: Object.keys(unsetObj) }),
        reason: `Bulk edit of ${productIds.length} product(s)`,
        metadata: {
          productIds: productIds,
          fieldsChanged: supplied,
        },
        session,
      })
    })

    await session.endSession()

    return NextResponse.json({
      success: true,
      message: `Updated ${matchedCount} product(s)`,
      updated: matchedCount,
    })
  } catch (error: any) {
    await session.endSession()
    console.error('Error in bulk edit:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to apply bulk edit' },
      { status: 500 }
    )
  }
}
