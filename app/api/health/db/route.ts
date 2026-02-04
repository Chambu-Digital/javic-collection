import { NextResponse } from 'next/server'
import { healthCheck, getConnectionStatus } from '@/lib/mongodb-optimized'

export async function GET() {
  try {
    const health = await healthCheck()
    const status = getConnectionStatus()
    
    const response = {
      timestamp: new Date().toISOString(),
      database: {
        healthy: health.healthy,
        status: status.status,
        readyState: status.readyState,
        host: status.host,
        port: status.port,
        database: status.name,
      },
      details: health.details
    }

    return NextResponse.json(response, { 
      status: health.healthy ? 200 : 503 
    })
    
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      database: {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 503 })
  }
}