import mongoose from 'mongoose'

/**
 * BranchVendor Junction Model
 * 
 * Represents the many-to-many relationship between Branches and Vendors.
 * A vendor can be assigned to multiple branches, and a branch can have multiple vendors.
 */

export interface IBranchVendor {
  _id?: string
  branchId: mongoose.Types.ObjectId
  vendorId: mongoose.Types.ObjectId
  isActive: boolean
  assignedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

const BranchVendorSchema = new mongoose.Schema<IBranchVendor>(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
)

// Compound unique index to prevent duplicate assignments
BranchVendorSchema.index({ branchId: 1, vendorId: 1 }, { unique: true })

// Index for querying vendors by branch
BranchVendorSchema.index({ branchId: 1, isActive: 1 })

// Index for querying branches by vendor
BranchVendorSchema.index({ vendorId: 1, isActive: 1 })

// Virtual to get branch details
BranchVendorSchema.virtual('branch', {
  ref: 'Branch',
  localField: 'branchId',
  foreignField: '_id',
  justOne: true
})

// Virtual to get vendor details
BranchVendorSchema.virtual('vendor', {
  ref: 'Vendor',
  localField: 'vendorId',
  foreignField: '_id',
  justOne: true
})

// Prevent assignment to inactive branch or vendor
BranchVendorSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Branch = mongoose.model('Branch')
    const Vendor = mongoose.model('Vendor')
    
    const [branch, vendor] = await Promise.all([
      Branch.findById(this.branchId),
      Vendor.findById(this.vendorId)
    ])
    
    if (!branch) {
      return next(new Error('Branch not found'))
    }
    
    if (!vendor) {
      return next(new Error('Vendor not found'))
    }
    
    if (!branch.isActive) {
      return next(new Error('Cannot assign vendor to inactive branch'))
    }
    
    if (!vendor.isActive) {
      return next(new Error('Cannot assign inactive vendor to branch'))
    }
  }
  
  next()
})

// Cascade checks before deletion
BranchVendorSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  // Check if vendor has stock at this branch
  const BranchStock = mongoose.models.BranchStock
  
  if (BranchStock) {
    const hasStock = await BranchStock.findOne({
      branchId: this.branchId,
      vendorId: this.vendorId,
      quantity: { $gt: 0 }
    })
    
    if (hasStock) {
      return next(new Error('Cannot unassign vendor with active stock at this branch. Please deactivate instead or transfer stock first.'))
    }
  }
  
  next()
})

// Static method to get vendors for a branch
BranchVendorSchema.statics.getVendorsForBranch = async function(
  branchId: mongoose.Types.ObjectId | string,
  activeOnly: boolean = true
): Promise<any[]> {
  const query: any = { branchId }
  if (activeOnly) {
    query.isActive = true
  }
  
  return this.find(query)
    .populate('vendorId')
    .lean()
    .then((assignments: any[]) => 
      assignments.map(a => ({
        ...a.vendorId,
        assignmentId: a._id,
        assignedAt: a.assignedAt,
        isActiveAtBranch: a.isActive
      }))
    )
}

// Static method to get branches for a vendor
BranchVendorSchema.statics.getBranchesForVendor = async function(
  vendorId: mongoose.Types.ObjectId | string,
  activeOnly: boolean = true
): Promise<any[]> {
  const query: any = { vendorId }
  if (activeOnly) {
    query.isActive = true
  }
  
  return this.find(query)
    .populate('branchId')
    .lean()
    .then((assignments: any[]) => 
      assignments.map(a => ({
        ...a.branchId,
        assignmentId: a._id,
        assignedAt: a.assignedAt,
        isActiveAtBranch: a.isActive
      }))
    )
}

// Static method to check if vendor is assigned to branch
BranchVendorSchema.statics.isVendorAssignedToBranch = async function(
  branchId: mongoose.Types.ObjectId | string,
  vendorId: mongoose.Types.ObjectId | string,
  activeOnly: boolean = true
): Promise<boolean> {
  const query: any = { branchId, vendorId }
  if (activeOnly) {
    query.isActive = true
  }
  
  const assignment = await this.findOne(query)
  return !!assignment
}

if (mongoose.models.BranchVendor) delete mongoose.models.BranchVendor

export default mongoose.model<IBranchVendor>('BranchVendor', BranchVendorSchema)
