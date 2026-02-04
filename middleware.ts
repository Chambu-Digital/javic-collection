import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb-optimized'

// Initialize MongoDB connection once at startup
let connectionInitialized = false

export async function middleware(request: NextRequest) {
  // Initialize connection only once when the app starts
  if (!connectionInitialized) {
    try {
      await connectDB()
      connectionInitialized = true
      console.log('🚀 MongoDB connection initialized at app startup')
    } catch (error) {
      console.error('❌ Failed to initialize MongoDB connection:', error)
      // Don't block requests, let individual routes handle connection errors
    }
  }

  return NextResponse.next()
}

// Apply middleware to API routes only
export const config = {
  matcher: '/api/:path*'
}