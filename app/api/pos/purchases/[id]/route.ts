import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Purchase from '@/models/Purchase'
import Product from '@/models/Product'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

/**
 * GET /api/pos/purchases/[id] — fetch a single purchase with full line detail.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()
    await connectDB()
    const { id } = await params

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid purchase ID' }, { status: 400 })
    }

    const purchase = await Purchase.findById(id).lean()
    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    // Attach product image for display
    const productIds = purchase.lines.map((l: any) => l.productId)
    const products = await Product.find({ _id: { $in: productIds } })
      .select('name images price')
      .lean()
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]))

    const lines = purchase.lines.map((l: any) => {
      const product = productMap.get(l.productId.toString())
      return {
        ...l,
        productId: l.productId.toString(),
        image: product?.images?.[l.imageIndex]?.url || product?.images?.[0]?.url || null,
        variants: (product?.images || []).map((img: any) => ({
          url: img.url,
          sizes: img.sizes || product?.sizes || [],
        })),
        currentSellingPrice: product?.price,
      }
    })

    return NextResponse.json({
      purchase: {
        _id: purchase._id,
        purchaseRef: purchase.purchaseRef,
        supplierInvoiceNo: purchase.supplierInvoiceNo,
        vendorId: purchase.vendorId?.toString(),
        vendorName: purchase.vendorName,
        branchId: purchase.branchId?.toString(),
        branchCode: purchase.branchCode,
        date: purchase.date,
        paymentStatus: purchase.paymentStatus,
        paymentMethod: purchase.paymentMethod,
        notes: purchase.notes,
        status: purchase.status,
        subtotal: purchase.subtotal,
        total: purchase.total,
        lines,
        createdByName: purchase.createdByName,
        receivedAt: purchase.receivedAt,
        createdAt: purchase.createdAt,
        updatedAt: purchase.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('Error fetching purchase:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch purchase' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/pos/purchases/[id] — edit a DRAFT purchase (header + lines).
 * Received / cancelled purchases are immutable.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession()
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid purchase ID' }, { status: 400 })
    }

    const body = await request.json()
    const {
      vendorId,
      supplierInvoiceNo,
      date,
      paymentStatus,
      paymentMethod,
      notes,
      lines,
    } = body

    await session.withTransaction(async () => {
      const purchase = await Purchase.findById(id).session(session)
      if (!purchase) throw new Error('Purchase not found')
      if (purchase.status !== 'draft') {
        throw new Error('Only draft purchases can be edited')
      }

      if (vendorId && mongoose.isValidObjectId(vendorId)) {
        const Vendor = (await import('@/models/Vendor')).default
        const vendor = await Vendor.findById(vendorId).session(session).lean()
        if (!vendor || !vendor.isActive) throw new Error('Supplier is missing or inactive')
        purchase.vendorId = new mongoose.Types.ObjectId(vendorId)
        purchase.vendorName = vendor.name
      }

      if (supplierInvoiceNo !== undefined) purchase.supplierInvoiceNo = supplierInvoiceNo
      if (date) purchase.date = new Date(date)
      if (['paid', 'partial', 'unpaid'].includes(paymentStatus)) purchase.paymentStatus = paymentStatus
      if (paymentMethod !== undefined) purchase.paymentMethod = paymentMethod
      if (notes !== undefined) purchase.notes = notes

      if (Array.isArray(lines)) {
        if (lines.length === 0) throw new Error('Add at least one product line')

        const builtLines = []
        for (const line of lines) {
          if (!line.productId || !mongoose.isValidObjectId(line.productId)) {
            throw new Error('Invalid product in lines')
          }
          if (!Number.isFinite(line.quantity) || line.quantity < 1) {
            throw new Error('Quantity must be at least 1 for every line')
          }
          if (!Number.isFinite(line.unitCost) || line.unitCost < 0) {
            throw new Error('Buying price must be 0 or greater for every line')
          }
          if (line.imageIndex === undefined || line.imageIndex < 0) {
            throw new Error('Missing variant for a line')
          }
          const product = await Product.findById(line.productId).select('name images sizes').session(session).lean()
          if (!product) throw new Error(`Product not found: ${line.productId}`)
          const image = product.images?.[line.imageIndex]
          if (!image) throw new Error(`Invalid variant for ${product.name}`)
          const sizes = image.sizes || product.sizes || []
          if (sizes.length > 0 && !line.selectedSize) throw new Error(`Size is required for ${product.name}`)
          if (line.selectedSize && !sizes.includes(line.selectedSize)) {
            throw new Error(`Invalid size "${line.selectedSize}" for ${product.name}`)
          }
          builtLines.push({
            productId: new mongoose.Types.ObjectId(line.productId),
            productName: product.name,
            imageIndex: line.imageIndex,
            selectedSize: line.selectedSize || undefined,
            quantity: Number(line.quantity),
            unitCost: Number(line.unitCost),
            lineTotal: round2(Number(line.quantity) * Number(line.unitCost)),
          })
        }

        purchase.lines = builtLines as any
        purchase.subtotal = round2(builtLines.reduce((s, l) => s + l.lineTotal, 0))
        purchase.total = purchase.subtotal
      }

      await purchase.save({ session })
    })

    await session.endSession()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    await session.endSession()
    console.error('Error editing purchase:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to edit purchase' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/pos/purchases/[id] — cancel a DRAFT purchase (no stock effect).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid purchase ID' }, { status: 400 })
    }

    const purchase = await Purchase.findById(id)
    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }
    if (purchase.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft purchases can be cancelled' },
        { status: 400 }
      )
    }

    purchase.status = 'cancelled'
    await purchase.save()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error cancelling purchase:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel purchase' },
      { status: 500 }
    )
  }
}
