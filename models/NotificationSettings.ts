import mongoose from 'mongoose'

export interface INotificationSettings {
  _id?: string
  userId?: mongoose.Types.ObjectId
  outletId?: mongoose.Types.ObjectId
  lowStockEnabled: boolean
  lowStockThreshold: number
  syncFailureEnabled: boolean
  offlineModeEnabled: boolean
  creditLimitEnabled: boolean
  creditLimitThreshold: number
  systemNotificationsEnabled: boolean
  emailNotifications?: boolean
  smsNotifications?: boolean
  inAppNotifications: boolean
  createdAt?: Date
  updatedAt?: Date
}

const NotificationSettingsSchema = new mongoose.Schema<INotificationSettings>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
  lowStockEnabled: { type: Boolean, default: true },
  lowStockThreshold: { type: Number, default: 5 },
  syncFailureEnabled: { type: Boolean, default: true },
  offlineModeEnabled: { type: Boolean, default: true },
  creditLimitEnabled: { type: Boolean, default: true },
  creditLimitThreshold: { type: Number, default: 10000 },
  systemNotificationsEnabled: { type: Boolean, default: true },
  emailNotifications: { type: Boolean, default: false },
  smsNotifications: { type: Boolean, default: false },
  inAppNotifications: { type: Boolean, default: true },
}, { timestamps: true })

NotificationSettingsSchema.index({ userId: 1 })
NotificationSettingsSchema.index({ outletId: 1 })

if (mongoose.models.NotificationSettings) delete mongoose.models.NotificationSettings

export default mongoose.model<INotificationSettings>('NotificationSettings', NotificationSettingsSchema)
