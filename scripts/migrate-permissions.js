const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

// Permission mappings from old to new system
const PERMISSION_MAPPINGS = {
  'products.view': 'products.view',
  'products.create': 'products.create',
  'products.edit': 'products.edit',
  'products.delete': 'products.delete',
  'orders.view': 'orders.view',
  'orders.edit': 'orders.manage',
  'orders.cancel': 'orders.manage',
  'blog.view': 'blog.view',
  'blog.create': 'blog.create',
  'blog.edit': 'blog.edit',
  'blog.delete': 'blog.delete',
  'customers.view': 'customers.view',
  'customers.edit': 'customers.manage',
  'reports.view': 'reports.view',
  'reports.export': 'reports.export',
  'settings.view': 'settings.view',
  'settings.edit': 'settings.manage',
  'locations.view': 'shipping.view',
  'locations.edit': 'shipping.manage',
}

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  role: String,
  permissions: [String],
  legacyPermissions: {
    products: {
      view: Boolean,
      create: Boolean,
      edit: Boolean,
      delete: Boolean
    },
    orders: {
      view: Boolean,
      edit: Boolean,
      cancel: Boolean
    },
    blog: {
      view: Boolean,
      create: Boolean,
      edit: Boolean,
      delete: Boolean
    },
    customers: {
      view: Boolean,
      edit: Boolean
    },
    reports: {
      view: Boolean,
      export: Boolean
    },
    settings: {
      view: Boolean,
      edit: Boolean
    },
    locations: {
      view: Boolean,
      edit: Boolean
    }
  }
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', UserSchema)

async function migratePermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Find all admin users
    const adminUsers = await User.find({ 
      role: { $in: ['admin', 'super_admin'] }
    })

    console.log(`Found ${adminUsers.length} admin users to migrate`)

    for (const user of adminUsers) {
      const newPermissions = new Set()
      
      // Add default dashboard permission
      newPermissions.add('dashboard.view')
      
      // Migrate legacy permissions if they exist
      if (user.legacyPermissions) {
        for (const [category, perms] of Object.entries(user.legacyPermissions)) {
          if (perms && typeof perms === 'object') {
            for (const [action, enabled] of Object.entries(perms)) {
              if (enabled) {
                const oldPermKey = `${category}.${action}`
                const newPermKey = PERMISSION_MAPPINGS[oldPermKey]
                if (newPermKey) {
                  newPermissions.add(newPermKey)
                }
              }
            }
          }
        }
      }

      // Update user with new permissions
      await User.findByIdAndUpdate(user._id, {
        permissions: Array.from(newPermissions),
        // Keep legacy permissions for backup
        legacyPermissions: user.legacyPermissions || user.permissions
      })

      console.log(`Migrated permissions for ${user.firstName} ${user.lastName} (${user.email})`)
      console.log(`  New permissions: ${Array.from(newPermissions).join(', ')}`)
    }

    console.log('Permission migration completed successfully')
    await mongoose.disconnect()
  } catch (error) {
    console.error('Error migrating permissions:', error)
    process.exit(1)
  }
}

migratePermissions()