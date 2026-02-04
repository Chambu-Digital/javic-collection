import mongoose from 'mongoose'
import { getConnectionStatus } from './mongodb-optimized'

/**
 * Ensure database connection is ready
 * This should be used in API routes instead of connectDB()
 * It assumes the connection was already initialized at app startup
 */
export async function ensureDBConnection(): Promise<void> {
  const status = getConnectionStatus()
  
  if (status.readyState !== 1) {
    // Connection not ready - this should not happen in production
    // if middleware is working correctly
    console.warn('⚠️  Database connection not ready in API route. Status:', status)
    
    // In development, we might need to initialize if middleware didn't run
    if (process.env.NODE_ENV === 'development') {
      const connectDB = (await import('./mongodb-optimized')).default
      await connectDB()
      return
    }
    
    throw new Error('Database connection not available. Check middleware initialization.')
  }
}

/**
 * Wrapper for database operations with error handling
 */
export async function withDB<T>(operation: () => Promise<T>): Promise<T> {
  await ensureDBConnection()
  
  try {
    return await operation()
  } catch (error) {
    console.error('Database operation failed:', error)
    throw error
  }
}

/**
 * Check if we're connected to the database
 */
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1
}

/**
 * Get database connection info for debugging
 */
export function getDBInfo() {
  const connection = mongoose.connection
  return {
    readyState: connection.readyState,
    host: connection.host,
    port: connection.port,
    name: connection.name,
    collections: Object.keys(connection.collections),
  }
}