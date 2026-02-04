/**
 * Template for database scripts with proper connection handling
 * Copy this template for new scripts to ensure proper connection management
 */

const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

// Production-optimized connection settings for scripts
const MONGODB_OPTIONS = {
  maxPoolSize: 10,        // Smaller pool for scripts
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
    
    // Set up graceful shutdown
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

  // Handle different termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')) // nodemon restart
}

/**
 * Main script function - replace this with your actual script logic
 */
async function runScript() {
  try {
    await connectDB()
    
    // Your script logic here
    console.log('🚀 Running script...')
    
    // Example: Find all users
    // const User = require('../models/User')
    // const users = await User.find({}).limit(5)
    // console.log('Found users:', users.length)
    
    console.log('✅ Script completed successfully')
    
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  } finally {
    await closeDB()
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  runScript()
}

module.exports = { connectDB, closeDB, runScript }