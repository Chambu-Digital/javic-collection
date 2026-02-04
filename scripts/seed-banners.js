const mongoose = require('mongoose')
require('dotenv').config({ path: '.env' })

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

const Banner = mongoose.models.Banner || mongoose.model('Banner', BannerSchema)

const defaultBanners = [
  {
    title: 'Latest Electronics & Appliances',
    subtitle: 'Discover Premium Quality at Unbeatable Prices',
    image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1200&h=600&fit=crop',
    isActive: true,
    order: 1
  },
  {
    title: 'Smart Home Revolution',
    subtitle: 'Transform Your Home with Cutting-Edge Technology',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop',
    isActive: true,
    order: 2
  },
  {
    title: 'Kitchen Appliances Sale',
    subtitle: 'Up to 30% Off on Microwaves, Fridges & More',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=600&fit=crop',
    isActive: true,
    order: 3
  },
  {
    title: 'Entertainment Systems',
    subtitle: 'Premium TVs, Sound Systems & Gaming Consoles',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=1200&h=600&fit=crop',
    isActive: true,
    order: 4
  }
]

async function seedBanners() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Clear existing banners
    await Banner.deleteMany({})
    console.log('Cleared existing banners')

    // Insert default banners
    await Banner.insertMany(defaultBanners)
    console.log('Default banners seeded successfully')

    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  } catch (error) {
    console.error('Error seeding banners:', error)
    process.exit(1)
  }
}

seedBanners()