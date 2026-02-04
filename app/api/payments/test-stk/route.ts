import { NextRequest, NextResponse } from 'next/server'
import { initiateSTKPush } from '@/lib/mpesa-service'

// Test STK Push endpoint - for debugging only
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, amount = 1 } = body

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    console.log('=== Test STK Push ===')
    console.log('Phone:', phone)
    console.log('Amount:', amount)
    console.log('Environment:', process.env.MPESA_ENVIRONMENT)
    console.log('Business Short Code:', process.env.MPESA_BUSINESS_SHORT_CODE)

    // Get callback URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://serenleaf.co.ke'
    const callbackUrl = `${baseUrl}/api/payments/callback`
    
    console.log('Callback URL:', callbackUrl)

    // Initiate STK Push
    const stkResponse = await initiateSTKPush(
      phone,
      amount,
      'TEST001',
      'Test payment',
      callbackUrl
    )

    console.log('STK Response:', stkResponse)

    return NextResponse.json({
      success: true,
      message: 'STK Push initiated successfully',
      data: {
        merchantRequestID: stkResponse.MerchantRequestID,
        checkoutRequestID: stkResponse.CheckoutRequestID,
        responseCode: stkResponse.ResponseCode,
        responseDescription: stkResponse.ResponseDescription,
        customerMessage: stkResponse.CustomerMessage
      },
      debug: {
        phone,
        amount,
        callbackUrl,
        environment: process.env.MPESA_ENVIRONMENT,
        businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE
      }
    })

  } catch (error: any) {
    console.error('Test STK Push error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to initiate STK Push',
      details: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 })
  }
}

// GET endpoint for easy browser testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')
  const amount = searchParams.get('amount') || '1'

  if (!phone) {
    return NextResponse.json({
      success: false,
      error: 'Phone number is required',
      usage: 'GET /api/payments/test-stk?phone=0748069158&amount=1'
    }, { status: 400 })
  }

  // Call the POST handler
  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, amount: parseFloat(amount) })
  }))
}
