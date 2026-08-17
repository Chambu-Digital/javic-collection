import mongoose from 'mongoose'

export interface IBranch {
  _id?: string
  name: string
  branchCode: string
  location?: string
  address?: string
  isActive: boolean
  isMainBranch: boolean
  createdAt?: Date
  updatedAt?: Date
}

const BranchSchema = new mongoose.Schema<IBranch>(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    branchCode: { 
      type: String, 
      required: true, 
      unique: true, 
      uppercase: true, 
      trim: true,
      validate: {
        validator: function(v: string) {
          return /^[A-Z0-9_-]+$/.test(v)
        },
        message: 'Branch code must contain only uppercase letters, numbers, underscores, and hyphens'
      }
    },
    location: { 
      type: String, 
      trim: true 
    },
    address: { 
      type: String, 
      trim: true 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    isMainBranch: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true }
)

// Index for fast queries
BranchSchema.index({ branchCode: 1 })
BranchSchema.index({ isActive: 1 })
BranchSchema.index({ isMainBranch: 1 })

// Ensure only one main branch exists
BranchSchema.pre('save', async function(next) {
  if (this.isMainBranch && (this.isNew || this.isModified('isMainBranch'))) {
    const existingMain = await mongoose.model('Branch').findOne({
      isMainBranch: true,
      _id: { $ne: this._id }
    })
    
    if (existingMain) {
      return next(new Error('A main branch already exists. Only one main branch is allowed.'))
    }
  }
  next()
})

// Prevent deletion by overriding remove
BranchSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  // Check if branch has historical records (we'll implement this check later)
  // For now, we'll suggest deactivation instead of deletion
  const BranchStock = mongoose.models.BranchStock
  const Order = mongoose.models.Order
  
  if (BranchStock) {
    const hasStock = await BranchStock.findOne({ branchId: this._id })
    if (hasStock) {
      return next(new Error('Cannot delete branch with inventory records. Please deactivate instead.'))
    }
  }
  
  if (Order) {
    const hasOrders = await Order.findOne({ 
      'items.branchId': this._id 
    })
    if (hasOrders) {
      return next(new Error('Cannot delete branch with sales history. Please deactivate instead.'))
    }
  }
  
  next()
})

if (mongoose.models.Branch) delete mongoose.models.Branch

export default mongoose.model<IBranch>('Branch', BranchSchema)
