import mongoose from 'mongoose'

export interface IMerchandiseImage {
  url: string
  color?: string
  size?: string
}

export interface IMerchandise {
  _id?: string
  name: string
  slug: string
  description: string
  
  // Branding
  category: 'apparel' | 'bags' | 'accessories' | 'stationery' | 'drinkware' | 'other'
  itemType: string // e.g., "T-Shirt", "Cap", "Tote Bag"
  
  // Pricing
  basePrice: number
  costPrice?: number
  markupPercentage?: number
  
  // Customization
  availableColors: string[]
  availableSizes?: string[]
  customizationOptions: {
    logoPlacement?: string
    printMethod?: string
    personalization?: boolean
  }
  
  // Images
  images: IMerchandiseImage[]
  
  // Inventory
  stockQuantity: number
  lowStockThreshold: number
  
  // Promotion
  isPromotional?: boolean
  minOrderQuantity: number
  bulkDiscounts?: Array<{
    quantity: number
    discountPercentage: number
  }>
  
  // Status
  isActive: boolean
  isFeatured?: boolean
  
  // Metadata
  rating?: number
  reviews?: number
  
  createdAt?: Date
  updatedAt?: Date
}

const MerchandiseImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  color: { type: String, trim: true },
  size: { type: String, trim: true }
}, { _id: false })

const MerchandiseSchema = new mongoose.Schema<IMerchandise>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },
  
  category: {
    type: String,
    enum: ['apparel', 'bags', 'accessories', 'stationery', 'drinkware', 'other'],
    required: true
  },
  itemType: { type: String, required: true, trim: true },
  
  basePrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, min: 0 },
  markupPercentage: { type: Number, min: 0 },
  
  availableColors: [{ type: String, trim: true }],
  availableSizes: [{ type: String, trim: true }],
  customizationOptions: {
    logoPlacement: { type: String, trim: true },
    printMethod: { type: String, trim: true },
    personalization: { type: Boolean, default: false }
  },
  
  images: [MerchandiseImageSchema],
  
  stockQuantity: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 10, min: 0 },
  
  isPromotional: { type: Boolean, default: false },
  minOrderQuantity: { type: Number, default: 1, min: 1 },
  bulkDiscounts: [{
    quantity: { type: Number, required: true, min: 1 },
    discountPercentage: { type: Number, required: true, min: 0, max: 100 }
  }],
  
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0, min: 0 }
}, { timestamps: true })

MerchandiseSchema.index({ slug: 1 })
MerchandiseSchema.index({ category: 1, isActive: 1 })
MerchandiseSchema.index({ isFeatured: 1, isActive: 1 })

if (mongoose.models.Merchandise) delete mongoose.models.Merchandise

export default mongoose.model<IMerchandise>('Merchandise', MerchandiseSchema)
