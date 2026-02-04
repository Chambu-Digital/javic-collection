import { NextRequest, NextResponse } from 'next/server'

// Test M-Pesa configuration endpoint
export async function GET(request: NextRequest) {
  try {
    const config = {
      hasConsumerKey: !!process.env.MPESA_CONSUMER_KEY,
      hasConsumerSecret: !!process.env.MPESA_CONSUMER_SECRET,
      hasBusinessShortCode: !!process.env.MPESA_BUSINESS_SHORT_CODE,
      hasPasskey: !!process.env.MPESA_PASSKEY,
      environment: process.env.MPESA_ENVIRONMENT,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      
      // Show first 4 chars only for security
      consumerKeyPreview: process.env.MPESA_CONSUMER_KEY?.substring(0, 4) + '...',
      businessShortCodeValue: process.env.MPESA_BUSINESS_SHORT_CODE,
    }

    const allSet = config.hasConsumerKey && 
                   config.hasConsumerSecret && 
                   config.hasBusinessShortCode && 
                   config.hasPasskey

    return NextResponse.json({
      success: allSet,
      message: allSet ? 'All M-Pesa credentials are configured' : 'Some M-Pesa credentials are missing',
      config,
      callbackUrl: `${config.baseUrl}/api/payments/callback`
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
