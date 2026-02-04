import mongoose from 'mongoose'

export interface IBanner {
  _id?: string
  title: string
  subtitle: string
  image: string
  isActive: boolean
  order: number
  createdAt?: Date
  updatedAt?: Date
}

const BannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

export default mongoose.models.Banner || mongoose.model('Banner', BannerSchema)