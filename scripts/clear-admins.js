const { MongoClient } = require('mongodb')
require('dotenv').config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local')
  process.exit(1)
}

async function clearAllAdmins() {
  let client

  try {
    console.log('🔗 Connecting to MongoDB...')
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    
    const db = client.db()
    const usersCollection = db.collection('users')
    
    // Find all admin users first
    const adminUsers = await usersCollection.find({
      role: { $in: ['admin', 'super_admin'] }
    }).toArray()
    
    console.log(`📊 Found ${adminUsers.length} admin users:`)
    adminUsers.forEach(admin => {
      console.log(`   - ${admin.firstName} ${admin.lastName} (${admin.email}) - ${admin.role}`)
    })
    
    if (adminUsers.length === 0) {
      console.log('✅ No admin users found to remove')
      return
    }
    
    // Confirm deletion
    console.log('\n⚠️  WARNING: This will permanently delete ALL admin users!')
    console.log('   Make sure you have a way to create a new admin user after this.')
    
    // Delete all admin users
    const result = await usersCollection.deleteMany({
      role: { $in: ['admin', 'super_admin'] }
    })
    
    console.log(`✅ Successfully removed ${result.deletedCount} admin users`)
    console.log('\n📝 Next steps:')
    console.log('   1. Create a new admin user using the admin registration page')
    console.log('   2. Or run the seed-admin.js script to create a default admin')
    
  } catch (error) {
    console.error('❌ Error clearing admin users:', error)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log('🔌 Database connection closed')
    }
  }
}

// Run the script
clearAllAdmins()