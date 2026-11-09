const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

async function grantPosAccess() {
  try {
    const email = process.argv[2]
    
    if (!email) {
      console.log('❌ Usage: node grant-pos-access.js <email>')
      console.log('Example: node grant-pos-access.js admin@javiccollection.co.ke')
      process.exit(1)
    }

    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    console.log(`\n🔍 Looking for admin user: ${email}`)
    
    const user = await mongoose.connection.db.collection('users').findOne({
      email,
      role: { $in: ['admin', 'super_admin'] }
    })

    if (!user) {
      console.log(`❌ Admin user not found with email: ${email}`)
      console.log('\nMake sure:')
      console.log('  1. The email is correct')
      console.log('  2. The user exists in the database')
      console.log('  3. The user has role "admin" or "super_admin"')
      process.exit(1)
    }

    console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.role})`)
    
    if (user.canAccessPOS) {
      console.log('ℹ️  User already has POS access')
      process.exit(0)
    }

    console.log('🔄 Granting POS access...')
    
    const result = await mongoose.connection.db.collection('users').updateOne(
      { _id: user._id },
      { $set: { canAccessPOS: true } }
    )

    if (result.modifiedCount > 0) {
      console.log('✅ POS access granted successfully!')
      console.log(`\n📝 User can now login at: http://localhost:3000/pos-login`)
      console.log(`   Email: ${email}`)
      console.log(`   Role: ${user.role}`)
    } else {
      console.log('⚠️  Update executed but no changes made')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\n👋 Disconnected from MongoDB')
    process.exit(0)
  }
}

grantPosAccess()
