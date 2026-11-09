/**
 * One-time migration: set buyingPrice = 0 on all products that don't have it yet
 * Run with: node scripts/seed-buying-price.js
 */

require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')

async function run() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  const result = await mongoose.connection.collection('products').updateMany(
    { buyingPrice: { $exists: false } },
    { $set: { buyingPrice: 0 } }
  )

  console.log(`✅ Updated ${result.modifiedCount} products with buyingPrice: 0`)
  await mongoose.disconnect()
}

run().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
