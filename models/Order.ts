import mongoose from 'mongoose'

export interface IOrderItem {
  _id?: string
  productId: mongoose.Types.ObjectId
  productName: string
  productImage: string
  selectedImage?: string  // which image the buyer picked from the carousel
  selectedImageIndex?: number
  selectedSize?: string   // which size the buyer picked
  sku?: string
  itemCode?: string
  quantity: number
  price: number
  retailPrice?: number
  wholesalePrice?: number
  originalPrice?: number
  lineDiscount?: number
  cartDiscountAllocation?: number
  pricingMode?: 'retail' | 'wholesale'
  totalPrice: number
  reviewed?: boolean
}

export interface IPaymentAllocation {
  method: 'cash' | 'mpesa' | 'credit' | 'card' | 'bank_transfer'
  amount: number
  cashReceived?: number
  changeGiven?: number
  mpesaReference?: string
  mpesaPhone?: string
  mpesaStatus?: 'pending' | 'confirmed' | 'failed' | 'reversed' | 'pending_offline'
  status: 'pending' | 'confirmed' | 'failed' | 'reversed'
  timestamp?: Date
}

export interface IShippingAddress {
  name: string
  phone: string
  county: string
  area: string
}

export interface IOrder {
  _id?: string
  orderNumber: string
  userId?: mongoose.Types.ObjectId
  customerEmail: string
  customerPhone?: string
  whatsapp_phone?: string

  items: IOrderItem[]

  subtotal: number
  shippingCost: number
  taxAmount: number
  discountAmount: number
  totalAmount: number

  shippingAddress: IShippingAddress
  billingAddress?: IShippingAddress

  status: 'pending' | 'completed' | 'cancelled' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'returned'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: 'mpesa' | 'card' | 'bank_transfer' | 'cash_on_delivery'

  // Review request tracking
  review_request_status: 'not_requested' | 'requested'
  review_token?: string
  review_token_created_at?: Date

  trackingNumber?: string
  shippedAt?: Date
  deliveredAt?: Date

  customerNotes?: string
  adminNotes?: string

  // POS fields (optional — online orders unaffected)
  channel?: 'online' | 'pos'
  outletId?: mongoose.Types.ObjectId
  outletName?: string
  cashierId?: mongoose.Types.ObjectId
  cashierName?: string
  deviceId?: string
  pricingMode?: 'retail' | 'wholesale'
  paymentAllocations?: IPaymentAllocation[]
  wholesaleActivatedBy?: mongoose.Types.ObjectId
  wholesaleActivatedAt?: Date
  discountReason?: string
  discountApprovedBy?: mongoose.Types.ObjectId
  wasOffline?: boolean
  syncStatus?: 'synced' | 'pending' | 'conflict'
  clientId?: string
  idempotencyKey?: string
  creditAmount?: number
  customerOutstandingAfter?: number

  createdAt?: Date
  updatedAt?: Date
}

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  selectedImage: { type: String },
  selectedImageIndex: { type: Number },
  selectedSize: { type: String },
  sku: String,
  itemCode: String,
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  retailPrice: { type: Number, min: 0 },
  wholesalePrice: { type: Number, min: 0 },
  originalPrice: { type: Number, min: 0 },
  lineDiscount: { type: Number, default: 0, min: 0 },
  cartDiscountAllocation: { type: Number, default: 0, min: 0 },
  pricingMode: { type: String, enum: ['retail', 'wholesale'] },
  totalPrice: { type: Number, required: true, min: 0 },
  reviewed: { type: Boolean, default: false }
})

const PaymentAllocationSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['cash', 'mpesa', 'credit', 'card', 'bank_transfer'],
    required: true,
  },
  amount: { type: Number, required: true, min: 0 },
  cashReceived: { type: Number, min: 0 },
  changeGiven: { type: Number, min: 0 },
  mpesaReference: String,
  mpesaPhone: String,
  mpesaStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'reversed', 'pending_offline'],
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'reversed'],
    default: 'confirmed',
  },
  timestamp: { type: Date, default: Date.now },
})

const ShippingAddressSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  county: { type: String, required: true, trim: true },
  area: { type: String, required: true, trim: true }
})

const OrderSchema = new mongoose.Schema<IOrder>({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerEmail: { type: String, required: true, lowercase: true },
  customerPhone: String,
  whatsapp_phone: { type: String, trim: true },

  items: [OrderItemSchema],

  subtotal: { type: Number, required: true, min: 0 },
  shippingCost: { type: Number, default: 0, min: 0 },
  taxAmount: { type: Number, default: 0, min: 0 },
  discountAmount: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },

  shippingAddress: { type: ShippingAddressSchema, required: true },
  billingAddress: ShippingAddressSchema,

  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'confirmed', 'processing', 'shipped', 'delivered', 'returned'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'card', 'bank_transfer', 'cash_on_delivery', 'cash', 'credit', 'split'],
    required: true
  },

  channel: { type: String, enum: ['online', 'pos'], default: 'online' },
  outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'PosOutlet' },
  outletName: String,
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cashierName: String,
  deviceId: String,
  pricingMode: { type: String, enum: ['retail', 'wholesale'], default: 'retail' },
  paymentAllocations: [PaymentAllocationSchema],
  wholesaleActivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  wholesaleActivatedAt: Date,
  discountReason: String,
  discountApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  wasOffline: { type: Boolean, default: false },
  syncStatus: { type: String, enum: ['synced', 'pending', 'conflict'], default: 'synced' },
  clientId: { type: String, sparse: true },
  idempotencyKey: { type: String, sparse: true, unique: true },
  creditAmount: { type: Number, default: 0, min: 0 },
  customerOutstandingAfter: Number,

  review_request_status: {
    type: String,
    enum: ['not_requested', 'requested'],
    default: 'not_requested'
  },
  review_token: { type: String },
  review_token_created_at: Date,

  trackingNumber: String,
  shippedAt: Date,
  deliveredAt: Date,

  customerNotes: String,
  adminNotes: String
}, { timestamps: true })

OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const lastOrder = await mongoose.model('Order').findOne({
      orderNumber: new RegExp(`^JV${year}${month}${day}`)
    }).sort({ orderNumber: -1 })
    let sequence = 1
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-3))
      sequence = lastSequence + 1
    }
    this.orderNumber = `JV${year}${month}${day}${sequence.toString().padStart(3, '0')}`
  }
  next()
})

OrderSchema.index({ userId: 1, createdAt: -1 })
OrderSchema.index({ status: 1 })
OrderSchema.index({ paymentStatus: 1 })
OrderSchema.index({ customerEmail: 1 })
OrderSchema.index({ whatsapp_phone: 1 })
OrderSchema.index({ review_token: 1 })
OrderSchema.index({ channel: 1, createdAt: -1 })
OrderSchema.index({ outletId: 1, createdAt: -1 })
OrderSchema.index({ cashierId: 1 })
OrderSchema.index({ clientId: 1 }, { sparse: true })
OrderSchema.index({ idempotencyKey: 1 }, { sparse: true })

if (mongoose.models.Order) delete mongoose.models.Order

export default mongoose.model<IOrder>('Order', OrderSchema)
