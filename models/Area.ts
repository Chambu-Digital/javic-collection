import mongoose from 'mongoose'

export interface IArea {
  _id?: string
  name: string
  countyId: mongoose.Types.ObjectId
  countyName?: string // For easier queries
  shippingFee?: number // Area-specific shipping fee (optional - if not set, uses county default)
  estimatedDeliveryDays: number // Area-specific delivery days
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

const AreaSchema = new mongoose.Schema<IArea>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  countyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'County',
    required: true
  },
  countyName: {
    type: String,
    required: true,
    trim: true
  },
  shippingFee: {
    type: Number,
    required: false, // Optional - if not set, county default is used
    min: 0
    // No default - undefined means use county default, 0 means free shipping
  },
  estimatedDeliveryDays: {
    type: Number,
    required: true,
    min: 1,
    max: 30,
    default: 2
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Compound index to ensure unique area names within a county
AreaSchema.index({ name: 1, countyId: 1 }, { unique: true })
AreaSchema.index({ countyId: 1, isActive: 1 })
AreaSchema.index({ isActive: 1 })

// Force delete the cached model to ensure we use the new schema
if (mongoose.models.Area) {
  delete mongoose.models.Area
}

export default mongoose.model<IArea>('Area', AreaSchema)