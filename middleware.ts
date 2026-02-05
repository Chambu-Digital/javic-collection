import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Simple middleware - let individual routes handle their own connections
  return NextResponse.next()
}

// Apply middleware to API routes only
export const config = {
  matcher: '/api/:path*'
}