import mongoose from 'mongoose'

export interface IWeightBracket {
  minWeight: number
  maxWeight: number
  pricePerKg: number
}

export interface IDistanceBracket {
  minDistance: number
  maxDistance: number
  pricePerKm: number
}

export interface ISurcharge {
  name: string
  type: 'fragile' | 'oversized' | 'temperature-controlled' | 'hazmat' | 'perishable' | 'other'
  amount: number
  description?: string
}

export interface IRateCard {
  _id?: string
  name: string
  serviceId: mongoose.Types.ObjectId
  serviceType: string
  tierName?: string // e.g., "Express", "Standard", "Premium"
  
  // Weight-based pricing
  weightBrackets: IWeightBracket[]
  
  // Distance-based pricing
  distanceBrackets: IDistanceBracket[]
  
  // Surcharges
  surcharges: ISurcharge[]
  
  // Minimum charges
  minimumChargePerShipment: number
  minimumChargePerKg?: number
  
  // Regional restrictions
  applicableCounties?: string[]
  applicableDepots?: mongoose.Types.ObjectId[]
  
  // Validity
  effectiveFrom: Date
  effectiveUntil?: Date
  
  // Status
  isActive: boolean
  
  // Metadata
  notes?: string
  createdBy?: mongoose.Types.ObjectId
  
  createdAt?: Date
  updatedAt?: Date
}

const WeightBracketSchema = new mongoose.Schema({
  minWeight: { type: Number, required: true, min: 0 },
  maxWeight: { type: Number, required: true, min: 0 },
  pricePerKg: { type: Number, required: true, min: 0 }
}, { _id: false })

const DistanceBracketSchema = new mongoose.Schema({
  minDistance: { type: Number, required: true, min: 0 },
  maxDistance: { type: Number, required: true, min: 0 },
  pricePerKm: { type: Number, required: true, min: 0 }
}, { _id: false })

const SurchargeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['fragile', 'oversized', 'temperature-controlled', 'hazmat', 'perishable', 'other'],
    required: true
  },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, trim: true }
}, { _id: false })

const RateCardSchema = new mongoose.Schema<IRateCard>({
  name: { type: String, required: true, trim: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  serviceType: { type: String, required: true },
  tierName: { type: String, trim: true },
  
  weightBrackets: [WeightBracketSchema],
  distanceBrackets: [DistanceBracketSchema],
  surcharges: [SurchargeSchema],
  
  minimumChargePerShipment: { type: Number, required: true, min: 0 },
  minimumChargePerKg: { type: Number, min: 0 },
  
  applicableCounties: [{ type: String, trim: true }],
  applicableDepots: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Depot' }],
  
  effectiveFrom: { type: Date, required: true, default: Date.now },
  effectiveUntil: Date,
  
  isActive: { type: Boolean, default: true },
  
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

// Validate weight and distance brackets
RateCardSchema.pre('save', function(next) {
  // Validate weight brackets
  const sortedWeights = [...this.weightBrackets].sort((a, b) => a.minWeight - b.minWeight)
  for (let i = 0; i < sortedWeights.length; i++) {
    if (sortedWeights[i].minWeight >= sortedWeights[i].maxWeight) {
      return next(new Error('Weight bracket: minWeight must be less than maxWeight'))
    }
    if (i > 0 && sortedWeights[i].minWeight !== sortedWeights[i - 1].maxWeight) {
      return next(new Error('Weight brackets must be continuous without gaps'))
    }
  }
  
  // Validate distance brackets
  const sortedDistances = [...this.distanceBrackets].sort((a, b) => a.minDistance - b.minDistance)
  for (let i = 0; i < sortedDistances.length; i++) {
    if (sortedDistances[i].minDistance >= sortedDistances[i].maxDistance) {
      return next(new Error('Distance bracket: minDistance must be less than maxDistance'))
    }
    if (i > 0 && sortedDistances[i].minDistance !== sortedDistances[i - 1].maxDistance) {
      return next(new Error('Distance brackets must be continuous without gaps'))
    }
  }
  
  next()
})

RateCardSchema.index({ serviceId: 1 })
RateCardSchema.index({ isActive: 1, effectiveFrom: 1 })
RateCardSchema.index({ 'applicableCounties': 1 })

if (mongoose.models.RateCard) delete mongoose.models.RateCard

export default mongoose.model<IRateCard>('RateCard', RateCardSchema)
