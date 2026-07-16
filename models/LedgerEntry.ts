import mongoose from 'mongoose'

export type LedgerEventType =
  | 'inventory_added'
  | 'inventory_removed'
  | 'inventory_adjusted'
  | 'stock_transferred'
  | 'online_sale'
  | 'pos_sale'
  | 'wholesale_sale'
  | 'retail_sale'
  | 'held_order_created'
  | 'held_order_resumed'
  | 'held_order_cancelled'
  | 'order_cancelled'
  | 'return'
  | 'refund'
  | 'sale_reversed'
  | 'discount_applied'
  | 'price_override'
  | 'cash_payment'
  | 'mpesa_payment'
  | 'credit_issued'
  | 'split_payment'
  | 'customer_repayment'
  | 'credit_adjustment'
  | 'credit_limit_change'
  | 'customer_created'
  | 'customer_updated'
  | 'offline_transaction'
  | 'offline_synced'
  | 'sync_conflict'
  | 'mpesa_verification'
  | 'user_login'
  | 'admin_action'

export interface ILedgerEntry {
  _id?: string
  entryNumber: string
  eventType: LedgerEventType
  source: 'website' | 'pos' | 'admin' | 'system'
  channel?: 'online' | 'pos' | 'admin'
  outletId?: mongoose.Types.ObjectId
  outletName?: string
  userId?: mongoose.Types.ObjectId
  userName?: string
  customerId?: mongoose.Types.ObjectId
  customerName?: string
  orderId?: mongoose.Types.ObjectId
  orderNumber?: string
  productId?: mongoose.Types.ObjectId
  productName?: string
  variantImageUrl?: string
  size?: string
  quantity?: number
  debitMinor?: number
  creditMinor?: number
  totalMinor: number
  paymentMethod?: string
  paymentBreakdown?: Array<{ method: string; amountMinor: number; reference?: string }>
  referenceNumber?: string
  notes?: string
  previousValue?: string
  newValue?: string
  deviceId?: string
  wasOffline: boolean
  syncStatus: 'synced' | 'pending' | 'conflict'
  relatedEntryId?: mongoose.Types.ObjectId
  reversalOf?: mongoose.Types.ObjectId
  isReversal: boolean
  metadata?: Record<string, unknown>
  createdAt?: Date
}

const LedgerEntrySchema = new mongoose.Schema<ILedgerEntry>(
  {
    entryNumber: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    source: {
      type: String,
      enum: ['website', 'pos', 'admin', 'system'],
      required: true,
    },
    channel: { type: String, enum: ['online', 'pos', 'admin'] },
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'PosOutlet' },
    outletName: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: String,
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    orderNumber: String,
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    variantImageUrl: String,
    size: String,
    quantity: Number,
    debitMinor: Number,
    creditMinor: Number,
    totalMinor: { type: Number, required: true },
    paymentMethod: String,
    paymentBreakdown: [{
      method: String,
      amountMinor: Number,
      reference: String,
    }],
    referenceNumber: String,
    notes: String,
    previousValue: String,
    newValue: String,
    deviceId: String,
    wasOffline: { type: Boolean, default: false },
    syncStatus: {
      type: String,
      enum: ['synced', 'pending', 'conflict'],
      default: 'synced',
    },
    relatedEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'LedgerEntry' },
    reversalOf: { type: mongoose.Schema.Types.ObjectId, ref: 'LedgerEntry' },
    isReversal: { type: Boolean, default: false },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
)

LedgerEntrySchema.pre('save', async function (next) {
  if (!this.entryNumber) {
    const date = new Date()
    const stamp = date.toISOString().slice(0, 10).replace(/-/g, '')
    const last = await mongoose.model('LedgerEntry').findOne({
      entryNumber: new RegExp(`^LED${stamp}`),
    }).sort({ entryNumber: -1 })
    let seq = 1
    if (last) seq = parseInt(last.entryNumber.slice(-5)) + 1
    this.entryNumber = `LED${stamp}${seq.toString().padStart(5, '0')}`
  }
  next()
})

LedgerEntrySchema.index({ createdAt: -1 })
LedgerEntrySchema.index({ eventType: 1, createdAt: -1 })
LedgerEntrySchema.index({ orderId: 1 })
LedgerEntrySchema.index({ customerId: 1 })
LedgerEntrySchema.index({ outletId: 1 })

if (mongoose.models.LedgerEntry) delete mongoose.models.LedgerEntry
export default mongoose.model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema)
