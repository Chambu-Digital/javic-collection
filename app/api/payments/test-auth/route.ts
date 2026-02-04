import { NextRequest, NextResponse } from 'next/server'

// Test M-Pesa authentication without registration
export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const requiredEnvVars = [
      'MPESA_CONSUMER_KEY',
      'MPESA_CONSUMER_SECRET',
      'MPESA_BUSINESS_SHORT_CODE',
      'MPESA_ENVIRONMENT'
    ]

    const envStatus = requiredEnvVars.map(varName => ({
      name: varName,
      exists: !!process.env[varName],
      value: process.env[varName] ? `${process.env[varName].substring(0, 4)}...` : 'NOT SET'
    }))

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing environment variables: ${missingVars.join(', ')}`,
        envStatus
      })
    }

    // Test authentication
    const authString = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64')

    console.log('Testing M-Pesa authentication...')
    console.log('Environment:', process.env.MPESA_ENVIRONMENT)
    console.log('Business Short Code:', process.env.MPESA_BUSINESS_SHORT_CODE)
    
    const authUrl = `${process.env.MPESA_ENVIRONMENT === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke'}/oauth/v1/generate?grant_type=client_credentials`
    
    console.log('Auth URL:', authUrl)

    const authResponse = await fetch(authUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('Auth response status:', authResponse.status)
    console.log('Auth response ok:', authResponse.ok)
    
    const responseHeaders = Object.fromEntries(authResponse.headers.entries())
    console.log('Auth response headers:', responseHeaders)
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      console.error('Auth error response:', errorText)
      
      return NextResponse.json({
        success: false,
        error: `Authentication failed: ${authResponse.status}`,
        details: {
          status: authResponse.status,
          statusText: authResponse.statusText,
          headers: responseHeaders,
          body: errorText,
          authUrl,
          environment: process.env.MPESA_ENVIRONMENT
        },
        envStatus
      })
    }

    const authText = await authResponse.text()
    console.log('Auth response text length:', authText.length)
    console.log('Auth response text:', authText)
    
    if (!authText || authText.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Empty response from Daraja API',
        details: {
          status: authResponse.status,
          headers: responseHeaders,
          bodyLength: authText.length,
          authUrl
        },
        envStatus
      })
    }

    let authData
    try {
      authData = JSON.parse(authText)
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError)
      
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON response from Daraja API',
        details: {
          parseError: parseError.message,
          responseText: authText,
          responseLength: authText.length,
          authUrl
        },
        envStatus
      })
    }
    
    console.log('Parsed auth data:', authData)
    
    if (!authData.access_token) {
      return NextResponse.json({
        success: false,
        error: 'No access token in response',
        details: {
          response: authData,
          authUrl
        },
        envStatus
      })
    }

    return NextResponse.json({
      success: true,
      message: 'M-Pesa authentication successful',
      details: {
        tokenReceived: true,
        tokenLength: authData.access_token.length,
        expiresIn: authData.expires_in,
        environment: process.env.MPESA_ENVIRONMENT,
        authUrl
      },
      envStatus
    })

  } catch (error: any) {
    console.error('Test auth error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        stack: error.stack,
        name: error.name
      }
    })
  }
}
