const fs = require('fs')
const path = require('path')

// Simple .env.local loader
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local')
    const envFile = fs.readFileSync(envPath, 'utf8')
    
    envFile.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) return
      
      const equalIndex = line.indexOf('=')
      if (equalIndex > 0) {
        const key = line.substring(0, equalIndex).trim()
        const value = line.substring(equalIndex + 1).trim()
        if (key && value) {
          process.env[key] = value
        }
      }
    })
  } catch (error) {
    console.log('No .env.local file found, using existing environment variables')
  }
}

async function runSeed() {
  try {
    // Load environment variables
    loadEnv()
    
    console.log('🌱 Starting database seed...')
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found')
    
    // Import the seed function
    const { seedDatabase } = require('../lib/seed.js')
    
    const result = await seedDatabase()
    console.log('✅ Seed completed successfully!')
    console.log(`📊 Results: ${result.categories} categories, ${result.products} products`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    console.error('Make sure your .env.local file has MONGODB_URI set')
    process.exit(1)
  }
}

runSeed()