/**
 * Branch-Aware Inventory Helper Functions
 * 
 * Provides utilities for working with branch-based inventory system
 */

import mongoose from 'mongoose'
import Product, { IProduct } from '@/models/Product'
import BranchStock from '@/models/BranchStock'
import Branch from '@/models/Branch'

export interface BranchStockInfo {
  branchId: string
  branchCode: string
  branchName: string
  vendorId: string
  vendorCode: string
  vendorName: string
  quantity: number
  isActive: boolean
  stockIdentifier: string
  imageIndex: number
  selectedSize?: string
}

export interface ProductBranchStock {
  productId: string
  imageIndex: number
  selectedSize?: string
  totalStock: number
  branchStocks: BranchStockInfo[]
  lowStockBranches: string[]
}

/**
 * Get total stock for a product across all branches
 */
export async function getTotalProductStock(
  productId: mongoose.Types.ObjectId | string,
  imageIndex?: number,
  selectedSize?: string
): Promise<number> {
  // Convert productId to ObjectId if it's a string for MongoDB queries
  const productObjectId = typeof productId === 'string' 
    ? new mongoose.Types.ObjectId(productId) 
    : productId

  const query: any = { productId: productObjectId }
  if (imageIndex !== undefined) query.imageIndex = imageIndex
  if (selectedSize) query.selectedSize = selectedSize

  const result = await BranchStock.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$quantity' } } }
  ])

  return result.length > 0 ? result[0].total : 0
}

/**
 * Get stock breakdown by branch and vendor for a product
 */
export async function getProductBranchStocks(
  productId: mongoose.Types.ObjectId | string,
  imageIndex?: number,
  selectedSize?: string
): Promise<BranchStockInfo[]> {
  // Convert productId to ObjectId if it's a string for MongoDB queries
  const productObjectId = typeof productId === 'string' 
    ? new mongoose.Types.ObjectId(productId) 
    : productId

  const query: any = { productId: productObjectId }
  if (imageIndex !== undefined) query.imageIndex = imageIndex
  if (selectedSize) query.selectedSize = selectedSize

  const stocks = await BranchStock.find(query)
    .populate('branchId')
    .populate('vendorId')
    .lean()

  return stocks.map((stock: any) => ({
    branchId: stock.branchId._id.toString(),
    branchCode: stock.branchId.branchCode,
    branchName: stock.branchId.name,
    vendorId: stock.vendorId._id.toString(),
    vendorCode: stock.vendorId.vendorCode,
    vendorName: stock.vendorId.name,
    quantity: stock.quantity,
    isActive: stock.branchId.isActive && stock.vendorId.isActive,
    stockIdentifier: stock.stockIdentifier,
    imageIndex: stock.imageIndex,
    selectedSize: stock.selectedSize
  }))
}

/**
 * Get complete product stock information with branch breakdown
 */
export async function getCompleteProductStock(
  productId: mongoose.Types.ObjectId | string,
  imageIndex?: number,
  selectedSize?: string
): Promise<ProductBranchStock> {
  const [totalStock, branchStocks] = await Promise.all([
    getTotalProductStock(productId, imageIndex, selectedSize),
    getProductBranchStocks(productId, imageIndex, selectedSize)
  ])

  // Identify low-stock branches (using threshold of 10 as default)
  const lowStockThreshold = 10
  const lowStockBranches = branchStocks
    .filter(bs => bs.quantity > 0 && bs.quantity <= lowStockThreshold)
    .map(bs => bs.branchName)

  return {
    productId: productId.toString(),
    imageIndex: imageIndex ?? 0,
    selectedSize,
    totalStock,
    branchStocks,
    lowStockBranches
  }
}

/**
 * Get stock for a specific branch and vendor
 */
export async function getBranchStock(
  branchId: mongoose.Types.ObjectId | string,
  productId: mongoose.Types.ObjectId | string,
  imageIndex: number,
  selectedSize?: string,
  vendorId?: mongoose.Types.ObjectId | string
): Promise<number> {
  const query: any = { 
    branchId, 
    productId, 
    imageIndex 
  }
  if (selectedSize) query.selectedSize = selectedSize
  if (vendorId) query.vendorId = vendorId

  // If vendorId specified, return specific vendor's stock
  if (vendorId) {
    const branchStock = await BranchStock.findOne(query)
    return branchStock ? branchStock.quantity : 0
  }

  // Otherwise, return total across all vendors at this branch
  const stocks = await BranchStock.find(query)
  return stocks.reduce((sum, stock) => sum + stock.quantity, 0)
}

