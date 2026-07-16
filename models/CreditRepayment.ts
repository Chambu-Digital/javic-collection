import mongoose from 'mongoose'

export interface ICreditRepayment {
  _id?: string
  repaymentNumber: string
  customerId: mongoose.Types.ObjectId
  amountMinor: number
  cashAmountMinor: number
  mpesaAmountMinor: number
  mpesaReference?: string
  previousBalanceMinor: number
  newBalanceMinor: number
  paymentMethods: ('cash' | 'mpesa')[]
  cashierId: mongoose.Types.ObjectId
  outletId: mongoose.Types.ObjectId
  notes?: string
  deviceId?: string
  wasOffline: boolean
  syncStatus: 'synced' | 'pending' | 'conflict'
  reversalStatus: 'none' | 'reversed'
  reversedBy?: mongoose.Types.ObjectId
  reversedAt?: Date
  clientId?: string
  createdAt?: Date
  updatedAt?: Date
}

const CreditRepaymentSchema = new mongoose.Schema<ICreditRepayment>(
  {
    repaymentNumber: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amountMinor: { type: Number, required: true, min: 1 },
    cashAmountMinor: { type: Number, default: 0, min: 0 },
    mpesaAmountMinor: { type: Number, default: 0, min: 0 },
    mpesaReference: String,
    previousBalanceMinor: { type: Number, required: true },
    newBalanceMinor: { type: Number, required: true },
    paymentMethods: [{ type: String, enum: ['cash', 'mpesa'] }],
    cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'PosOutlet', required: true },
    notes: String,
    deviceId: String,
    wasOffline: { type: Boolean, default: false },
    syncStatus: {
      type: String,
      enum: ['synced', 'pending', 'conflict'],
      default: 'synced',
    },
    reversalStatus: {
      type: String,
      enum: ['none', 'reversed'],
      default: 'none',
    },
    reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reversedAt: Date,
    clientId: { type: String, sparse: true },
  },
  { timestamps: true }
)

CreditRepaymentSchema.pre('save', async function (next) {
  if (!this.repaymentNumber) {
    const date = new Date()
    const stamp = date.toISOString().slice(0, 10).replace(/-/g, '')
    const last = await mongoose.model('CreditRepayment').findOne({
      repaymentNumber: new RegExp(`^REP${stamp}`),
    }).sort({ repaymentNumber: -1 })
    let seq = 1
    if (last) seq = parseInt(last.repaymentNumber.slice(-4)) + 1
    this.repaymentNumber = `REP${stamp}${seq.toString().padStart(4, '0')}`
  }
  next()
})

CreditRepaymentSchema.index({ customerId: 1, createdAt: -1 })
CreditRepaymentSchema.index({ clientId: 1 }, { sparse: true })

if (mongoose.models.CreditRepayment) delete mongoose.models.CreditRepayment
export default mongoose.model<ICreditRepayment>('CreditRepayment', CreditRepaymentSchema)
