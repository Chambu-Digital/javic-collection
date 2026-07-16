import mongoose from 'mongoose'

export interface IHeldOrder {
  holdId: string
  items: Array<{
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
    actualUnitPrice: number
    lineTotalMinor: number
    pricingMode: 'retail' | 'wholesale'
  }>
  pricingMode: 'retail' | 'wholesale'
  cartDiscountType?: 'percent' | 'fixed'
  cartDiscountValue?: number
  cartDiscountReason?: string
  subtotalMinor: number
  discountMinor: number
  totalMinor: number
  customer?: {
    id: mongoose.Types.ObjectId
    name: string
    phone?: string
  }
  notes?: string
  cashierId: mongoose.Types.ObjectId
  cashierName: string
  outlet?: string
  holdReason?: string
  deviceId?: string
  wasOffline: boolean
  createdAt: Date
  expiresAt?: Date
}

const HeldOrderSchema = new mongoose.Schema<IHeldOrder>({
  holdId: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    itemCode: String,
    sku: String,
    selectedImageIndex: {
      type: Number,
      required: true
    },
    selectedImageUrl: {
      type: String,
      required: true
    },
    selectedSize: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    retailUnitPrice: {
      type: Number,
      required: true
    },
    wholesaleUnitPrice: Number,
    actualUnitPrice: {
      type: Number,
      required: true
    },
    lineTotalMinor: {
      type: Number,
      required: true
    },
    pricingMode: {
      type: String,
      enum: ['retail', 'wholesale'],
      required: true
    }
  }],
  pricingMode: {
    type: String,
    enum: ['retail', 'wholesale'],
    required: true
  },
  cartDiscountType: {
    type: String,
    enum: ['percent', 'fixed']
  },
  cartDiscountValue: Number,
  cartDiscountReason: String,
  subtotalMinor: {
    type: Number,
    required: true
  },
  discountMinor: {
    type: Number,
    default: 0
  },
  totalMinor: {
    type: Number,
    required: true
  },
  customer: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    phone: String
  },
  notes: String,
  cashierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cashierName: {
    type: String,
    required: true
  },
  outlet: String,
  holdReason: String,
  deviceId: String,
  wasOffline: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }
})

// Auto-generate hold ID if not provided
HeldOrderSchema.pre('save', function(next) {
  if (!this.holdId) {
    const date = new Date()
    const stamp = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    this.holdId = `HLD${stamp}${random}`
  }
  next()
})

// Index for queries
HeldOrderSchema.index({ holdId: 1 })
HeldOrderSchema.index({ cashierId: 1, createdAt: -1 })
HeldOrderSchema.index({ 'customer.id': 1 })
HeldOrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const HeldOrder = mongoose.models.HeldOrder || mongoose.model<IHeldOrder>('HeldOrder', HeldOrderSchema)

export default HeldOrder
