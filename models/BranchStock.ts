import mongoose from 'mongoose'

export interface IBranchStock {
  _id?: string
  productId: mongoose.Types.ObjectId
  branchId: mongoose.Types.ObjectId
  vendorId: mongoose.Types.ObjectId  // NEW: Vendor who owns this stock
  imageIndex: number
  selectedSize?: string
  stockIdentifier: string  // Format: SKU-BRANCHCODE or generated identifier
  quantity: number
  createdAt?: Date
  updatedAt?: Date
}

const BranchStockSchema = new mongoose.Schema<IBranchStock>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true
    },
    imageIndex: {
      type: Number,
      required: true,
      min: 0
    },
    selectedSize: {
      type: String,
      trim: true
    },
    stockIdentifier: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  { timestamps: true }
)

// Compound indexes for efficient querying
BranchStockSchema.index({ productId: 1, branchId: 1, vendorId: 1, imageIndex: 1, selectedSize: 1 })
BranchStockSchema.index({ branchId: 1, vendorId: 1, quantity: 1 })
BranchStockSchema.index({ vendorId: 1, quantity: 1 })
BranchStockSchema.index({ stockIdentifier: 1 }, { unique: true })

// Virtual to get vendor details
BranchStockSchema.virtual('vendor', {
  ref: 'Vendor',
  localField: 'vendorId',
  foreignField: '_id',
  justOne: true
})

// Virtual to get branch details
BranchStockSchema.virtual('branch', {
  ref: 'Branch',
  localField: 'branchId',
  foreignField: '_id',
  justOne: true
})

// Virtual to get product details
BranchStockSchema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
})

// Helper method to generate stock identifier
BranchStockSchema.statics.generateStockIdentifier = function(
  sku: string | undefined,
  branchCode: string,
  imageIndex: number,
  selectedSize?: string
): string {
  const baseSku = sku || 'PROD'
  const sizeStr = selectedSize ? `-${selectedSize}` : ''
  return `${baseSku}-${branchCode}-IMG${imageIndex}${sizeStr}`.toUpperCase()
}

// Helper method to find or create branch stock
BranchStockSchema.statics.findOrCreate = async function(
  productId: mongoose.Types.ObjectId,
  branchId: mongoose.Types.ObjectId,
  vendorId: mongoose.Types.ObjectId,
  imageIndex: number,
  selectedSize: string | undefined,
  stockIdentifier: string
): Promise<mongoose.Document> {
  let branchStock = await this.findOne({
    productId,
    branchId,
    vendorId,
    imageIndex,
    selectedSize: selectedSize || { $exists: false }
  })

  if (!branchStock) {
    branchStock = new this({
      productId,
      branchId,
      vendorId,
      imageIndex,
      selectedSize,
      stockIdentifier,
      quantity: 0
    })
    await branchStock.save()
  }

  return branchStock
}

// Helper method to get total stock for a product across all branches and vendors
BranchStockSchema.statics.getTotalStock = async function(
  productId: mongoose.Types.ObjectId,
  imageIndex?: number,
  selectedSize?: string
): Promise<number> {
  const query: any = { productId }
  if (imageIndex !== undefined) query.imageIndex = imageIndex
  if (selectedSize) query.selectedSize = selectedSize

  const result = await this.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$quantity' } } }
  ])

  return result.length > 0 ? result[0].total : 0
}

// Helper method to get stock by branch (all vendors)
BranchStockSchema.statics.getStockByBranch = async function(
  productId: mongoose.Types.ObjectId,
  branchId: mongoose.Types.ObjectId,
  imageIndex?: number,
  selectedSize?: string
): Promise<number> {
  const query: any = { productId, branchId }
  if (imageIndex !== undefined) query.imageIndex = imageIndex
  if (selectedSize) query.selectedSize = selectedSize

  const result = await this.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$quantity' } } }
  ])

  return result.length > 0 ? result[0].total : 0
}

// NEW: Helper method to get stock by branch and vendor
BranchStockSchema.statics.getStockByBranchAndVendor = async function(
  productId: mongoose.Types.ObjectId,
  branchId: mongoose.Types.ObjectId,
  vendorId: mongoose.Types.ObjectId,
  imageIndex?: number,
  selectedSize?: string
): Promise<number> {
  const query: any = { productId, branchId, vendorId }
  if (imageIndex !== undefined) query.imageIndex = imageIndex
  if (selectedSize) query.selectedSize = selectedSize

  const result = await this.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$quantity' } } }
  ])

  return result.length > 0 ? result[0].total : 0
}

// Helper method to get all branch stocks for a product (grouped by branch and vendor)
BranchStockSchema.statics.getProductBranchStocks = async function(
  productId: mongoose.Types.ObjectId,
  imageIndex?: number,
  selectedSize?: string
): Promise<Array<{ 
  branchId: mongoose.Types.ObjectId
  branchCode: string
  branchName: string
  vendorId: mongoose.Types.ObjectId
  vendorCode: string
  vendorName: string
  quantity: number 
}>> {
  const query: any = { productId }
  if (imageIndex !== undefined) query.imageIndex = imageIndex
  if (selectedSize) query.selectedSize = selectedSize

  const Branch = mongoose.model('Branch')
  const Vendor = mongoose.model('Vendor')
  const stocks = await this.find(query).populate('branchId').populate('vendorId')

  return stocks.map((stock: any) => ({
    branchId: stock.branchId._id,
    branchCode: stock.branchId.branchCode,
    branchName: stock.branchId.name,
    vendorId: stock.vendorId._id,
    vendorCode: stock.vendorId.vendorCode,
    vendorName: stock.vendorId.name,
    quantity: stock.quantity
  }))
}

// Prevent negative quantities
BranchStockSchema.pre('save', function(next) {
  if (this.quantity < 0) {
    return next(new Error('Stock quantity cannot be negative'))
  }
  next()
})

if (mongoose.models.BranchStock) delete mongoose.models.BranchStock

export default mongoose.model<IBranchStock>('BranchStock', BranchStockSchema)
