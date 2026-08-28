import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import Branch from '@/models/Branch'
import { requireAuth } from '@/lib/auth'
import { updateBranchStock, syncProductStockQuantity } from '@/lib/branch-inventory'
import { createLedgerEntry } from '@/lib/pos/ledger-service'
import mongoose from 'mongoose'

interface RemoveStockRequest {
  productId: string
  branchId: string
  vendorId: string
  imageIndex: number
  selectedSize?: string
  quantity: number
  notes?: string
}

// POST /api/admin/products/remove-stock - Remove stock from a specific branch
export async function POST(request: NextRequest) {
  const session = await mongoose.startSession()
  
  try {
    const user = await requireAuth(request)
    
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await connectDB()

    const body: RemoveStockRequest = await request.json()
    const { productId, branchId, vendorId, imageIndex, selectedSize, quantity, notes } = body

    // Validation
    if (!productId || !branchId || !vendorId || imageIndex === undefined || !quantity) {
      return NextResponse.json(
        { error: 'Product ID, branch ID, vendor ID, image index, and quantity are required' },
        { status: 400 }
      )
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      )
    }

    // Branch restriction for POS users
    // If user has an assigned branch and is not a manager/administrator, they can only adjust their branch
    if (user.assignedBranchId && user.posRole && 
        user.posRole !== 'manager' && user.posRole !== 'administrator' && 
        user.role !== 'super_admin') {
      if (user.assignedBranchId.toString() !== branchId) {
        return NextResponse.json(
          { error: 'You can only adjust stock for your assigned branch' },
          { status: 403 }
        )
      }
    }

    await session.withTransaction(async () => {
      // Verify product exists
      const product = await Product.findById(productId).session(session)
      if (!product) {
        throw new Error('Product not found')
      }

      // Verify branch exists and is active
      const branch = await Branch.findById(branchId).session(session)
      if (!branch) {
        throw new Error('Branch not found')
      }

      // Verify vendor exists
      const Vendor = (await import('@/models/Vendor')).default
      const vendor = await Vendor.findById(vendorId).session(session)
      if (!vendor) {
        throw new Error('Vendor not found')
      }

      // Verify image index is valid
      if (!product.images || imageIndex >= product.images.length) {
        throw new Error('Invalid image index')
      }

      const image = product.images[imageIndex]

      // If product has sizes, verify the selected size exists
      const productSizes = image.sizes || product.sizes || []
      if (productSizes.length > 0 && !selectedSize) {
        throw new Error('Size is required for this product')
      }
      if (selectedSize && !productSizes.includes(selectedSize)) {
        throw new Error('Invalid size selected')
      }

      // Check current stock
      const BranchStock = (await import('@/models/BranchStock')).default
      const query: any = { 
        branchId, 
        productId,
        vendorId,
        imageIndex 
      }
      if (selectedSize) query.selectedSize = selectedSize
      else query.selectedSize = { $exists: false }

      const branchStock = await BranchStock.findOne(query).session(session)
      
      if (!branchStock) {
        throw new Error('No stock record found for this branch and vendor')
      }

      if (branchStock.quantity < quantity) {
        throw new Error(`Insufficient stock. Available: ${branchStock.quantity}, Requested: ${quantity}`)
      }

      // Remove stock from branch
      const result = await updateBranchStock(
        branchId,
        productId,
        vendorId,
        imageIndex,
        selectedSize,
        -quantity, // Negative to remove
        session
      )

      // Sync product stockQuantity with branch totals
      await syncProductStockQuantity(productId, session)

      // Create ledger entry for audit trail
      await createLedgerEntry({
        eventType: 'inventory_removed',
        source: 'admin',
        channel: 'admin',
        userId: new mongoose.Types.ObjectId(user.id),
        userName: `${user.firstName} ${user.lastName}`,
        branchId: new mongoose.Types.ObjectId(branchId),
        branchCode: branch.branchCode,
        branchStockId: branchStock.stockIdentifier,
        productId: new mongoose.Types.ObjectId(productId),
        productName: product.name,
        variantImageUrl: image.url,
        size: selectedSize,
        quantity,
        totalMinor: 0,
        notes: notes || `Removed ${quantity} units from ${branch.name} (${vendor.name})`,
        metadata: {
          vendorId: vendorId,
          vendorCode: vendor.vendorCode,
          vendorName: vendor.name
        },
        session
      })

      console.log(`✅ Stock removed: ${quantity} units of ${product.name} from ${branch.name} (Vendor: ${vendor.name})`)
    })

    await session.endSession()

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${quantity} units from stock`
    })
  } catch (error: any) {
    await session.endSession()
    console.error('Error removing stock:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove stock' },
      { status: 500 }
    )
  }
}
