import mongoose from 'mongoose'

/**
 * Stock Out model.
 *
 * Records inventory removed for reasons other than normal POS sales.
 * Normal sales deduct stock automatically through the order flow.
 *
 * Reasons: damaged, expired, consumed (internal use), sample,
 *          theft/loss, supplier_return, other.
 *
 * A stock-out is immutable once created — corrections are new records.
 */

export type StockOutReason =
  | 'damaged'
  | 'expired'
  | 'consumed'
  | 'sample'
  | 'theft_loss'
  | 'supplier_return'
  | 'other'

export interface IStockOutLine {
  productId: mongoose.Types.ObjectId
  productName: string
  variantImageUrl?: string
  imageIndex: number
  selectedSize?: string
  branchStockId?: string
  quantity: number
  unitCost?: number      // FIFO cost at time of removal (informational; not enforced yet)
  lineTotal?: number
}

export interface IStockOut {
  _id?: string
  referenceNo: string
  branchId: mongoose.Types.ObjectId
  branchCode?: string
  reason: StockOutReason
  notes?: string
  /** For supplier returns — optional reference to original purchase */
  supplierRef?: string
  vendorId?: mongoose.Types.ObjectId
  vendorName?: string
  lines: IStockOutLine[]
  totalQuantity: number
  createdBy: mongoose.Types.ObjectId
  createdByName?: string
  createdAt?: Date
  updatedAt?: Date
}

const StockOutLineSchema = new mongoose.Schema(
  {
    productId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName:     { type: String, required: true },
    variantImageUrl: { type: String },
    imageIndex:      { type: Number, required: true, min: 0 },
    selectedSize:    { type: String, trim: true },
    branchStockId:   { type: String },
    quantity:        { type: Number, required: true, min: 1 },
    unitCost:        { type: Number, min: 0 },
    lineTotal:       { type: Number, min: 0 },
  },
  { _id: false }
)

const StockOutSchema = new mongoose.Schema<IStockOut>(
  {
    referenceNo: { type: String, required: true, unique: true, trim: true, index: true },
    branchId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    branchCode:  { type: String, trim: true },
    reason:      {
      type: String,
      enum: ['damaged', 'expired', 'consumed', 'sample', 'theft_loss', 'supplier_return', 'other'],
      required: true,
    },
    notes:       { type: String, trim: true },
    supplierRef: { type: String, trim: true },
    vendorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    vendorName:  { type: String, trim: true },
    lines:       [StockOutLineSchema],
    totalQuantity: { type: Number, required: true, min: 0, default: 0 },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, trim: true },
  },
  { timestamps: true }
)

StockOutSchema.index({ branchId: 1, createdAt: -1 })
StockOutSchema.index({ reason: 1, createdAt: -1 })

if (mongoose.models.StockOut) delete mongoose.models.StockOut
export default mongoose.model<IStockOut>('StockOut', StockOutSchema)
