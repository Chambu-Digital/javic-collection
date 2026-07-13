import mongoose from 'mongoose'

export interface ISiteSettings {
  _id?: string
  watermarkEnabled: boolean
  watermarkText: string
  watermarkPosition: 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right'
  watermarkOpacity: number
  updatedAt?: Date
}

const SiteSettingsSchema = new mongoose.Schema<ISiteSettings>({
  watermarkEnabled: { type: Boolean, default: true },
  watermarkText: { type: String, default: '' },
  watermarkPosition: {
    type: String,
    enum: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    default: 'bottom-right',
  },
  watermarkOpacity: { type: Number, min: 0, max: 1, default: 0.7 },
}, { timestamps: true })

if (mongoose.models.SiteSettings) delete mongoose.models.SiteSettings

export default mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema)
