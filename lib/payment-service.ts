// Payment service for handling different payment methods

export type PaymentMethod = 'mpesa' | 'bank' | 'whatsapp'

export interface PaymentDetails {
  method: PaymentMethod
  amount: number
  currency: string
  orderId: string
  customerEmail: string
  customerPhone: string
}

export interface MpesaConfig {
  businessShortCode: string
  consumerKey: string
  consumerSecret: string
  passkey: string
}

export interface BankTransferDetails {
  bankName: string
  accountName: string
  accountNumber: string
  swiftCode: string
}

// M-Pesa Payment Handler
export const initiateMpesaPayment = async (details: PaymentDetails) => {
  try {
    const response = await fetch('/api/payments/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: details.amount,
        phone: details.customerPhone,
        orderId: details.orderId,
      }),
    })
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('M-Pesa payment error:', error)
    throw error
  }
}

// Bank Transfer Handler
export const getBankTransferDetails = (): BankTransferDetails => {
  return {
    bankName: 'Equity Bank Kenya',
    accountName: 'Serenleaf Natural',
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '0712345678',
    swiftCode: 'EQBLKENA',
  }
}

// Cash on Delivery Handler
export const processCashOnDelivery = async (details: PaymentDetails) => {
  try {
    const response = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: details.orderId,
        amount: details.amount,
        email: details.customerEmail,
        phone: details.customerPhone,
        paymentMethod: 'cash_on_delivery',
        status: 'pending_delivery',
      }),
    })
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('COD order creation error:', error)
    throw error
  }
}

// WhatsApp Order Handler
export const sendWhatsAppOrder = (
  customerName: string,
  customerPhone: string,
  orderDetails: string,
  amount: number,
  businessPhone: string = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '254712345678'
) => {
  const message = `Hi Serenleaf,\n\nI would like to place an order:\n\nCustomer Name: ${customerName}\nPhone: ${customerPhone}\n\nOrder Details:\n${orderDetails}\n\nTotal Amount: KSH ${amount.toFixed(2)}\n\nPlease confirm my order.`
  
  const encodedMessage = encodeURIComponent(message)
  const whatsappLink = `https://wa.me/${businessPhone}?text=${encodedMessage}`
  
  window.open(whatsappLink, '_blank')
}

// Payment verification
export const verifyPayment = async (transactionId: string) => {
  try {
    const response = await fetch(`/api/payments/verify?transactionId=${transactionId}`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Payment verification error:', error)
    throw error
  }
}
