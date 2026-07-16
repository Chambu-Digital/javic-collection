import mongoose from 'mongoose'

export interface ICustomerCreditAccount {
  _id?: string
  customerId: mongoose.Types.ObjectId
  creditEnabled: boolean
  creditLimitMinor: number
  outstandingBalanceMinor: number
  availableCreditMinor: number
  status: 'active' | 'suspended' | 'closed'
  nationalId?: string
  customerType?: string
  origin: 'website' | 'pos' | 'admin'
  notes?: string
  createdBy?: mongoose.Types.ObjectId
  createdAtOutlet?: mongoose.Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const CustomerCreditAccountSchema = new mongoose.Schema<ICustomerCreditAccount>(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    creditEnabled: { type: Boolean, default: false },
    creditLimitMinor: { type: Number, default: 0, min: 0 },
    outstandingBalanceMinor: { type: Number, default: 0, min: 0 },
    availableCreditMinor: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['active', 'suspended', 'closed'],
      default: 'active',
    },
    nationalId: String,
    customerType: String,
    origin: {
      type: String,
      enum: ['website', 'pos', 'admin'],
      default: 'pos',
    },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAtOutlet: { type: mongoose.Schema.Types.ObjectId, ref: 'PosOutlet' },
  },
  { timestamps: true }
)

CustomerCreditAccountSchema.methods.recalculateAvailable = function () {
  this.availableCreditMinor = Math.max(
    0,
    this.creditLimitMinor - this.outstandingBalanceMinor
  )
}

if (mongoose.models.CustomerCreditAccount) delete mongoose.models.CustomerCreditAccount
export default mongoose.model<ICustomerCreditAccount>(
  'CustomerCreditAccount',
  CustomerCreditAccountSchema
)
