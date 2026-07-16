import mongoose from 'mongoose'

export interface IPosSyncConflict {
  _id?: string
  clientId: string
  conflictType: 'stock' | 'credit' | 'mpesa_reference' | 'duplicate' | 'other'
  recordType: string
  localPayload: Record<string, unknown>
  serverState?: Record<string, unknown>
  resolutionStatus: 'pending' | 'resolved' | 'dismissed'
  resolvedBy?: mongoose.Types.ObjectId
  resolvedAt?: Date
  resolutionNotes?: string
  deviceId?: string
  outletId?: mongoose.Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const PosSyncConflictSchema = new mongoose.Schema<IPosSyncConflict>(
  {
    clientId: { type: String, required: true },
    conflictType: {
      type: String,
      enum: ['stock', 'credit', 'mpesa_reference', 'duplicate', 'other'],
      required: true,
    },
    recordType: { type: String, required: true },
    localPayload: { type: mongoose.Schema.Types.Mixed, required: true },
    serverState: mongoose.Schema.Types.Mixed,
    resolutionStatus: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
    resolutionNotes: String,
    deviceId: String,
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'PosOutlet' },
  },
  { timestamps: true }
)

PosSyncConflictSchema.index({ resolutionStatus: 1, createdAt: -1 })

if (mongoose.models.PosSyncConflict) delete mongoose.models.PosSyncConflict
export default mongoose.model<IPosSyncConflict>('PosSyncConflict', PosSyncConflictSchema)
