import mongoose from 'mongoose'

export interface IPosSyncQueueItem {
  _id?: string
  clientId: string
  recordType:
    | 'customer'
    | 'order'
    | 'payment'
    | 'credit_transaction'
    | 'repayment'
    | 'inventory'
    | 'ledger'
  payload: Record<string, unknown>
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict'
  serverReference?: string
  errorDetails?: string
  retryCount: number
  deviceId?: string
  outletId?: mongoose.Types.ObjectId
  userId?: mongoose.Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
  syncedAt?: Date
}

const PosSyncQueueSchema = new mongoose.Schema<IPosSyncQueueItem>(
  {
    clientId: { type: String, required: true, unique: true },
    recordType: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['pending', 'syncing', 'synced', 'failed', 'conflict'],
      default: 'pending',
    },
    serverReference: String,
    errorDetails: String,
    retryCount: { type: Number, default: 0 },
    deviceId: String,
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'PosOutlet' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    syncedAt: Date,
  },
  { timestamps: true }
)

PosSyncQueueSchema.index({ status: 1, createdAt: 1 })
PosSyncQueueSchema.index({ deviceId: 1 })

if (mongoose.models.PosSyncQueue) delete mongoose.models.PosSyncQueue
export default mongoose.model<IPosSyncQueueItem>('PosSyncQueue', PosSyncQueueSchema)
