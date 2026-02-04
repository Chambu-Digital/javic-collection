import mongoose from 'mongoose'

export interface IVariant {
  id: string
  type: 'size' | 'scent' | 'color' | 'strength' | 'custom'
  value: string
  price: number
  oldPrice?: number
  wholesalePrice?: number
  wholesaleThreshold?: number
  image: string
  stock: number
  sku: string
  isActive: boolean
}

export interface IProduct {
  _id?: string
  name: string
  slug: string
  description: string
  
  // Variant control
  hasVariants: boolean
  
  // Simple product fields (when hasVariants = false)
  price: number
  oldPrice?: number
  wholesalePrice?: number
  wholesaleThreshold?: number
  images: string[]
  
  // Variant system (when hasVariants = true)
  variants?: IVariant[]
  
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

const VariantSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['size', 'scent', 'color', 'strength', 'custom']
  },
  value: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  oldPrice: {
    type: Number,
    min: 0
  },
  wholesalePrice: {
    type: Number,
    min: 0
  },
  wholesaleThreshold: {
    type: Number,
    min: 0,
    validate: {
      validator: function(this: IVariant, value: number): boolean {
        // Only require min 1 if wholesale pricing is actually being used
        if (this.wholesalePrice && this.wholesalePrice > 0) {
          return value >= 1;
        }
        // Allow 0 or undefined when wholesale pricing is not used
        return true;
      },
      message: 'Wholesale threshold must be at least 1 when wholesale pricing is enabled'
    }
  },
  image: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  sku: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
})

const ProductSchema = new mongoose.Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Variant control
  hasVariants: {
    type: Boolean,
    required: true,
    default: false
  },
  
  // Simple product fields
  price: {
    type: Number,
    required: function(this: IProduct): boolean {
      return !this.hasVariants
    },
    min: 0,
    default: 0
  },
  oldPrice: {
    type: Number,
    min: 0
  },
  wholesalePrice: {
    type: Number,
    min: 0
  },
  wholesaleThreshold: {
    type: Number,
    min: 0,
    validate: {
      validator: function(this: IProduct, value: number): boolean {
        // Only require min 1 if wholesale pricing is actually being used
        if (this.wholesalePrice && this.wholesalePrice > 0) {
          return value >= 1;
        }
        // Allow 0 or undefined when wholesale pricing is not used
        return true;
      },
      message: 'Wholesale threshold must be at least 1 when wholesale pricing is enabled'
    }
  },
  images: [{
    type: String
  }],
  
  // Variant system
  variants: {
    type: [VariantSchema],
    default: []
  },
  
  category: {
    type: String,
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: {
    type: Number,
    default: 0,
    min: 0
  },
  isNewProduct: {
    type: Boolean,
    default: false
  },
  isBestseller: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isFlashDeal: {
    type: Boolean,
    default: false
  },
  flashDealDiscount: {
    type: Number,
    min: 0,
    max: 100
  },
  ingredients: String,
  usage: String,
  benefits: [String],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Custom validation
ProductSchema.pre('save', function(next) {
  if (this.hasVariants) {
    // Variant products must have at least one variant
    if (!this.variants || this.variants.length === 0) {
      return next(new Error('Products with variants must have at least one variant'))
    }
  } else {
    // Simple products must have at least one image and a price > 0
    if (!this.images || this.images.length === 0) {
      return next(new Error('Simple products must have at least one image'))
    }
    if (!this.price || this.price <= 0) {
      return next(new Error('Simple products must have a price greater than 0'))
    }
  }
  next()
})

// Index for better search performance
ProductSchema.index({ name: 'text', description: 'text', category: 'text' })
ProductSchema.index({ category: 1, isActive: 1 })
ProductSchema.index({ isFeatured: 1, isActive: 1 })
ProductSchema.index({ isFlashDeal: 1, isActive: 1 })

// Force delete the cached model to ensure we use the new schema
if (mongoose.models.Product) {
  delete mongoose.models.Product
}

export default mongoose.model<IProduct>('Product', ProductSchema)