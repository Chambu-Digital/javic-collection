const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

async function fixPosAccess() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    // Update all admin and super_admin users to have POS access
    const result = await mongoose.connection.db.collection('users').updateMany(
      { 
        role: { $in: ['admin', 'super_admin'] },
        $or: [
          { canAccessPOS: { $exists: false } },
          { canAccessPOS: false }
        ]
      },
      { $set: { canAccessPOS: true } }
    )

    console.log(`✅ Updated ${result.modifiedCount} admin user(s) to have POS access`)
    
    // Show all admins with their POS access status
    const admins = await mongoose.connection.db.collection('users').find(
      { role: { $in: ['admin', 'super_admin'] } },
      { projection: { firstName: 1, lastName: 1, email: 1, role: 1, canAccessPOS: 1 } }
    ).toArray()

    console.log('\n📋 All admin users:')
    admins.forEach(admin => {
      console.log(`  ${admin.email} (${admin.role}) - POS Access: ${admin.canAccessPOS ? '✅' : '❌'}`)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\n👋 Disconnected from MongoDB')
    process.exit(0)
  }
}

fixPosAccess()
