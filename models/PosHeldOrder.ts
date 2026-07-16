import mongoose from 'mongoose'

export interface IPosHeldOrderItem {
  productId: mongoose.Types.ObjectId
  productName: string
  itemCode?: string
  sku?: string
  selectedImageIndex: number
  selectedImageUrl: string
  selectedSize?: string
  quantity: number
  retailUnitPrice: number
  wholesaleUnitPrice?: number
  originalUnitPrice: number
  actualUnitPrice: number
  lineDiscountMinor: number
  lineSubtotalMinor: number
  lineTotalMinor: number
  pricingMode: 'retail' | 'wholesale'
  addedBy: mongoose.Types.ObjectId
  addedAt: Date
}

export interface IPosHeldOrder {
  _id?: string
  holdNumber: string
  items: IPosHeldOrderItem[]
  pricingMode: 'retail' | 'wholesale'
  cartDiscountType?: 'percent' | 'fixed'
  cartDiscountValue?: number
  cartDiscountMinor: number
  cartDiscountReason?: string
  customerId?: mongoose.Types.ObjectId
  customerName?: string
  customerPhone?: string
  notes?: string
  holdReason?: string
  subtotalMinor: number
  totalDiscountMinor: number
  totalMinor: number
  cashierId: mongoose.Types.ObjectId
  cashierName: string
  outletId: mongoose.Types.ObjectId
  outletName: string
  deviceId?: string
  wasOffline: boolean
  clientId?: string
  status: 'held' | 'resumed' | 'cancelled' | 'expired'
  resumedAt?: Date
  cancelledAt?: Date
  cancelledBy?: mongoose.Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const PosHeldOrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  itemCode: String,
  sku: String,
  selectedImageIndex: { type: Number, default: 0 },
  selectedImageUrl: { type: String, required: true },
  selectedSize: String,
  quantity: { type: Number, required: true, min: 1 },
  retailUnitPrice: { type: Number, required: true },
  wholesaleUnitPrice: Number,
  originalUnitPrice: { type: Number, required: true },
  actualUnitPrice: { type: Number, required: true },
  lineDiscountMinor: { type: Number, default: 0 },
  lineSubtotalMinor: { type: Number, required: true },
  lineTotalMinor: { type: Number, required: true },
  pricingMode: { type: String, enum: ['retail', 'wholesale'], default: 'retail' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  addedAt: { type: Date, default: Date.now },
})

const PosHeldOrderSchema = new mongoose.Schema<IPosHeldOrder>(
  {
    holdNumber: { type: String, required: true, unique: true },
    items: [PosHeldOrderItemSchema],
    pricingMode: { type: String, enum: ['retail', 'wholesale'], default: 'retail' },
    cartDiscountType: { type: String, enum: ['percent', 'fixed'] },
    cartDiscountValue: Number,
    cartDiscountMinor: { type: Number, default: 0 },
    cartDiscountReason: String,
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: String,
    customerPhone: String,
    notes: String,
    holdReason: String,
    subtotalMinor: { type: Number, required: true },
    totalDiscountMinor: { type: Number, default: 0 },
    totalMinor: { type: Number, required: true },
    cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cashierName: { type: String, required: true },
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'PosOutlet', required: true },
    outletName: { type: String, required: true },
    deviceId: String,
    wasOffline: { type: Boolean, default: false },
    clientId: String,
    status: {
      type: String,
      enum: ['held', 'resumed', 'cancelled', 'expired'],
      default: 'held',
    },
    resumedAt: Date,
    cancelledAt: Date,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

PosHeldOrderSchema.pre('save', async function (next) {
  if (!this.holdNumber) {
    const date = new Date()
    const stamp = date.toISOString().slice(0, 10).replace(/-/g, '')
    const last = await mongoose.model('PosHeldOrder').findOne({
      holdNumber: new RegExp(`^HLD${stamp}`),
    }).sort({ holdNumber: -1 })
    let seq = 1
    if (last) seq = parseInt(last.holdNumber.slice(-4)) + 1
    this.holdNumber = `HLD${stamp}${seq.toString().padStart(4, '0')}`
  }
  next()
})

PosHeldOrderSchema.index({ status: 1, createdAt: -1 })
PosHeldOrderSchema.index({ cashierId: 1 })
PosHeldOrderSchema.index({ customerId: 1 })

if (mongoose.models.PosHeldOrder) delete mongoose.models.PosHeldOrder
export default mongoose.model<IPosHeldOrder>('PosHeldOrder', PosHeldOrderSchema)
