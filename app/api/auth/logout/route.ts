import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    await clearAuthCookie()
    
    return NextResponse.json({
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}