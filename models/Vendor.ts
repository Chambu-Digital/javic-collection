import mongoose from 'mongoose'

export interface IVendor {
  _id?: string
  name: string
  vendorCode: string
  phone?: string
  email?: string
  isActive: boolean
  isHouseStock: boolean  // True for store-owned inventory
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

const VendorSchema = new mongoose.Schema<IVendor>(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    vendorCode: { 
      type: String, 
      required: true, 
      unique: true, 
      uppercase: true, 
      trim: true,
      validate: {
        validator: function(v: string) {
          return /^[A-Z0-9_-]+$/.test(v)
        },
        message: 'Vendor code must contain only uppercase letters, numbers, underscores, and hyphens'
      }
    },
    phone: { 
      type: String, 
      trim: true 
    },
    email: { 
      type: String, 
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true // Optional field
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        },
        message: 'Invalid email format'
      }
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    isHouseStock: { 
      type: Boolean, 
      default: false 
    },
    notes: { 
      type: String, 
      trim: true 
    }
  },
  { timestamps: true }
)

// Index for fast queries
VendorSchema.index({ vendorCode: 1 })
VendorSchema.index({ isActive: 1 })
VendorSchema.index({ isHouseStock: 1 })

// Prevent deletion of house stock vendor
VendorSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  if (this.isHouseStock) {
    return next(new Error('Cannot delete house stock vendor. Please deactivate instead.'))
  }
  
  // Check if vendor has inventory records
  const BranchStock = mongoose.models.BranchStock
  
  if (BranchStock) {
    const hasStock = await BranchStock.findOne({ vendorId: this._id })
    if (hasStock) {
      return next(new Error('Cannot delete vendor with inventory records. Please deactivate instead.'))
    }
  }
  
  // Check if vendor has sales history
  const Order = mongoose.models.Order
  
  if (Order) {
    const hasOrders = await Order.findOne({ 
      'items.vendorId': this._id 
    })
    if (hasOrders) {
      return next(new Error('Cannot delete vendor with sales history. Please deactivate instead.'))
    }
  }
  
  next()
})

if (mongoose.models.Vendor) delete mongoose.models.Vendor

export default mongoose.model<IVendor>('Vendor', VendorSchema)
