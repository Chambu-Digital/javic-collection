import mongoose from 'mongoose'

export interface IOutlet {
  _id?: string
  outletId: string
  name: string
  location?: string
  address?: string
  phone?: string
  email?: string
  isActive: boolean
  businessHours?: {
    monday?: { open: string; close: string }
    tuesday?: { open: string; close: string }
    wednesday?: { open: string; close: string }
    thursday?: { open: string; close: string }
    friday?: { open: string; close: string }
    saturday?: { open: string; close: string }
    sunday?: { open: string; close: string }
  }
  managerId?: mongoose.Types.ObjectId
  cashierIds?: mongoose.Types.ObjectId[]
  settings?: outletSettings
  createdAt?: Date
  updatedAt?: Date
}

export interface outletSettings {
  defaultPricingMode?: 'retail' | 'wholesale'
  taxRate?: number
  currency?: string
  locale?: string
  autoPrintReceipt?: boolean
  requireCustomerForSale?: boolean
  allowCreditSales?: boolean
  maxCreditAmount?: number
  allowReturns?: boolean
  returnDaysLimit?: number
}

const OutletSchema = new mongoose.Schema<IOutlet>({
  outletId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: String,
  address: String,
  phone: String,
  email: String,
  isActive: { type: Boolean, default: true },
  businessHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String },
  },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cashierIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  settings: {
    defaultPricingMode: { type: String, enum: ['retail', 'wholesale'], default: 'retail' },
    taxRate: { type: Number, default: 0 },
    currency: { type: String, default: 'KES' },
    locale: { type: String, default: 'en-KE' },
    autoPrintReceipt: { type: Boolean, default: false },
    requireCustomerForSale: { type: Boolean, default: false },
    allowCreditSales: { type: Boolean, default: true },
    maxCreditAmount: { type: Number, default: 100000 },
    allowReturns: { type: Boolean, default: true },
    returnDaysLimit: { type: Number, default: 30 },
  },
}, { timestamps: true })

OutletSchema.pre('save', function (next) {
  if (!this.outletId) {
    this.outletId = 'OUT' + Date.now().toString().slice(-6)
  }
  next()
})

OutletSchema.index({ outletId: 1 })
OutletSchema.index({ isActive: 1 })

if (mongoose.models.Outlet) delete mongoose.models.Outlet

export default mongoose.model<IOutlet>('Outlet', OutletSchema)
