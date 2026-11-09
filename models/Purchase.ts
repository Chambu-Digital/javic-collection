import mongoose from 'mongoose'

/**
 * Purchase / Stock-In model.
 *
 * A purchase records goods received from a supplier. Each line carries the
 * buying price per unit; the buying price history lives on these immutable
 * documents so historical cost is never overwritten when a product's current
 * buying price changes.
 *
 * Status lifecycle: draft → received (or draft → cancelled).
 *   - draft:   saved but NOT applied to stock. Editing/cancelling is allowed.
 *   - received: stock has been increased and a movement recorded. Immutable.
 *   - cancelled: a draft that was discarded. No stock effect.
 *
 * NOTE: This phase does NOT create FIFO cost batches. The purchase lines keep
 * the cost history; FIFO batch consumption + COGS is a separate phase.
 */

export interface IPurchaseLine {
  productId: mongoose.Types.ObjectId
  productName: string
  imageIndex: number
  selectedSize?: string
  quantity: number
  unitCost: number
  lineTotal: number
}

export interface IPurchase {
  _id?: string
  purchaseRef: string
  supplierInvoiceNo?: string
  vendorId: mongoose.Types.ObjectId
  vendorName?: string
  branchId: mongoose.Types.ObjectId
  branchCode?: string
  date: Date
  paymentStatus: 'paid' | 'partial' | 'unpaid'
  paymentMethod?: string
  notes?: string
  status: 'draft' | 'received' | 'cancelled'
  subtotal: number
  total: number
  lines: IPurchaseLine[]
  createdBy: mongoose.Types.ObjectId
  createdByName?: string
  receivedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

const PurchaseLineSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    imageIndex: { type: Number, required: true, min: 0 },
    selectedSize: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const PurchaseSchema = new mongoose.Schema<IPurchase>(
  {
    purchaseRef: { type: String, required: true, unique: true, trim: true, index: true },
    supplierInvoiceNo: { type: String, trim: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    vendorName: { type: String, trim: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    branchCode: { type: String, trim: true },
    date: { type: Date, required: true, default: Date.now },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partial', 'unpaid'],
      default: 'unpaid',
    },
    paymentMethod: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ['draft', 'received', 'cancelled'],
      default: 'draft',
      index: true,
    },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0, default: 0 },
    lines: [PurchaseLineSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, trim: true },
    receivedAt: { type: Date },
  },
  { timestamps: true }
)

PurchaseSchema.index({ branchId: 1, status: 1, date: -1 })
PurchaseSchema.index({ vendorId: 1, date: -1 })

if (mongoose.models.Purchase) delete mongoose.models.Purchase

export default mongoose.model<IPurchase>('Purchase', PurchaseSchema)
