import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import Branch from '@/models/Branch'
import { requireAuth } from '@/lib/auth'
import { addBranchStock, syncProductStockQuantity } from '@/lib/branch-inventory'
import { recordStockMovement } from '@/lib/inventory-ledger'
import mongoose from 'mongoose'

interface AddStockRequest {
  productId: string
  branchId: string
  vendorId: string  // NEW: Required vendor
  imageIndex: number
  selectedSize?: string
  quantity: number
  notes?: string
}

// POST /api/admin/products/add-stock - Add stock to a specific branch
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

    const body: AddStockRequest = await request.json()
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

    // Branch restriction for admin users
    // You can add branch-based restrictions here if needed

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
      if (!branch.isActive) {
        throw new Error('Cannot add stock to inactive branch')
      }

      // Verify vendor exists and is active
      const Vendor = (await import('@/models/Vendor')).default
      const vendor = await Vendor.findById(vendorId).session(session)
      if (!vendor) {
        throw new Error('Vendor not found')
      }
      if (!vendor.isActive) {
        throw new Error('Cannot add stock for inactive vendor')
      }

      // NEW: Verify vendor is assigned to this branch
      const BranchVendor = (await import('@/models/BranchVendor')).default
      const isAssigned = await BranchVendor.isVendorAssignedToBranch(branchId, vendorId, true)
      if (!isAssigned) {
        throw new Error(`Vendor ${vendor.name} (${vendor.vendorCode}) is not assigned to branch ${branch.name}. Please assign the vendor to this branch first.`)
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

      // Capture previous quantity for the movement record
      const BranchStockModel = (await import('@/models/BranchStock')).default
      const prevQuery: any = { branchId, productId, vendorId, imageIndex }
      if (selectedSize) prevQuery.selectedSize = selectedSize
      else prevQuery.selectedSize = { $exists: false }
      const existingStock = await BranchStockModel.findOne(prevQuery).session(session)
      const previousQty = existingStock ? existingStock.quantity : 0

      // Add stock to branch with vendor
      const result = await addBranchStock(
        branchId,
        productId,
        vendorId,
        imageIndex,
        selectedSize,
        quantity,
        session
      )

      // Sync product stockQuantity with branch totals
      await syncProductStockQuantity(productId, session)

      // Record the inventory movement
      await recordStockMovement(
        'inventory_added',
        'admin',
        quantity,
        previousQty,
        result.newQuantity,
        {
          branchId,
          branchCode: branch.branchCode,
          branchStockId: result.stockIdentifier,
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          productId,
          productName: product.name,
          variantImageUrl: image?.url,
          size: selectedSize,
          referenceNumber: `MANUAL-ADD-${Date.now()}`,
          notes,
          metadata: {
            vendorId,
            vendorName: vendor.name,
            vendorCode: vendor.vendorCode,
            source: 'manual_add_stock',
          },
          session,
        }
      )

      console.log(`✅ Stock added: ${quantity} units of ${product.name} to ${branch.name} (Vendor: ${vendor.name})`)
    })

    await session.endSession()

    return NextResponse.json({
      success: true,
      message: `Successfully added ${quantity} units to stock`
    })
  } catch (error: any) {
    await session.endSession()
    console.error('Error adding stock:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add stock' },
      { status: 500 }
    )
  }
}
