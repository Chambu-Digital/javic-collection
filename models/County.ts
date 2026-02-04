import mongoose from 'mongoose'

export interface ICounty {
  _id?: string
  name: string
  code: string // Short code like "NRB", "MSA"
  defaultShippingFee: number // Flat rate if no specific area selected
  estimatedDeliveryDays: number // Default delivery days for county
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

const CountySchema = new mongoose.Schema<ICounty>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 5
  },
  defaultShippingFee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  estimatedDeliveryDays: {
    type: Number,
    required: true,
    min: 1,
    max: 30,
    default: 3
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Index for better performance
// Note: name and code already have indexes due to unique: true
CountySchema.index({ isActive: 1 })

// Force delete the cached model to ensure we use the new schema
if (mongoose.models.County) {
  delete mongoose.models.County
}

export default mongoose.model<ICounty>('County', CountySchema)