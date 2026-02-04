/**
 * Optimized admin seeding script with proper connection handling
 */

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

// Production-optimized connection settings
const MONGODB_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  bufferMaxEntries: 0,
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,
  compressors: ['zlib'],
  connectTimeoutMS: 10000,
  family: 4,
}

/**
 * Connect to MongoDB with optimized settings
 */
async function connectDB() {
  if (mongoose.connections[0].readyState) {
    console.log('📦 Using existing MongoDB connection')
    return
  }

  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable')
  }

  try {
    console.log('🔗 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI, MONGODB_OPTIONS)
    console.log('✅ Connected to MongoDB successfully')
    setupGracefulShutdown()
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error)
    process.exit(1)
  }
}

/**
 * Gracefully close database connection
 */
async function closeDB() {
  try {
    await mongoose.connection.close()
    console.log('🔒 MongoDB connection closed')
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error)
  }
}

/**
 * Set up graceful shutdown handlers
 */
function setupGracefulShutdown() {
  const gracefulShutdown = async (signal) => {
    console.log(`\n📤 Received ${signal}. Gracefully shutting down...`)
    await closeDB()
    process.exit(0)
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'))
}

// Define User schema directly in the script
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, trim: true },
  dateOfBirth: { type: Date },
  addresses: [{
    type: { type: String, required: true, enum: ['shipping', 'billing'] },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    county: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false }
  }],
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  isActive: { type: Boolean, default: true },
  role: { type: String, enum: ['customer', 'admin', 'super_admin'], default: 'customer' },
  permissions: {
    products: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    orders: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      cancel: { type: Boolean, default: false }
    },
    blog: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    customers: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    reports: {
      view: { type: Boolean, default: false },
      export: { type: Boolean, default: false }
    },
    settings: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    locations: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    }
  },
  isApproved: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date }
}, { timestamps: true })

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

const User = mongoose.model('User', UserSchema)

async function seedAdmin() {
  try {
    await connectDB()

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@electromatt.co.ke' })
    
    if (existingAdmin) {
      console.log('Admin user already exists!')
      console.log('Email:', existingAdmin.email)
      console.log('Role:', existingAdmin.role)
      console.log('Active:', existingAdmin.isActive)
      
      // Update to super admin role if not already
      if (existingAdmin.role !== 'super_admin') {
        existingAdmin.role = 'super_admin'
        existingAdmin.isApproved = true
        existingAdmin.approvedAt = new Date()
        await existingAdmin.save()
        console.log('Updated existing user to super admin role')
      }
    } else {
      // Create new admin user
      console.log('Creating admin user...')
      
      const adminUser = new User({
        firstName: 'Electromatt',
        lastName: 'Admin',
        email: 'admin@electromatt.co.ke',
        password: 'admin123', // Will be hashed by the pre-save hook
        phone: '+254713065412',
        role: 'super_admin',
        isActive: true,
        isEmailVerified: true,
        isApproved: true,
        approvedAt: new Date()
      })
      
      await adminUser.save()
      console.log('Admin user created successfully!')
    }

    console.log('\n=== ADMIN USER DETAILS ===')
    const admin = await User.findOne({ email: 'admin@electromatt.co.ke' }).select('-password')
    console.log('ID:', admin._id)
    console.log('Name:', admin.firstName, admin.lastName)
    console.log('Email:', admin.email)
    console.log('Phone:', admin.phone)
    console.log('Role:', admin.role)
    console.log('Active:', admin.isActive)
    console.log('Email Verified:', admin.isEmailVerified)
    console.log('Created:', admin.createdAt)
    console.log('==========================')

    console.log('\n✅ Admin seeding completed successfully!')
    console.log('You can now login with:')
    console.log('Email: admin@electromatt.co.ke')
    console.log('Password: admin123')

  } catch (error) {
    console.error('Error seeding admin:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

// Run the seeding
seedAdmin()