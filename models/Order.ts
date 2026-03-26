import mongoose from 'mongoose'

export interface IOrderItem {
  _id?: string
  productId: mongoose.Types.ObjectId
  productName: string
  productImage: string
  variantId?: string
  variantDetails?: {
    type: string
    value: string
    sku: string
  }
  quantity: number
  price: number
  totalPrice: number
  reviewed?: boolean
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

  createdAt?: Date
  updatedAt?: Date
}

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  variantId: String,
  variantDetails: { type: { type: String }, value: String, sku: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  reviewed: { type: Boolean, default: false }
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
    enum: ['mpesa', 'card', 'bank_transfer', 'cash_on_delivery'],
    required: true
  },

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

if (mongoose.models.Order) delete mongoose.models.Order

export default mongoose.model<IOrder>('Order', OrderSchema)
