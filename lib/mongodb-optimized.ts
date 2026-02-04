import mongoose from 'mongoose'

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongoose: MongooseCache | undefined
}

// Production-optimized connection configuration
const MONGODB_OPTIONS = {
  // Connection Pool Settings (optimized for 10k+ concurrent users)
  maxPoolSize: 50,        // Maximum number of connections in the pool
  minPoolSize: 5,         // Minimum number of connections to maintain
  maxIdleTimeMS: 30000,   // Close connections after 30 seconds of inactivity
  serverSelectionTimeoutMS: 5000, // How long to try selecting a server
  socketTimeoutMS: 45000, // How long a send or receive on a socket can take
  
  // Buffering Settings
  bufferCommands: false,  // Disable mongoose buffering
  bufferMaxEntries: 0,    // Disable mongoose buffering
  
  // Retry Settings
  retryWrites: true,      // Enable retryable writes
  retryReads: true,       // Enable retryable reads
  
  // Heartbeat Settings
  heartbeatFrequencyMS: 10000, // How often to check server status
  
  // Compression
  compressors: ['zlib'],  // Enable compression to reduce bandwidth
  
  // Connection Management
  connectTimeoutMS: 10000, // How long to wait for initial connection
  family: 4,              // Use IPv4, skip trying IPv6
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

/**
 * Production-safe MongoDB connection with optimized pooling
 * This should be called ONCE at application startup
 */
async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
  }

  // Return existing connection if available
  if (cached!.conn) {
    logConnectionStatus('Reusing existing connection')
    return cached!.conn
  }

  // Return existing promise if connection is in progress
  if (!cached!.promise) {
    logConnectionStatus('Creating new connection with optimized settings')
    
    cached!.promise = mongoose.connect(MONGODB_URI, MONGODB_OPTIONS).then((mongoose) => {
      logConnectionStatus('Successfully connected to MongoDB')
      
      // Set up connection event listeners for monitoring
      setupConnectionMonitoring(mongoose.connection)
      
      return mongoose
    })
  }

  try {
    cached!.conn = await cached!.promise
  } catch (e) {
    cached!.promise = null
    logConnectionStatus('Failed to connect to MongoDB', e)
    throw e
  }

  return cached!.conn
}

/**
 * Set up connection monitoring and event handlers
 */
function setupConnectionMonitoring(connection: mongoose.Connection) {
  // Connection opened
  connection.on('connected', () => {
    logConnectionStatus('Mongoose connected to MongoDB')
  })

  // Connection error
  connection.on('error', (err) => {
    logConnectionStatus('Mongoose connection error', err)
  })

  // Connection disconnected
  connection.on('disconnected', () => {
    logConnectionStatus('Mongoose disconnected from MongoDB')
  })

  // Connection reconnected
  connection.on('reconnected', () => {
    logConnectionStatus('Mongoose reconnected to MongoDB')
  })

  // Connection close
  connection.on('close', () => {
    logConnectionStatus('Mongoose connection closed')
  })

  // Monitor connection pool
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const stats = {
        readyState: connection.readyState,
        host: connection.host,
        port: connection.port,
        name: connection.name,
      }
      console.log('📊 MongoDB Connection Stats:', stats)
    }, 30000) // Log every 30 seconds in development
  }
}

/**
 * Defensive logging to detect connection leaks and issues
 */
function logConnectionStatus(message: string, error?: any) {
  const timestamp = new Date().toISOString()
  const prefix = '🔗 [MongoDB]'
  
  if (error) {
    console.error(`${prefix} ${timestamp} - ${message}:`, error)
  } else {
    console.log(`${prefix} ${timestamp} - ${message}`)
  }
}

/**
 * Gracefully close MongoDB connection
 * Should be called during application shutdown
 */
export async function closeDB(): Promise<void> {
  try {
    if (cached?.conn) {
      await cached.conn.connection.close()
      cached.conn = null
      cached.promise = null
      logConnectionStatus('MongoDB connection closed gracefully')
    }
  } catch (error) {
    logConnectionStatus('Error closing MongoDB connection', error)
    throw error
  }
}

/**
 * Get connection status for health checks
 */
export function getConnectionStatus() {
  const connection = cached?.conn?.connection
  if (!connection) {
    return { status: 'disconnected', readyState: 0 }
  }

  return {
    status: getReadyStateString(connection.readyState),
    readyState: connection.readyState,
    host: connection.host,
    port: connection.port,
    name: connection.name,
  }
}

function getReadyStateString(readyState: number): string {
  switch (readyState) {
    case 0: return 'disconnected'
    case 1: return 'connected'
    case 2: return 'connecting'
    case 3: return 'disconnecting'
    default: return 'unknown'
  }
}

/**
 * Health check function for monitoring
 */
export async function healthCheck(): Promise<{ healthy: boolean; details: any }> {
  try {
    const connection = cached?.conn?.connection
    if (!connection || connection.readyState !== 1) {
      return { healthy: false, details: 'Not connected to database' }
    }

    // Perform a simple ping to verify connection
    await connection.db.admin().ping()
    
    return { 
      healthy: true, 
      details: {
        status: 'connected',
        host: connection.host,
        port: connection.port,
        database: connection.name
      }
    }
  } catch (error) {
    return { 
      healthy: false, 
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

export default connectDB