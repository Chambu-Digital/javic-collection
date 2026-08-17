import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BranchStock from '@/models/BranchStock'
import Branch from '@/models/Branch'
import Vendor from '@/models/Vendor'
import { requirePosPermission, handlePosAuthError } from '@/lib/pos/auth'
import { POS_PERMISSIONS } from '@/lib/pos/permissions'

/**
 * GET /api/pos/products/vendor-stock
 * 
 * Returns available vendors and their stock for a specific product variant at a branch
 * 
 * Query params:
 * - productId: Product ID
 * - branchId: Branch ID (current POS branch context)
 * - imageIndex: Image/variant index
 * - selectedSize: (optional) Size selection
 */
export async function GET(request: NextRequest) {
  try {
    await requirePosPermission(request, POS_PERMISSIONS.SALE)
    await connectDB()

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const branchId = searchParams.get('branchId')
    const imageIndex = searchParams.get('imageIndex')
    const selectedSize = searchParams.get('selectedSize') || undefined

    if (!productId || !branchId || imageIndex === null) {
      return NextResponse.json(
        { error: 'productId, branchId, and imageIndex are required' },
        { status: 400 }
      )
    }

    const imageIdx = parseInt(imageIndex)
    if (isNaN(imageIdx) || imageIdx < 0) {
      return NextResponse.json(
        { error: 'imageIndex must be a valid non-negative number' },
        { status: 400 }
      )
    }

    // Verify branch exists and is active
    const branch = await Branch.findById(branchId)
    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }
    if (!branch.isActive) {
      return NextResponse.json(
        { error: 'Branch is inactive' },
        { status: 400 }
      )
    }

    // Build query for branch stocks
    const query: any = {
      productId,
      branchId,
      imageIndex: imageIdx,
      quantity: { $gt: 0 }  // Only show vendors with available stock
    }

    if (selectedSize) {
      query.selectedSize = selectedSize
    } else {
      query.selectedSize = { $exists: false }
    }

    // Find all vendor stocks for this variant at this branch
    const branchStocks = await BranchStock.find(query)
      .populate('vendorId')
      .lean()

    // Filter out inactive vendors and format response
    const vendorStocks = branchStocks
      .filter((stock: any) => stock.vendorId && stock.vendorId.isActive)
      .map((stock: any) => ({
        vendorId: stock.vendorId._id.toString(),
        vendorCode: stock.vendorId.vendorCode,
        vendorName: stock.vendorId.name,
        quantity: stock.quantity,
        stockIdentifier: stock.stockIdentifier,
        imageIndex: stock.imageIndex,
        selectedSize: stock.selectedSize
      }))

    // Sort by house stock first, then by quantity descending, then by name
    vendorStocks.sort((a: any, b: any) => {
      const aIsHouse = a.vendorCode === 'HOUSE' ? 0 : 1
      const bIsHouse = b.vendorCode === 'HOUSE' ? 0 : 1
      if (aIsHouse !== bIsHouse) return aIsHouse - bIsHouse
      if (b.quantity !== a.quantity) return b.quantity - a.quantity
      return a.vendorName.localeCompare(b.vendorName)
    })

    return NextResponse.json({
      vendorStocks,
      branchCode: branch.branchCode,
      branchName: branch.name
    })

  } catch (error) {
    const authErr = handlePosAuthError(error)
    if (authErr) return authErr
    
    console.error('[api/pos/products/vendor-stock] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendor stock' },
      { status: 500 }
    )
  }
}
