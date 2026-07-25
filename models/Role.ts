import mongoose from 'mongoose'

export interface IRole {
  _id?: string
  name: string
  description?: string
  permissions: string[]
  isActive: boolean
  isSystem?: boolean
  createdAt?: Date
  updatedAt?: Date
}

const RoleSchema = new mongoose.Schema<IRole>({
  name: { type: String, required: true, unique: true },
  description: String,
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isSystem: { type: Boolean, default: false },
}, { timestamps: true })

RoleSchema.index({ name: 1 })
RoleSchema.index({ isActive: 1 })

if (mongoose.models.Role) delete mongoose.models.Role

export default mongoose.model<IRole>('Role', RoleSchema)
