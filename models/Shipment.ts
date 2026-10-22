import mongoose from 'mongoose'

export interface IShipmentItem {
  _id?: string
  description: string
  weight: number // in kg
  value: number // declared value for insurance
  quantity: number
  category?: string
}

export interface IPickupLocation {
  depotId?: mongoose.Types.ObjectId
  name: string
  address: string
  county: string
  area: string
  phone: string
  contact?: string
}

export interface IDeliveryLocation {
  name: string
  address: string
  county: string
  area: string
  phone: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface IRateCalculation {
  basePricePerKg: number
  tierMultiplier: number
  totalWeight: number
  basePrice: number
  
  distancePricePerKm: number
  estimatedDistance: number
  distancePrice: number
  
  surcharges: Array<{
    name: string
    amount: number
  }>
  
  minimumCharge: number
  total: number
  discount?: number
  finalTotal: number
}

export interface IGpsTracking {
  timestamp: Date
  latitude: number
  longitude: number
  status: string
  notes?: string
}

export interface IServiceHistory {
  timestamp: Date
  status: string
  location?: string
  notes?: string
  updatedBy?: mongoose.Types.ObjectId
}

export interface IShipment {
  _id?: string
  shipmentNumber: string
  
  // Customer & service
  userId?: mongoose.Types.ObjectId
  customerEmail: string
  customerPhone: string
  serviceId: mongoose.Types.ObjectId
  selectedTier?: string // e.g., "express", "standard"
  
  // Locations
  pickupLocation: IPickupLocation
  deliveryLocation: IDeliveryLocation
  
  // Shipment contents
  items: IShipmentItem[]
  totalWeight: number
  totalValue: number
  
  // Routing
  estimatedDistance?: number
  estimatedDeliveryDate?: Date
  
  // Pricing
  rateCalculation: IRateCalculation
  
  // Status & tracking
  status: 'quoted' | 'confirmed' | 'picked-up' | 'in-transit' | 'delivered' | 'cancelled' | 'failed'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  
  trackingNumber: string
  trackingUrl?: string
  
  gpsTracking?: IGpsTracking[]
  serviceHistory: IServiceHistory[]
  
  // Driver & vehicle assignment
  assignedDriverId?: mongoose.Types.ObjectId
  vehicleId?: mongoose.Types.ObjectId
  
  // Special instructions
  specialInstructions?: string
  signatureRequired?: boolean
  proofOfDelivery?: string // URL to POD image
  
  // Feedback & issues
  feedback?: {
    rating: number
    comment?: string
    damageReported?: boolean
    delayReason?: string
  }
  
  // Dates
  quotedAt?: Date
  confirmedAt?: Date
  pickedUpAt?: Date
  deliveredAt?: Date
  
  // Additional fields
  insuranceApplied?: boolean
  insuranceAmount?: number
  adminNotes?: string
  
  createdAt?: Date
  updatedAt?: Date
}

const ShipmentItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  weight: { type: Number, required: true, min: 0 },
  value: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  category: { type: String, trim: true }
})

const PickupLocationSchema = new mongoose.Schema({
  depotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot' },
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  county: { type: String, required: true, trim: true },
  area: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  contact: { type: String, trim: true }
})

const DeliveryLocationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  county: { type: String, required: true, trim: true },
  area: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  }
}, { _id: false })

const RateCalculationSchema = new mongoose.Schema({
  basePricePerKg: { type: Number, required: true, min: 0 },
  tierMultiplier: { type: Number, required: true, min: 0 },
  totalWeight: { type: Number, required: true, min: 0 },
  basePrice: { type: Number, required: true, min: 0 },
  
  distancePricePerKm: { type: Number, required: true, min: 0 },
  estimatedDistance: { type: Number, required: true, min: 0 },
  distancePrice: { type: Number, required: true, min: 0 },
  
  surcharges: [{
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 }
  }],
  
  minimumCharge: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  discount: { type: Number, min: 0 },
  finalTotal: { type: Number, required: true, min: 0 }
}, { _id: false })

const GpsTrackingSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true, default: Date.now },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  status: { type: String, required: true },
  notes: { type: String, trim: true }
}, { _id: false })

const ServiceHistorySchema = new mongoose.Schema({
  timestamp: { type: Date, required: true, default: Date.now },
  status: { type: String, required: true },
  location: { type: String, trim: true },
  notes: { type: String, trim: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false })

const ShipmentSchema = new mongoose.Schema<IShipment>({
  shipmentNumber: { type: String, required: true, unique: true },
  
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerEmail: { type: String, required: true, lowercase: true },
  customerPhone: { type: String, required: true, trim: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  selectedTier: { type: String, trim: true },
  
  pickupLocation: { type: PickupLocationSchema, required: true },
  deliveryLocation: { type: DeliveryLocationSchema, required: true },
  
  items: [ShipmentItemSchema],
  totalWeight: { type: Number, required: true, min: 0 },
  totalValue: { type: Number, required: true, min: 0 },
  
  estimatedDistance: { type: Number, min: 0 },
  estimatedDeliveryDate: Date,
  
  rateCalculation: { type: RateCalculationSchema, required: true },
  
  status: {
    type: String,
    enum: ['quoted', 'confirmed', 'picked-up', 'in-transit', 'delivered', 'cancelled', 'failed'],
    default: 'quoted'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  
  trackingNumber: { type: String, required: true, unique: true },
  trackingUrl: String,
  
  gpsTracking: [GpsTrackingSchema],
  serviceHistory: [ServiceHistorySchema],
  
  assignedDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  
  specialInstructions: String,
  signatureRequired: { type: Boolean, default: false },
  proofOfDelivery: String,
  
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    damageReported: { type: Boolean, default: false },
    delayReason: String
  },
  
  quotedAt: Date,
  confirmedAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date,
  
  insuranceApplied: { type: Boolean, default: false },
  insuranceAmount: { type: Number, min: 0 },
  adminNotes: String
}, { timestamps: true })

// Generate shipment number before save
ShipmentSchema.pre('save', async function(next) {
  if (!this.shipmentNumber) {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    
    const lastShipment = await mongoose.model('Shipment').findOne({
      shipmentNumber: new RegExp(`^SHP${year}${month}${day}`)
    }).sort({ shipmentNumber: -1 })
    
    let sequence = 1
    if (lastShipment) {
      const lastSequence = parseInt(lastShipment.shipmentNumber.slice(-4))
      sequence = lastSequence + 1
    }
    
    this.shipmentNumber = `SHP${year}${month}${day}${sequence.toString().padStart(4, '0')}`
  }
  
  if (!this.trackingNumber) {
    this.trackingNumber = `TRK${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  }
  
  next()
})

ShipmentSchema.index({ shipmentNumber: 1 })
ShipmentSchema.index({ trackingNumber: 1 })
ShipmentSchema.index({ userId: 1, createdAt: -1 })
ShipmentSchema.index({ status: 1, createdAt: -1 })
ShipmentSchema.index({ paymentStatus: 1 })
ShipmentSchema.index({ customerEmail: 1 })
ShipmentSchema.index({ 'pickupLocation.county': 1 })
ShipmentSchema.index({ 'deliveryLocation.county': 1 })
ShipmentSchema.index({ serviceId: 1 })
ShipmentSchema.index({ assignedDriverId: 1 })

if (mongoose.models.Shipment) delete mongoose.models.Shipment

export default mongoose.model<IShipment>('Shipment', ShipmentSchema)
