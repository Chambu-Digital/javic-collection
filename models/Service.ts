import mongoose from 'mongoose'

export interface IServiceTier {
  name: string
  description?: string
  multiplier: number // 1.0 for standard, 1.5 for express, etc.
}

export interface IService {
  _id?: string
  name: string
  slug: string
  description: string
  
  // Pricing model
  basePricePerKg: number
  additionalPricePerKm: number
  minimumChargePerShipment: number
  
  // Service configuration
  serviceType: 'standard' | 'express' | 'fragile' | 'bulk' | 'temperature-controlled'
  tiers: IServiceTier[] // e.g., Standard, Express, Premium
  
  // Capacity constraints
  maxWeight?: number
  maxDimensions?: {
    length: number
    width: number
    height: number
  }
  
  // Handling rules
  handlingRules: string[]
  requiredDocuments?: string[]
  restrictedItems?: string[]
  
  // Coverage
  availableCounties?: string[]
  depotIds?: mongoose.Types.ObjectId[]
  
  // Status
  isActive: boolean
  isFeatured?: boolean
  estimatedDeliveryDays: number
  
  rating?: number
  reviews?: number
  
  metadata?: {
    icon?: string
    color?: string
  }
  
  createdAt?: Date
  updatedAt?: Date
}

const ServiceTierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  multiplier: { type: Number, required: true, min: 0.5, max: 5 }
})

const ServiceSchema = new mongoose.Schema<IService>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },
  
  basePricePerKg: { type: Number, required: true, min: 0 },
  additionalPricePerKm: { type: Number, required: true, min: 0 },
  minimumChargePerShipment: { type: Number, default: 100, min: 0 },
  
  serviceType: {
    type: String,
    enum: ['standard', 'express', 'fragile', 'bulk', 'temperature-controlled'],
    default: 'standard'
  },
  tiers: [ServiceTierSchema],
  
  maxWeight: { type: Number, min: 0 },
  maxDimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  
  handlingRules: [{ type: String, trim: true }],
  requiredDocuments: [{ type: String, trim: true }],
  restrictedItems: [{ type: String, trim: true }],
  
  availableCounties: [{ type: String, trim: true }],
  depotIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Depot' }],
  
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  estimatedDeliveryDays: { type: Number, default: 1, min: 1 },
  
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0, min: 0 },
  
  metadata: {
    icon: String,
    color: String
  }
}, { timestamps: true })

ServiceSchema.index({ slug: 1 })
ServiceSchema.index({ serviceType: 1, isActive: 1 })
ServiceSchema.index({ isFeatured: 1, isActive: 1 })
ServiceSchema.index({ 'depotIds': 1 })

if (mongoose.models.Service) delete mongoose.models.Service

export default mongoose.model<IService>('Service', ServiceSchema)
