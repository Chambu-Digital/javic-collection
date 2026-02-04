const mongoose = require('mongoose')

// MongoDB connection
async function connectDB() {
  try {
    if (mongoose.connections[0].readyState) {
      return
    }
    
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables')
    }
    
    // Clean up the URI to handle potential parsing issues
    const cleanUri = mongoUri.replace('?appName=Serenleaf', '?appName=Serenleaf&retryWrites=true&w=majority')
    
    await mongoose.connect(cleanUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

// Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  image: String,
  icon: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

// Product Schema
const variantSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  value: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, min: 0 },
  wholesalePrice: { type: Number, min: 0 },
  wholesaleThreshold: { type: Number, min: 1 },
  image: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 },
  sku: { type: String, required: true },
  isActive: { type: Boolean, default: true }
})

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  hasVariants: { type: Boolean, default: false },
  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, min: 0 },
  wholesalePrice: { type: Number, min: 0 },
  wholesaleThreshold: { type: Number, min: 1 },
  images: [String],
  variants: [variantSchema],
  category: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  inStock: { type: Boolean, default: true },
  stockQuantity: { type: Number, default: 0, min: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0, min: 0 },
  isBestseller: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isFlashDeal: { type: Boolean, default: false },
  flashDealDiscount: { type: Number, min: 0, max: 100 },
  isNewProduct: { type: Boolean, default: false },
  ingredients: String,
  usage: String,
  benefits: [String],
  tags: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema)
const Product = mongoose.models.Product || mongoose.model('Product', productSchema)

const categories = [
  {
    name: 'Home Appliances',
    slug: 'home-appliances',
    description: 'Essential home appliances including refrigerators, washing machines, and air conditioners for modern living.',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    icon: 'Home',
    isActive: true
  },
  {
    name: 'Kitchen Electronics',
    slug: 'kitchen-electronics',
    description: 'Modern kitchen appliances including microwaves, blenders, coffee makers, and cooking essentials.',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    icon: 'ChefHat',
    isActive: true
  },
  {
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'TVs, sound systems, gaming consoles, and entertainment electronics for your home.',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800',
    icon: 'Tv',
    isActive: true
  },
  {
    name: 'Mobile & Tablets',
    slug: 'mobile-tablets',
    description: 'Latest smartphones, tablets, and mobile accessories from top brands.',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
    icon: 'Smartphone',
    isActive: true
  },
  {
    name: 'Computing',
    slug: 'computing',
    description: 'Laptops, desktops, monitors, and computer accessories for work and gaming.',
    image: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800',
    icon: 'Monitor',
    isActive: true
  },
  {
    name: 'Audio & Headphones',
    slug: 'audio-headphones',
    description: 'Premium headphones, speakers, and audio equipment for music lovers.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    icon: 'Headphones',
    isActive: true
  },
  {
    name: 'Smart Home',
    slug: 'smart-home',
    description: 'Smart home devices, security systems, and IoT products for connected living.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    icon: 'Wifi',
    isActive: true
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Cables, chargers, cases, and essential accessories for all your electronic devices.',
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',
    icon: 'Cable',
    isActive: true
  }
]

