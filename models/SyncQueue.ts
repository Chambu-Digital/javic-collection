import mongoose from 'mongoose'

export type SyncRecordType =
  | 'order'
  | 'payment'
  | 'credit_transaction'
  | 'repayment'
  | 'inventory_movement'
  | 'ledger_entry'
  | 'customer'
  | 'held_order'

export interface ISyncQueue {
  syncId: string
  recordType: SyncRecordType
  recordId: string
  localId: string
  data: Record<string, unknown>
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict'
  errorMessage?: string
  retryCount: number
  lastRetryAt?: Date
  deviceId?: string
  outletId?: mongoose.Types.ObjectId
  outletName?: string
  userId?: mongoose.Types.ObjectId
  createdAt: Date
  syncedAt?: Date
  serverRecordId?: mongoose.Types.ObjectId
  conflictDetails?: Record<string, unknown>
}

const SyncQueueSchema = new mongoose.Schema<ISyncQueue>({
  syncId: {
    type: String,
    required: true,
    unique: true
  },
  recordType: {
    type: String,
    enum: ['order', 'payment', 'credit_transaction', 'repayment', 'inventory_movement', 'ledger_entry', 'customer', 'held_order'],
    required: true
  },
  recordId: String,
  localId: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'syncing', 'synced', 'failed', 'conflict'],
    default: 'pending'
  },
  errorMessage: String,
  retryCount: {
    type: Number,
    default: 0
  },
  lastRetryAt: Date,
  deviceId: String,
  outletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PosOutlet'
  },
  outletName: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  syncedAt: Date,
  serverRecordId: {
    type: mongoose.Schema.Types.ObjectId
  },
  conflictDetails: mongoose.Schema.Types.Mixed
})

// Auto-generate sync ID if not provided
SyncQueueSchema.pre('save', function(next) {
  if (!this.syncId) {
    const date = new Date()
    const stamp = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    this.syncId = `SYNC${stamp}${random}`
  }
  next()
})

// Index for sync operations
SyncQueueSchema.index({ status: 1, createdAt: 1 })
SyncQueueSchema.index({ deviceId: 1, status: 1 })
SyncQueueSchema.index({ localId: 1, recordType: 1 })
SyncQueueSchema.index({ outletId: 1 })

const SyncQueue = mongoose.models.SyncQueue || mongoose.model<ISyncQueue>('SyncQueue', SyncQueueSchema)

export default SyncQueue