/**
 * Update branch stock quantity (vendor-specific)
 */
export async function updateBranchStock(
  branchId: mongoose.Types.ObjectId | string,
  productId: mongoose.Types.ObjectId | string,
  vendorId: mongoose.Types.ObjectId | string,
  imageIndex: number,
  selectedSize: string | undefined,
  quantityChange: number,
  session?: mongoose.ClientSession
): Promise<{ success: boolean; newQuantity: number }> {
  const query: any = { 
    branchId, 
    productId,
    vendorId,
    imageIndex 
  }
  if (selectedSize) query.selectedSize = selectedSize
  else query.selectedSize = { $exists: false }

  const branchStock = await BranchStock.findOne(query).session(session || null)

  if (!branchStock) {
    // Create new branch stock record if it doesn't exist
    const product = await Product.findById(productId).session(session || null)
    const branch = await Branch.findById(branchId).session(session || null)
    const Vendor = mongoose.model('Vendor')
    const vendor = await Vendor.findById(vendorId).session(session || null)
    
    if (!product || !branch || !vendor) {
      throw new Error('Product, branch, or vendor not found')
    }

    const productSku = product.images[imageIndex]?.sku || product.sku || `PROD${productId.toString().slice(-6)}`
    const stockIdentifier = (BranchStock as any).generateStockIdentifier(
      productSku,
      branch.branchCode,
      imageIndex,
      selectedSize
    )

    const newBranchStock = new BranchStock({
      productId,
      branchId,
      vendorId,
      imageIndex,
      selectedSize,
      stockIdentifier,
      quantity: Math.max(0, quantityChange)
    })

    await newBranchStock.save({ session: session || undefined })
    return { success: true, newQuantity: newBranchStock.quantity }
  }

  // Update existing stock
  branchStock.quantity = Math.max(0, branchStock.quantity + quantityChange)
  await branchStock.save({ session: session || undefined })

  return { success: true, newQuantity: branchStock.quantity }
}

/**
 * Deduct stock from a specific branch and vendor (for sales)
 */
export async function deductBranchStock(
  branchId: mongoose.Types.ObjectId | string,
  productId: mongoose.Types.ObjectId | string,
  vendorId: mongoose.Types.ObjectId | string,
  imageIndex: number,
  selectedSize: string | undefined,
  quantity: number,
  session?: mongoose.ClientSession
): Promise<{ success: boolean; newQuantity: number; stockIdentifier: string }> {
  if (quantity <= 0) {
    throw new Error('Quantity to deduct must be positive')
  }

  const query: any = { 
    branchId, 
    productId,
    vendorId,
    imageIndex 
  }
  if (selectedSize) query.selectedSize = selectedSize
  else query.selectedSize = { $exists: false }

  const branchStock = await BranchStock.findOne(query).session(session || null)

  if (!branchStock) {
    throw new Error('Branch stock record not found for this vendor')
  }

  if (branchStock.quantity < quantity) {
    throw new Error(`Insufficient stock. Available: ${branchStock.quantity}, Required: ${quantity}`)
  }

  branchStock.quantity -= quantity
  await branchStock.save({ session: session || undefined })

  return { 
    success: true, 
    newQuantity: branchStock.quantity,
    stockIdentifier: branchStock.stockIdentifier
  }
}

/**
 * Add stock to a specific branch and vendor
 */
