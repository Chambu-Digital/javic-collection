import mongoose from 'mongoose'
import PosAuditEntry from '@/models/PosAuditEntry'

export interface CreateAuditInput {
  userId: string
  userName: string
  userRole: string
  action: string
  targetType: string
  targetId?: string
  previousValue?: string
  newValue?: string
  outletId?: string
  deviceId?: string
  ipAddress?: string
  reason?: string
  approverId?: string
  approverName?: string
  session?: mongoose.ClientSession
}

export async function createAuditEntry(input: CreateAuditInput) {
  const entry = new PosAuditEntry({
    userId: input.userId,
    userName: input.userName,
    userRole: input.userRole,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    previousValue: input.previousValue,
    newValue: input.newValue,
    outletId: input.outletId,
    deviceId: input.deviceId,
    ipAddress: input.ipAddress,
    reason: input.reason,
    approverId: input.approverId,
    approverName: input.approverName,
  })

  if (input.session) {
    await entry.save({ session: input.session })
  } else {
    await entry.save()
  }

  return entry.toObject()
}
