import mongoose from 'mongoose'

export interface IPosOutlet {
  _id?: string
  name: string
  code: string
  address?: string
  phone?: string
  isActive: boolean
  isDefault: boolean
  createdAt?: Date
  updatedAt?: Date
}

const PosOutletSchema = new mongoose.Schema<IPosOutlet>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    address: String,
    phone: String,
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
)

if (mongoose.models.PosOutlet) delete mongoose.models.PosOutlet
export default mongoose.model<IPosOutlet>('PosOutlet', PosOutletSchema)
