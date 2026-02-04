// M-Pesa Daraja API Service
// Documentation: https://developer.safaricom.co.ke/

interface MpesaConfig {
  businessShortCode: string // PayBill number
  consumerKey: string
  consumerSecret: string
  passkey: string
  environment: 'sandbox' | 'production'
}

interface AccessTokenResponse {
  access_token: string
  expires_in: string
}

interface STKPushRequest {
  BusinessShortCode: string
  Password: string
  Timestamp: string
  TransactionType: string
  Amount: number
  PartyA: string // Phone number
  PartyB: string // Business short code
  PhoneNumber: string
  CallBackURL: string
  AccountReference: string
  TransactionDesc: string
}

interface STKPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

// Get M-Pesa configuration from environment variables
function getMpesaConfig(): MpesaConfig {
  const config: MpesaConfig = {
    businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE || '',
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    passkey: process.env.MPESA_PASSKEY || '',
    environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
  }

  if (!config.businessShortCode || !config.consumerKey || !config.consumerSecret || !config.passkey) {
    throw new Error('M-Pesa configuration is incomplete. Please set all required environment variables.')
  }

  return config
}

// Get base URL based on environment
function getBaseUrl(environment: 'sandbox' | 'production'): string {
  if (environment === 'production') {
    return 'https://api.safaricom.co.ke'
  }
  return 'https://sandbox.safaricom.co.ke'
}

// Generate password for STK Push
function generatePassword(businessShortCode: string, passkey: string): string {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
  const password = Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString('base64')
  return password
}

// Get access token from M-Pesa OAuth API
export async function getAccessToken(): Promise<string> {
  try {
    const config = getMpesaConfig()
    const baseUrl = getBaseUrl(config.environment)
    
    const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64')
    
    const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to get access token: ${response.status} - ${errorText}`)
    }

    const data: AccessTokenResponse = await response.json()
    return data.access_token
  } catch (error: any) {
    console.error('Error getting M-Pesa access token:', error)
    throw new Error(`Failed to get M-Pesa access token: ${error.message}`)
  }
}

// Initiate STK Push (Lipa na M-Pesa Online)
export async function initiateSTKPush(
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string,
  callbackUrl: string
): Promise<STKPushResponse> {
  try {
    const config = getMpesaConfig()
    const baseUrl = getBaseUrl(config.environment)
    const accessToken = await getAccessToken()
    
    // Format phone number (remove + and ensure it starts with 254)
    let formattedPhone = phoneNumber.replace(/\s+/g, '').replace(/^\+/, '')
    if (!formattedPhone.startsWith('254')) {
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1)
      } else {
        formattedPhone = '254' + formattedPhone
      }
    }

    // Generate password and timestamp
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
    const password = generatePassword(config.businessShortCode, config.passkey)

    const stkPushRequest: STKPushRequest = {
      BusinessShortCode: config.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount), // M-Pesa requires integer amount
      PartyA: formattedPhone,
      PartyB: config.businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc
    }

    const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkPushRequest)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`STK Push failed: ${response.status} - ${errorText}`)
    }

    const data: STKPushResponse = await response.json()
    
    if (data.ResponseCode !== '0') {
      throw new Error(`STK Push error: ${data.ResponseDescription}`)
    }

    return data
  } catch (error: any) {
    console.error('Error initiating STK Push:', error)
    throw new Error(`Failed to initiate M-Pesa payment: ${error.message}`)
  }
}

// Query transaction status
export async function queryTransactionStatus(
  checkoutRequestID: string
): Promise<any> {
  try {
    const config = getMpesaConfig()
    const baseUrl = getBaseUrl(config.environment)
    const accessToken = await getAccessToken()
    
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
    const password = generatePassword(config.businessShortCode, config.passkey)

    const queryRequest = {
      BusinessShortCode: config.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID
    }

    const response = await fetch(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryRequest)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Query failed: ${response.status} - ${errorText}`)
    }

    return await response.json()
  } catch (error: any) {
    console.error('Error querying transaction status:', error)
    throw new Error(`Failed to query transaction: ${error.message}`)
  }
}
