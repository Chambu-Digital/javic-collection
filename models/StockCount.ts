import mongoose from 'mongoose'

/**
 * Stock Count / Physical Inventory Reconciliation model.
 *
 * A count captures the physical quantities found in the store and compares
 * them against the system quantities that were live at the moment "Apply" was
 * pressed.  Only the Apply action changes BranchStock — the count itself is
 * read-only to inventory until that point.
 *
 * Lifecycle:
 *   in_progress  →  applied   (normal path)
 *   in_progress  →  cancelled (abandoned without applying)
 *
 * A count with status 'applied' is immutable — the adjustments have already
 * been written to BranchStock and movement history.
 */

export interface IStockCountLine {
  productId: mongoose.Types.ObjectId
  productName: string
  variantImageUrl?: string
  imageIndex: number
  selectedSize?: string
  branchStockId?: string
  stockIdentifier?: string
  /** Quantity from BranchStock at the exact moment Apply was pressed (set during apply, not at start). */
  systemQty: number
  /** Quantity entered by the counter. */
  physicalQty: number
  /** physicalQty - systemQty  (computed during apply). */
  difference: number
  /** Set by PATCH when the cashier explicitly enters a value. Apply skips lines without this flag. */
  isCounted?: boolean
  notes?: string
}

export interface IStockCount {
  _id?: string
  countRef: string
  branchId: mongoose.Types.ObjectId
  branchCode?: string
  scope: 'all' | 'category' | 'list'
  /** categoryId or list of productIds depending on scope — stored as strings. */
  scopeValue?: string[]
  status: 'in_progress' | 'applied' | 'cancelled'
  initiatedBy: mongoose.Types.ObjectId
  initiatedByName?: string
  /** Exact timestamp when Apply was executed — the defining "count time". */
  appliedAt?: Date
  appliedBy?: mongoose.Types.ObjectId
  appliedByName?: string
  notes?: string
  lines: IStockCountLine[]
  createdAt?: Date
  updatedAt?: Date
}

const StockCountLineSchema = new mongoose.Schema(
  {
    productId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName:     { type: String, required: true },
    variantImageUrl: { type: String },
    imageIndex:      { type: Number, required: true, min: 0 },
    selectedSize:    { type: String, trim: true },
    branchStockId:   { type: String },
    stockIdentifier: { type: String },
    systemQty:       { type: Number, default: 0 },      // captured at apply time
    physicalQty:     { type: Number, default: 0 },      // entered by user
    difference:      { type: Number, default: 0 },      // computed at apply time
    isCounted:       { type: Boolean, default: false },  // explicitly set by cashier via PATCH
    notes:           { type: String, trim: true },
  },
  { _id: false }
)

const StockCountSchema = new mongoose.Schema<IStockCount>(
  {
    countRef: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    branchCode: { type: String, trim: true },
    scope: {
      type: String,
      enum: ['all', 'category', 'list'],
      default: 'all',
    },
    scopeValue: [{ type: String }],
    status: {
      type: String,
      enum: ['in_progress', 'applied', 'cancelled'],
      default: 'in_progress',
      index: true,
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    initiatedByName: { type: String, trim: true },
    appliedAt:       { type: Date },
    appliedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appliedByName:   { type: String, trim: true },
    notes:           { type: String, trim: true },
    lines:           [StockCountLineSchema],
  },
  { timestamps: true }
)

StockCountSchema.index({ branchId: 1, status: 1, createdAt: -1 })

if (mongoose.models.StockCount) delete mongoose.models.StockCount
export default mongoose.model<IStockCount>('StockCount', StockCountSchema)
