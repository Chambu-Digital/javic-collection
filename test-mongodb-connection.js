const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...')
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found')
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set')
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Successfully connected to MongoDB!')
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log(`📊 Found ${collections.length} collections:`)
    collections.forEach(col => console.log(`  - ${col.name}`))
    
    // Test if we can find the admin user
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      firstName: String,
      lastName: String,
      role: String
    }))
    
    const adminUser = await User.findOne({ email: 'electromatt@gmail.com' })
    if (adminUser) {
      console.log('👤 Admin user found:')
      console.log(`  - Name: ${adminUser.firstName} ${adminUser.lastName}`)
      console.log(`  - Email: ${adminUser.email}`)
      console.log(`  - Role: ${adminUser.role}`)
    } else {
      console.log('❌ Admin user not found')
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message)
    if (error.code) {
      console.error('Error code:', error.code)
    }
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

testConnection()