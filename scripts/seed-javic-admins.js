/**
 * Seed Javic Collection admin users
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
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,
  connectTimeoutMS: 10000,
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
  permissions: [{
    type: String,
    trim: true
  }],
  legacyPermissions: {
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
  approvedAt: { type: Date },
  provider: { type: String, enum: ['local', 'google'], default: 'local' }
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

async function seedJavicAdmins() {
  try {
    await connectDB()

    const adminUsers = [
      {
        firstName: 'Javic',
        lastName: 'Admin',
        email: 'admin@javic.com',
        password: 'admin123',
        phone: '+254713065412',
        role: 'admin'
      },
      {
        firstName: 'Javic',
        lastName: 'SuperAdmin',
        email: 'superadmin@javic.com',
        password: 'superadmin123',
        phone: '+254713065412',
        role: 'super_admin'
      }
    ]

    console.log('🚀 Starting Javic Collection admin seeding...\n')

    for (const adminData of adminUsers) {
      // Check if admin already exists
      const existingAdmin = await User.findOne({ email: adminData.email })
      
      if (existingAdmin) {
        console.log(`✅ Admin user ${adminData.email} already exists!`)
        console.log('   Email:', existingAdmin.email)
        console.log('   Role:', existingAdmin.role)
        console.log('   Active:', existingAdmin.isActive)
        
        // Update role if different
        if (existingAdmin.role !== adminData.role) {
          existingAdmin.role = adminData.role
          existingAdmin.isApproved = true
          existingAdmin.approvedAt = new Date()
          await existingAdmin.save()
          console.log(`   Updated role to: ${adminData.role}`)
        }
        console.log('')
      } else {
        // Create new admin user
        console.log(`🔨 Creating admin user: ${adminData.email}...`)
        
        const adminUser = new User({
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          email: adminData.email,
          password: adminData.password, // Will be hashed by the pre-save hook
          phone: adminData.phone,
          role: adminData.role,
          isActive: true,
          isEmailVerified: true,
          isApproved: true,
          approvedAt: new Date(),
          provider: 'local',
          // Set full permissions for admin users
          legacyPermissions: {
            products: { view: true, create: true, edit: true, delete: true },
            orders: { view: true, edit: true, cancel: true },
            blog: { view: true, create: true, edit: true, delete: true },
            customers: { view: true, edit: true },
            reports: { view: true, export: true },
            settings: { view: true, edit: true },
            locations: { view: true, edit: true }
          }
        })
        
        await adminUser.save()
        console.log(`✅ Admin user ${adminData.email} created successfully!`)
        console.log('')
      }
    }

    console.log('\n=== JAVIC COLLECTION ADMIN USERS ===')
    const admins = await User.find({ 
      email: { $in: ['admin@javic.com', 'superadmin@javic.com'] } 
    }).select('-password')
    
    for (const admin of admins) {
      console.log('---')
      console.log('ID:', admin._id)
      console.log('Name:', admin.firstName, admin.lastName)
      console.log('Email:', admin.email)
      console.log('Phone:', admin.phone)
      console.log('Role:', admin.role)
      console.log('Active:', admin.isActive)
      console.log('Email Verified:', admin.isEmailVerified)
      console.log('Approved:', admin.isApproved)
      console.log('Created:', admin.createdAt)
    }
    console.log('=====================================')

    console.log('\n🎉 Javic Collection admin seeding completed successfully!')
    console.log('\nYou can now login with:')
    console.log('👤 Admin User:')
    console.log('   Email: admin@javic.com')
    console.log('   Password: admin123')
    console.log('')
    console.log('👑 Super Admin User:')
    console.log('   Email: superadmin@javic.com')
    console.log('   Password: superadmin123')

  } catch (error) {
    console.error('❌ Error seeding admins:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔒 Disconnected from MongoDB')
  }
}

// Run the seeding
seedJavicAdmins()