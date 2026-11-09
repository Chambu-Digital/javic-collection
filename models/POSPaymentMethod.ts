import mongoose from 'mongoose'

export interface IPOSPaymentMethod {
  _id?: string
  name: string
  icon: string        // emoji e.g. 💵 or key e.g. 'cash'
  isDefault: boolean  // default methods cannot be deleted
  isActive: boolean
  branchId?: mongoose.Types.ObjectId | null  // null = available to all branches
  createdAt?: Date
  updatedAt?: Date
}

const POSPaymentMethodSchema = new mongoose.Schema<IPOSPaymentMethod>(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null }
  },
  { timestamps: true }
)

POSPaymentMethodSchema.index({ isActive: 1 })
POSPaymentMethodSchema.index({ branchId: 1 })

// Seed default methods if none exist
POSPaymentMethodSchema.statics.seedDefaults = async function () {
  const count = await this.countDocuments({ isDefault: true })
  if (count > 0) return

  await this.insertMany([
    { name: 'Cash', icon: '💵', isDefault: true, isActive: true, branchId: null },
    { name: 'M-Pesa', icon: '📱', isDefault: true, isActive: true, branchId: null },
    { name: 'Credit', icon: '🏦', isDefault: true, isActive: true, branchId: null },
  ])
}

if (mongoose.models.POSPaymentMethod) delete mongoose.models.POSPaymentMethod

export default mongoose.model<IPOSPaymentMethod>('POSPaymentMethod', POSPaymentMethodSchema)
