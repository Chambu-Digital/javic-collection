// WhatsApp integration service

export interface WhatsAppMessage {
  to: string
  message: string
  type: 'order' | 'inquiry' | 'support'
}

export const generateOrderMessage = (
  firstName: string,
  lastName: string,
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number,
  address: string
): string => {
  const itemsList = items
    .map((item) => `${item.name} (Qty: ${item.quantity}) - KSH ${item.price.toFixed(2)}`)
    .join('\n')

  return `Hello JAVIC COLLECTION!

I would like to place an order:

Customer Details:
Name: ${firstName} ${lastName}
Address: ${address}

Order Items:
${itemsList}

Total: KSH ${total.toFixed(2)}

Please confirm my order and provide payment details.

Thank you!`
}

export const generateInquiryMessage = (
  name: string,
  inquiry: string
): string => {
  return `Hello JAVIC COLLECTION!

I have an inquiry:

Name: ${name}
Message: ${inquiry}

Please get back to me soon.

Thank you!`
}

export const generateSupportMessage = (
  orderNumber: string,
  issue: string
): string => {
  return `Hello JAVIC COLLECTION!

I need help with my order:

Order Number: ${orderNumber}
Issue: ${issue}

Please assist me.

Thank you!`
}

export const sendWhatsAppMessage = (
  message: string,
  businessPhone: string = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '254706512984'
) => {
  const encodedMessage = encodeURIComponent(message)
  const whatsappLink = `https://wa.me/${businessPhone}?text=${encodedMessage}`
  window.open(whatsappLink, '_blank')
}

export const sendWhatsAppOrder = async (
  customerName: string,
  customerPhone: string,
  items: Array<{ 
    productId: string; 
    name: string; 
    quantity: number; 
    price: number; 
    image?: string;
    variantId?: string;
    variantDetails?: any;
  }>,
  shippingAddress?: { county: string; area: string },
  customerEmail?: string,
  businessPhone: string = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '254706512984'
) => {
  // Generate the WhatsApp message
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shippingCost = total >= 5000 ? 0 : 500
  const finalTotal = total + shippingCost
  
  const itemsList = items
    .map((item) => `${item.name} (Qty: ${item.quantity}) - KSH ${item.price.toLocaleString()}`)
    .join('\n')

  const message = `Hello JAVIC COLLECTION!

I would like to place an order:

Customer Details:
Name: ${customerName}
Phone: ${customerPhone}
${shippingAddress ? `Location: ${shippingAddress.area}, ${shippingAddress.county}` : ''}

Order Items:
${itemsList}

Subtotal: KSH ${total.toLocaleString()}
Shipping: KSH ${shippingCost.toLocaleString()}
Total: KSH ${finalTotal.toLocaleString()}

Please confirm my order and provide payment details.

Thank you!`

  try {
    // Record the order in the database
    const response = await fetch('/api/orders/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerName,
        customerPhone,
        customerEmail,
        items,
        shippingAddress,
        customerNotes: 'Order placed via WhatsApp',
        whatsappMessage: message
      })
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Order recorded:', data.order.orderNumber)
      
      // Add order number to the message
      const messageWithOrderNumber = `${message}

Order Reference: ${data.order.orderNumber}`
      
      // Send to WhatsApp
      const encodedMessage = encodeURIComponent(messageWithOrderNumber)
      const whatsappLink = `https://wa.me/${businessPhone}?text=${encodedMessage}`
      window.open(whatsappLink, '_blank')
      
      return data.order
    } else {
      console.error('Failed to record order')
      // Still send to WhatsApp even if recording fails
      const encodedMessage = encodeURIComponent(message)
      const whatsappLink = `https://wa.me/${businessPhone}?text=${encodedMessage}`
      window.open(whatsappLink, '_blank')
    }
  } catch (error) {
    console.error('Error recording WhatsApp order:', error)
    // Still send to WhatsApp even if recording fails
    const encodedMessage = encodeURIComponent(message)
    const whatsappLink = `https://wa.me/${businessPhone}?text=${encodedMessage}`
    window.open(whatsappLink, '_blank')
  }
}

export const openWhatsAppChat = (
  businessPhone: string = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '254706512984'
) => {
  const whatsappLink = `https://wa.me/${businessPhone}`
  window.open(whatsappLink, '_blank')
}

// Business profile information for WhatsApp
export const BUSINESS_PROFILE = {
  name: 'JAVIC COLLECTION',
  description: 'Kenya\'s premier fashion destination for luxury lingerie, sleepwear, innerwear, and sportswear. Premium fabrics, elegant designs, exceptional service.',
  address: 'Taveta Lane, Nairobi, Kenya',
  phone: '+254 706 512 984',
  email: 'sales@javiccollection.co.ke',
  website: 'https://javiccollection.co.ke',
  businessHours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-5PM',
  logo: '/javic-logo1.png'
}
