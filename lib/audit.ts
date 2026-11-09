/**
 * Audit log writer.
 *
 * The AuditLog model (models/AuditLog.ts) is defined but never populated.
 * This is the small helper that catalog/adjustment operations (Bulk Edit,
 * stock count approvals, etc.) pass through so there is a permanent trail of
 * who changed what.
 *
 * It is safe to call inside a Mongoose transaction — pass the session.
 * It never throws: audit logging must not break the business operation.
 */

import mongoose from 'mongoose'
import AuditLog, { AuditActionType } from '@/models/AuditLog'

export interface CreateAuditLogInput {
  action: AuditActionType
  userId: string | mongoose.Types.ObjectId
  userName: string
  userRole: string
  targetRecordType?: string
  targetRecordId?: string | mongoose.Types.ObjectId
  previousValue?: string
  newValue?: string
  reason?: string
  metadata?: Record<string, unknown>
  session?: mongoose.ClientSession
}

function toObjectId(value?: string | mongoose.Types.ObjectId): mongoose.Types.ObjectId | undefined {
  if (!value) return undefined
  if (value instanceof mongoose.Types.ObjectId) return value
  try {
    return new mongoose.Types.ObjectId(value)
  } catch {
    return undefined
  }
}

export async function createAuditLog(input: CreateAuditLogInput): Promise<typeof AuditLog.prototype | null> {
  const doc: any = {
    action: input.action,
    userId: toObjectId(input.userId),
    userName: input.userName,
    userRole: input.userRole,
    targetRecordType: input.targetRecordType,
    targetRecordId: toObjectId(input.targetRecordId),
    previousValue: input.previousValue,
    newValue: input.newValue,
    reason: input.reason,
    metadata: input.metadata,
  }

  // Strip undefined keys so Mongoose defaults apply cleanly (auditId auto-gen)
  Object.keys(doc).forEach((k) => doc[k] === undefined && delete doc[k])

  try {
    const entry = new AuditLog(doc)
    await entry.save({ session: input.session || undefined })
    return entry
  } catch (err) {
    // Non-fatal: never let audit logging break a transaction.
    console.error('createAuditLog failed:', err)
    return null
  }
}
