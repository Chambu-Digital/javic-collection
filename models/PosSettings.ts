import mongoose from 'mongoose'

export interface IPosSettings {
  _id?: string
  outletId?: mongoose.Types.ObjectId
  offlineSellingEnabled: boolean
  offlineCreditEnabled: boolean
  offlineCreditMaxAgeMinutes: number
  lowStockThreshold: number
  defaultOutletId?: mongoose.Types.ObjectId
  receiptFooter?: string
  updatedBy?: mongoose.Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const PosSettingsSchema = new mongoose.Schema<IPosSettings>(
  {
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'PosOutlet' },
    offlineSellingEnabled: { type: Boolean, default: true },
    offlineCreditEnabled: { type: Boolean, default: false },
    offlineCreditMaxAgeMinutes: { type: Number, default: 30 },
    lowStockThreshold: { type: Number, default: 5 },
    defaultOutletId: { type: mongoose.Schema.Types.ObjectId, ref: 'PosOutlet' },
    receiptFooter: { type: String, default: 'Thank you for shopping at Javic Collection!' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

if (mongoose.models.PosSettings) delete mongoose.models.PosSettings
export default mongoose.model<IPosSettings>('PosSettings', PosSettingsSchema)
