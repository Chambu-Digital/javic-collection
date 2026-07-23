import mongoose from 'mongoose'

export interface IProductImage {
  url: string
  price?: number              // retail price override
  wholesalePrice?: number     // wholesale price override
  wholesaleThreshold?: number // wholesale min qty override
  stock?: number              // total stock for this design (sum of sizeStock if present)
  sizes?: string[]            // convenience list derived from sizeStock keys when sizeStock is set
  sizeStock?: Record<string, number> // per-size stock: { S: 5, M: 8, L: 3 }
  sku?: string
}

export interface IProduct {
  _id?: string
  name: string
  slug: string
  description: string

  price: number
  oldPrice?: number
  wholesalePrice?: number
  wholesaleThreshold?: number

  // Each image is a selectable design variant
  images: IProductImage[]

  // Product-level default sizes (used when an image has no sizeStock/sizes override)
  sizes: string[]

  category: string
  categoryId: mongoose.Types.ObjectId
  inStock: boolean
  stockQuantity: number
  rating: number
  reviews: number
  isNewProduct?: boolean
  isBestseller?: boolean
  isFeatured?: boolean
  isFlashDeal?: boolean
  flashDealDiscount?: number
  ingredients?: string
  usage?: string
  benefits?: string[]
  tags?: string[]
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

const ProductSchema = new mongoose.Schema<IProduct>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },

  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, min: 0 },
  wholesalePrice: { type: Number, min: 0 },
  wholesaleThreshold: {
    type: Number, min: 0,
    validate: {
      validator: function (this: IProduct, value: number): boolean {
        if (this.wholesalePrice && this.wholesalePrice > 0) return value >= 1
        return true
      },
      message: 'Wholesale threshold must be at least 1 when wholesale pricing is enabled',
    },
  },

  images: [{
    url:               { type: String, required: true },
    price:             { type: Number, min: 0 },
    wholesalePrice:    { type: Number, min: 0 },
    wholesaleThreshold:{ type: Number, min: 0 },
    stock:             { type: Number, min: 0 },
    sizes:             [{ type: String, trim: true }],
    // Per-size stock map — stored as a plain object in MongoDB
    sizeStock:         { type: Map, of: Number, default: undefined },
    sku:               { type: String, trim: true },
  }],

  sizes: [{ type: String, trim: true }],

  category:     { type: String, required: true },
  categoryId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  inStock:      { type: Boolean, default: true },
  stockQuantity:{ type: Number, default: 0, min: 0 },
  rating:       { type: Number, default: 0, min: 0, max: 5 },
  reviews:      { type: Number, default: 0, min: 0 },
  isNewProduct: { type: Boolean, default: false },
  isBestseller: { type: Boolean, default: false },
  isFeatured:   { type: Boolean, default: false },
  isFlashDeal:  { type: Boolean, default: false },
  flashDealDiscount: { type: Number, min: 0, max: 100 },
  ingredients: String,
  usage:       String,
  benefits:    [String],
  tags:        [String],
  isActive:    { type: Boolean, default: true },
}, { timestamps: true })

ProductSchema.pre('save', function (next) {
  if (!this.price || this.price <= 0) {
    return next(new Error('Product must have a price greater than 0'))
  }
  next()
})

ProductSchema.index({ name: 'text', description: 'text', category: 'text' })
ProductSchema.index({ category: 1, isActive: 1 })
ProductSchema.index({ isFeatured: 1, isActive: 1 })
ProductSchema.index({ isFlashDeal: 1, isActive: 1 })

if (mongoose.models.Product) delete mongoose.models.Product

export default mongoose.model<IProduct>('Product', ProductSchema)