export async function addBranchStock(
  branchId: mongoose.Types.ObjectId | string,
  productId: mongoose.Types.ObjectId | string,
  vendorId: mongoose.Types.ObjectId | string,
  imageIndex: number,
  selectedSize: string | undefined,
  quantity: number,
  session?: mongoose.ClientSession
): Promise<{ success: boolean; newQuantity: number; stockIdentifier: string }> {
  if (quantity <= 0) {
    throw new Error('Quantity to add must be positive')
  }

  const result = await updateBranchStock(
    branchId,
    productId,
    vendorId,
    imageIndex,
    selectedSize,
    quantity,
    session
  )

  // Get the stock identifier
  const query: any = { 
    branchId, 
    productId,
    vendorId,
    imageIndex 
  }
  if (selectedSize) query.selectedSize = selectedSize
  else query.selectedSize = { $exists: false }

  const branchStock = await BranchStock.findOne(query).session(session || null)

  return {
    ...result,
    stockIdentifier: branchStock?.stockIdentifier || ''
  }
}

/**
 * Get all active vendors
 */
export async function getActiveVendors(): Promise<Array<{ _id: string; name: string; vendorCode: string; isHouseStock: boolean }>> {
  const Vendor = mongoose.model('Vendor')
  const vendors = await Vendor.find({ isActive: true }).sort({ isHouseStock: -1, name: 1 }).lean()
  
  return vendors.map((v: any) => ({
    _id: v._id.toString(),
    name: v.name,
    vendorCode: v.vendorCode,
    isHouseStock: v.isHouseStock || false
  }))
}

/**
 * Get house stock vendor
 */
export async function getHouseVendor(): Promise<{ _id: string; name: string; vendorCode: string } | null> {
  const Vendor = mongoose.model('Vendor')
  const vendor = await Vendor.findOne({ isHouseStock: true, isActive: true }).lean()
  
  if (!vendor) return null
  
  return {
    _id: vendor._id.toString(),
    name: vendor.name,
    vendorCode: vendor.vendorCode
  }
}

/**
 * Get all active branches
 */
export async function getActiveBranches(): Promise<Array<{ _id: string; name: string; branchCode: string; isMainBranch: boolean }>> {
  const branches = await Branch.find({ isActive: true }).sort({ isMainBranch: -1, name: 1 }).lean()
  
  return branches.map(b => ({
    _id: b._id.toString(),
    name: b.name,
    branchCode: b.branchCode,
    isMainBranch: b.isMainBranch || false
  }))
}

/**
 * Get main branch
 */
export async function getMainBranch(): Promise<{ _id: string; name: string; branchCode: string } | null> {
  const branch = await Branch.findOne({ isMainBranch: true, isActive: true }).lean()
  
  if (!branch) return null
  
  return {
    _id: branch._id.toString(),
    name: branch.name,
    branchCode: branch.branchCode
  }
}

/**
 * Check if branch inventory is enabled for the system
 */
export async function isBranchInventoryEnabled(): Promise<boolean> {
  const branchCount = await Branch.countDocuments({ isActive: true })
  const branchStockCount = await BranchStock.countDocuments()
  
  // Branch inventory is enabled if we have branches and branch stock records
  return branchCount > 0 && branchStockCount > 0
}

/**
 * Sync product stockQuantity with branch totals
 */
export async function syncProductStockQuantity(
  productId: mongoose.Types.ObjectId | string,
  session?: mongoose.ClientSession
): Promise<number> {
  const totalStock = await getTotalProductStock(productId)
  
  await Product.findByIdAndUpdate(
    productId,
    { 
      stockQuantity: totalStock,
      inStock: totalStock > 0,
      branchInventoryEnabled: true
    },
    { session: session || undefined }
  )
  
  return totalStock
}

/**
 * Get low-stock products by branch
 */
export async function getLowStockProductsByBranch(
  branchId?: mongoose.Types.ObjectId | string,
  threshold: number = 10
): Promise<Array<{ productId: string; productName: string; branchCode: string; quantity: number }>> {
  const query: any = { quantity: { $lte: threshold, $gt: 0 } }
  if (branchId) query.branchId = branchId

  const lowStocks = await BranchStock.find(query)
    .populate('productId', 'name')
    .populate('branchId', 'branchCode name')
    .lean()

  return lowStocks.map((stock: any) => ({
    productId: stock.productId._id.toString(),
    productName: stock.productId.name,
    branchCode: stock.branchId.branchCode,
    branchName: stock.branchId.name,
    quantity: stock.quantity
  }))
}
