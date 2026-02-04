import mongoose from 'mongoose'

export interface ICategory {
  _id?: string
  name: string
  slug: string
  description: string
  image: string
  icon: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

const CategorySchema = new mongoose.Schema<ICategory>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema)