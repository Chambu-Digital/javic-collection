import mongoose from 'mongoose'

export interface IPosAuditEntry {
  _id?: string
  userId: mongoose.Types.ObjectId
  userName: string
  userRole: string
  action: string
  targetType: string
  targetId?: string
  previousValue?: string
  newValue?: string
  outletId?: mongoose.Types.ObjectId
  deviceId?: string
  ipAddress?: string
  reason?: string
  approverId?: mongoose.Types.ObjectId
  approverName?: string
  createdAt?: Date
}

const PosAuditEntrySchema = new mongoose.Schema<IPosAuditEntry>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: String,
    previousValue: String,
    newValue: String,
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'PosOutlet' },
    deviceId: String,
    ipAddress: String,
    reason: String,
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approverName: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

PosAuditEntrySchema.index({ createdAt: -1 })
PosAuditEntrySchema.index({ userId: 1 })
PosAuditEntrySchema.index({ action: 1 })

if (mongoose.models.PosAuditEntry) delete mongoose.models.PosAuditEntry
export default mongoose.model<IPosAuditEntry>('PosAuditEntry', PosAuditEntrySchema)
