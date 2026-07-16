import mongoose from 'mongoose'

export interface ICreditTransaction {
  _id?: string
  customerId: mongoose.Types.ObjectId
  orderId?: mongoose.Types.ObjectId
  orderNumber?: string
  type: 'credit_sale' | 'adjustment' | 'limit_change' | 'write_off' | 'reversal'
  amountMinor: number
  previousBalanceMinor: number
  newBalanceMinor: number
  status: 'active' | 'partially_paid' | 'settled' | 'overdue' | 'written_off' | 'reversed'
  dueDate?: Date
  cashierId: mongoose.Types.ObjectId
  outletId: mongoose.Types.ObjectId
  notes?: string
  deviceId?: string
  wasOffline: boolean
  syncStatus: 'synced' | 'pending' | 'conflict'
  clientId?: string
  approvedBy?: mongoose.Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const CreditTransactionSchema = new mongoose.Schema<ICreditTransaction>(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    orderNumber: String,
    type: {
      type: String,
      enum: ['credit_sale', 'adjustment', 'limit_change', 'write_off', 'reversal'],
      required: true,
    },
    amountMinor: { type: Number, required: true },
    previousBalanceMinor: { type: Number, required: true },
    newBalanceMinor: { type: Number, required: true },
    status: {
      type: String,
      enum: ['active', 'partially_paid', 'settled', 'overdue', 'written_off', 'reversed'],
      default: 'active',
    },
    dueDate: Date,
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
    clientId: { type: String, sparse: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

CreditTransactionSchema.index({ customerId: 1, createdAt: -1 })
CreditTransactionSchema.index({ orderId: 1 })
CreditTransactionSchema.index({ clientId: 1 }, { sparse: true })

if (mongoose.models.CreditTransaction) delete mongoose.models.CreditTransaction
export default mongoose.model<ICreditTransaction>('CreditTransaction', CreditTransactionSchema)
