import mongoose from 'mongoose'

export type AuditActionType =
  | 'login'
  | 'logout'
  | 'discount_applied'
  | 'price_override'
  | 'wholesale_activated'
  | 'credit_enabled'
  | 'credit_limit_changed'
  | 'credit_sale'
  | 'credit_override'
  | 'repayment'
  | 'repayment_reversal'
  | 'refund'
  | 'return'
  | 'sale_reversal'
  | 'held_order_cancelled'
  | 'sync_conflict_resolved'
  | 'customer_detail_changed'
  | 'inventory_adjustment'
  | 'permission_changed'
  | 'admin_action'

export interface IAuditLog {
  auditId: string
  action: AuditActionType
  userId: mongoose.Types.ObjectId
  userName: string
  userRole: string
  targetRecordType?: string
  targetRecordId?: mongoose.Types.ObjectId
  previousValue?: string
  newValue?: string
  reason?: string
  approvedBy?: mongoose.Types.ObjectId
  approvedByName?: string
  outletId?: mongoose.Types.ObjectId
  outletName?: string
  deviceId?: string
  ipAddress?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

const AuditLogSchema = new mongoose.Schema<IAuditLog>({
  auditId: {
    type: String,
    required: true,
    unique: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'discount_applied',
      'price_override',
      'wholesale_activated',
      'credit_enabled',
      'credit_limit_changed',
      'credit_sale',
      'credit_override',
      'repayment',
      'repayment_reversal',
      'refund',
      'return',
      'sale_reversal',
      'held_order_cancelled',
      'sync_conflict_resolved',
      'customer_detail_changed',
      'inventory_adjustment',
      'permission_changed',
      'admin_action'
    ]
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  targetRecordType: String,
  targetRecordId: {
    type: mongoose.Schema.Types.ObjectId
  },
  previousValue: String,
  newValue: String,
  reason: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedByName: String,
  outletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PosOutlet'
  },
  outletName: String,
  deviceId: String,
  ipAddress: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Auto-generate audit ID if not provided
AuditLogSchema.pre('save', function(next) {
  if (!this.auditId) {
    const date = new Date()
    const stamp = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    this.auditId = `AUD${stamp}${random}`
  }
  next()
})

// Index for audit queries
AuditLogSchema.index({ userId: 1, createdAt: -1 })
AuditLogSchema.index({ action: 1, createdAt: -1 })
AuditLogSchema.index({ targetRecordId: 1 })
AuditLogSchema.index({ outletId: 1, createdAt: -1 })
AuditLogSchema.index({ createdAt: -1 })

const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)

export default AuditLog
