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
  userId: mongoose.Types.ObjectId
  customerEmail: string
  customerPhone?: string
  
  // Order items
  items: IOrderItem[]
  
  // Pricing
  subtotal: number
  shippingCost: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  
  // Addresses
  shippingAddress: IShippingAddress
  billingAddress?: IShippingAddress
  
  // Order status
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: 'mpesa' | 'card' | 'bank_transfer'
  
  // Tracking
  trackingNumber?: string
  shippedAt?: Date
  deliveredAt?: Date
  
  // Notes
  customerNotes?: string
  adminNotes?: string
  
  // Timestamps
  createdAt?: Date
  updatedAt?: Date
}

const OrderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String,
    required: true
  },
  variantId: String,
  variantDetails: {
    type: {
      type: String
    },
    value: String,
    sku: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
})

const ShippingAddressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  county: {
    type: String,
    required: true,
    trim: true
  },
  area: {
    type: String,
    required: true,
    trim: true
  }
})

const OrderSchema = new mongoose.Schema<IOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  customerPhone: String,
  
  items: [OrderItemSchema],
  
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  shippingAddress: {
    type: ShippingAddressSchema,
    required: true
  },
  billingAddress: ShippingAddressSchema,
  
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'card', 'bank_transfer'],
    required: true
  },
  
  trackingNumber: String,
  shippedAt: Date,
  deliveredAt: Date,
  
  customerNotes: String,
  adminNotes: String
}, {
  timestamps: true
})

// Generate order number before saving
OrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    
    // Find the last order of the day
    const lastOrder = await mongoose.model('Order').findOne({
      orderNumber: new RegExp(`^SN${year}${month}${day}`)
    }).sort({ orderNumber: -1 })
    
    let sequence = 1
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-3))
      sequence = lastSequence + 1
    }
    
    this.orderNumber = `SN${year}${month}${day}${sequence.toString().padStart(3, '0')}`
  }
  next()
})

// Indexes for better performance
// Note: orderNumber already has an index due to unique: true
OrderSchema.index({ userId: 1, createdAt: -1 })
OrderSchema.index({ status: 1 })
OrderSchema.index({ paymentStatus: 1 })
OrderSchema.index({ customerEmail: 1 })

// Force delete the cached model to ensure we use the new schema
if (mongoose.models.Order) {
  delete mongoose.models.Order
}

export default mongoose.model<IOrder>('Order', OrderSchema)