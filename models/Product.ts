import mongoose from 'mongoose'

export interface IProductImage {
  url: string
  // Per-image overrides — all optional, fall back to product defaults if absent
  price?: number              // retail price override
  wholesalePrice?: number     // wholesale price override
  wholesaleThreshold?: number // wholesale min qty override
  stock?: number              // stock override for this specific design
  sizes?: string[]            // available sizes override for this design
  sku?: string                // optional SKU for this design
}

export interface IProduct {
  _id?: string
  name: string
  slug: string
  description: string

  // Pricing
  price: number
  oldPrice?: number
  wholesalePrice?: number
  wholesaleThreshold?: number

  // Images — each image is a selectable design; customer picks one when ordering
  // price is an optional per-image override; falls back to product.price if absent
  images: IProductImage[]

  // Sizes — flat list e.g. ['S','M','L','XL'] or ['Free Size']
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

  // Pricing
  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, min: 0 },
  wholesalePrice: { type: Number, min: 0 },
  wholesaleThreshold: {
    type: Number,
    min: 0,
    validate: {
      validator: function (this: IProduct, value: number): boolean {
        if (this.wholesalePrice && this.wholesalePrice > 0) return value >= 1
        return true
      },
      message: 'Wholesale threshold must be at least 1 when wholesale pricing is enabled',
    },
  },

  // Images — each entry is a design variant with optional overrides
  images: [{
    url: { type: String, required: true },
    price: { type: Number, min: 0 },
    wholesalePrice: { type: Number, min: 0 },
    wholesaleThreshold: { type: Number, min: 0 },
    stock: { type: Number, min: 0 },
    sizes: [{ type: String, trim: true }],
    sku: { type: String, trim: true },
  }],

  // Sizes
  sizes: [{ type: String, trim: true }],

  category: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  inStock: { type: Boolean, default: true },
  stockQuantity: { type: Number, default: 0, min: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0, min: 0 },
  isNewProduct: { type: Boolean, default: false },
  isBestseller: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isFlashDeal: { type: Boolean, default: false },
  flashDealDiscount: { type: Number, min: 0, max: 100 },
  ingredients: String,
  usage: String,
  benefits: [String],
  tags: [String],
  isActive: { type: Boolean, default: true },
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
