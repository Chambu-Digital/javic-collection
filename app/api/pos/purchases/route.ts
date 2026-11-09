import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Purchase from '@/models/Purchase'
import Product from '@/models/Product'
import { requireAuth } from '@/lib/auth'
import { generatePurchaseRef, validatePurchaseForReceiving, receivePurchaseIntoStock } from '@/lib/purchases'
import mongoose from 'mongoose'

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

/**
 * POST /api/pos/purchases — create a purchase as draft or received.
 *
 * Body:
 *   branchId, vendorId, supplierInvoiceNo?, date?, paymentStatus?,
 *   paymentMethod?, notes?, status ('draft'|'received'), lines[]
 *     lines[]: { productId, imageIndex, selectedSize?, quantity, unitCost }
 */
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
      branchId,
      vendorId,
      supplierInvoiceNo,
      date,
      paymentStatus,
      paymentMethod,
      notes,
      status,
      lines,
    } = body

    // --- Basic validation ---
    if (!branchId || !vendorId) {
      return NextResponse.json({ error: 'Branch and supplier are required' }, { status: 400 })
    }
    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: 'Add at least one product line' }, { status: 400 })
    }

    for (const line of lines) {
      if (!line.productId || !mongoose.isValidObjectId(line.productId)) {
        return NextResponse.json({ error: 'Invalid product in lines' }, { status: 400 })
      }
      if (!Number.isFinite(line.quantity) || line.quantity < 1) {
        return NextResponse.json({ error: 'Quantity must be at least 1 for every line' }, { status: 400 })
      }
      if (!Number.isFinite(line.unitCost) || line.unitCost < 0) {
        return NextResponse.json({ error: 'Buying price must be 0 or greater for every line' }, { status: 400 })
      }
      if (line.imageIndex === undefined || line.imageIndex < 0) {
        return NextResponse.json({ error: 'Missing variant for a line' }, { status: 400 })
      }
    }

    // --- Resolve vendor + branch ---
    const Vendor = (await import('@/models/Vendor')).default
    const Branch = (await import('@/models/Branch')).default
    const vendor = await Vendor.findById(vendorId).lean()
    if (!vendor || !vendor.isActive) {
      return NextResponse.json({ error: 'Supplier is missing or inactive' }, { status: 400 })
    }
    const branch = await Branch.findById(branchId).lean()
    if (!branch || !branch.isActive) {
      return NextResponse.json({ error: 'Receiving branch is missing or inactive' }, { status: 400 })
    }

    // --- Build line documents (resolve product name + validate variant/size) ---
    const builtLines = []
    for (const line of lines) {
      const product = await Product.findById(line.productId).select('name images sizes').lean()
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${line.productId}` }, { status: 400 })
      }
      const image = product.images?.[line.imageIndex]
      if (!image) {
        return NextResponse.json({ error: `Invalid variant for ${product.name}` }, { status: 400 })
      }
      const sizes = image.sizes || product.sizes || []
      if (sizes.length > 0 && !line.selectedSize) {
        return NextResponse.json({ error: `Size is required for ${product.name}` }, { status: 400 })
      }
      if (line.selectedSize && !sizes.includes(line.selectedSize)) {
        return NextResponse.json({ error: `Invalid size "${line.selectedSize}" for ${product.name}` }, { status: 400 })
      }
      builtLines.push({
        productId: new mongoose.Types.ObjectId(line.productId),
        productName: product.name,
        imageIndex: line.imageIndex,
        selectedSize: line.selectedSize || undefined,
        quantity: line.quantity,
        unitCost: Number(line.unitCost),
        lineTotal: round2(Number(line.quantity) * Number(line.unitCost)),
      })
    }

    const subtotal = round2(builtLines.reduce((s, l) => s + l.lineTotal, 0))
    const wantReceived = status === 'received'

    let purchase: any

    await session.withTransaction(async () => {
      const newPurchase = new Purchase({
        purchaseRef: await generatePurchaseRef(session),
        supplierInvoiceNo,
        vendorId: new mongoose.Types.ObjectId(vendorId),
        vendorName: vendor.name,
        branchId: new mongoose.Types.ObjectId(branchId),
        branchCode: branch.branchCode,
        date: date ? new Date(date) : new Date(),
        paymentStatus: ['paid', 'partial', 'unpaid'].includes(paymentStatus) ? paymentStatus : 'unpaid',
        paymentMethod,
        notes,
        status: wantReceived ? 'received' : 'draft',
        subtotal,
        total: subtotal,
        lines: builtLines,
        createdBy: new mongoose.Types.ObjectId(user.id),
        createdByName: `${user.firstName} ${user.lastName}`,
      })

      if (wantReceived) {
        await validatePurchaseForReceiving(newPurchase, session)
        await receivePurchaseIntoStock(newPurchase, user, session)
      } else {
        await newPurchase.save({ session })
      }

      purchase = newPurchase
    })

    await session.endSession()

    return NextResponse.json({
      success: true,
      purchase: {
        _id: purchase._id,
        purchaseRef: purchase.purchaseRef,
        status: purchase.status,
      },
    })
  } catch (error: any) {
    await session.endSession()
    console.error('Error creating purchase:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create purchase' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/pos/purchases — list purchases (filtered by branch / status / search).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== 'super_admin' && (user.role !== 'admin' || !user.canAccessPOS)) {
      return NextResponse.json({ error: 'POS access required' }, { status: 403 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || ''
    const statusFilter = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const query: any = {}
    if (branchId) query.branchId = new mongoose.Types.ObjectId(branchId)
    if (['draft', 'received', 'cancelled'].includes(statusFilter)) query.status = statusFilter
    if (search) {
      query.$or = [
        { purchaseRef: { $regex: search, $options: 'i' } },
        { supplierInvoiceNo: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } },
      ]
    }

    const [purchases, total] = await Promise.all([
      Purchase.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Purchase.countDocuments(query),
    ])

    return NextResponse.json({
      purchases: purchases.map((p: any) => ({
        _id: p._id,
        purchaseRef: p.purchaseRef,
        supplierInvoiceNo: p.supplierInvoiceNo,
        vendorName: p.vendorName,
        date: p.date,
        paymentStatus: p.paymentStatus,
        paymentMethod: p.paymentMethod,
        status: p.status,
        lineCount: p.lines?.length || 0,
        totalQuantity: p.lines?.reduce((s: number, l: any) => s + l.quantity, 0) || 0,
        subtotal: p.subtotal,
        total: p.total,
        receivedAt: p.receivedAt,
        createdAt: p.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error listing purchases:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list purchases' },
      { status: 500 }
    )
  }
}