const products = [
  // Samsung Refrigerator Collection
  {
    name: 'Samsung Double Door Refrigerator',
    slug: 'samsung-double-door-refrigerator',
    description: 'Energy-efficient Samsung double door refrigerator with digital inverter technology. Available in multiple sizes and colors to suit your kitchen needs.',
    hasVariants: true,
    price: 0,
    images: [],
    variants: [
      {
        id: 'variant-fridge-253l-silver',
        type: 'size',
        value: '253L Silver',
        price: 45999,
        oldPrice: 52999,
        wholesalePrice: 42999,
        wholesaleThreshold: 5,
        image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=500',
        stock: 8,
        sku: 'SAM-253L-SIL',
        isActive: true
      },
      {
        id: 'variant-fridge-345l-silver',
        type: 'size',
        value: '345L Silver',
        price: 65999,
        oldPrice: 72999,
        wholesalePrice: 62999,
        wholesaleThreshold: 3,
        image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=500',
        stock: 5,
        sku: 'SAM-345L-SIL',
        isActive: true
      },
      {
        id: 'variant-fridge-345l-black',
        type: 'color',
        value: '345L Black',
        price: 67999,
        oldPrice: 74999,
        wholesalePrice: 64999,
        wholesaleThreshold: 3,
        image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=500',
        stock: 4,
        sku: 'SAM-345L-BLK',
        isActive: true
      }
    ],
    category: 'Home Appliances',
    inStock: true,
    stockQuantity: 17,
    rating: 4.7,
    reviews: 89,
    isBestseller: true,
    isFeatured: true,
    ingredients: 'Digital Inverter Compressor, Twin Cooling Plus, LED Lighting',
    usage: 'Plug into power outlet, set temperature, and start using. Energy Star certified.',
    benefits: [
      'Energy efficient with digital inverter technology',
      'Twin cooling system for optimal freshness', 
      'Spacious storage with adjustable shelves',
      'LED lighting for better visibility',
      '10-year warranty on compressor'
    ],
    tags: ['refrigerator', 'samsung', 'energy-efficient', 'variants'],
    isActive: true
  },
  // Microwave Oven Collection
  {
    name: 'LG Microwave Oven Collection',
    slug: 'lg-microwave-oven-collection',
    description: 'Versatile LG microwave ovens with multiple cooking modes and smart features for modern kitchens.',
    hasVariants: true,
    price: 0,
    images: [],
    variants: [
      {
        id: 'variant-microwave-20l',
        type: 'size',
        value: '20L Solo',
        price: 8999,
        oldPrice: 11999,
        wholesalePrice: 7999,
        wholesaleThreshold: 10,
        image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500',
        stock: 15,
        sku: 'LG-20L-SOLO',
        isActive: true
      },
      {
        id: 'variant-microwave-28l-grill',
        type: 'size',
        value: '28L Grill',
        price: 14999,
        oldPrice: 18999,
        wholesalePrice: 13499,
        wholesaleThreshold: 8,
        image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500',
        stock: 12,
        sku: 'LG-28L-GRILL',
        isActive: true
      },
      {
        id: 'variant-microwave-32l-convection',
        type: 'size',
        value: '32L Convection',
        price: 22999,
        oldPrice: 27999,
        wholesalePrice: 21499,
        wholesaleThreshold: 5,
        image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500',
        stock: 8,
        sku: 'LG-32L-CONV',
        isActive: true
      }
    ],
    category: 'Kitchen Electronics',
    inStock: true,
    stockQuantity: 35,
    rating: 4.5,
    reviews: 156,
    isNewProduct: true,
    ingredients: 'Stainless Steel Cavity, Digital Display, Auto Cook Menus',
    usage: 'Place food inside, select cooking mode, set timer and power level.',
    benefits: ['Multiple cooking modes', 'Easy to clean stainless steel', 'Auto cook menus', 'Child safety lock'],
    tags: ['microwave', 'lg', 'kitchen', 'cooking']
  }
]

async function seedDatabase() {
  try {
    await connectDB()
    
    // Clear existing data
    await Category.deleteMany({})
    await Product.deleteMany({})
    
    console.log('Cleared existing data')
    
    // Seed categories
    const createdCategories = await Category.insertMany(categories)
    console.log(`Seeded ${createdCategories.length} categories`)
    
    // Create a map of category names to IDs
    const categoryMap = new Map()
    createdCategories.forEach(cat => {
      categoryMap.set(cat.name, cat._id)
    })
    
    // Add categoryId to products and ensure isActive is true
    const productsWithCategoryId = products.map(product => ({
      ...product,
      categoryId: categoryMap.get(product.category),
      isActive: true
    }))
    
    // Seed products
    const createdProducts = await Product.insertMany(productsWithCategoryId)
    console.log(`Seeded ${createdProducts.length} products`)
    
    console.log('Database seeded successfully!')
    return { success: true, categories: createdCategories.length, products: createdProducts.length || 0 }
    
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  }
}

module.exports = { seedDatabase }