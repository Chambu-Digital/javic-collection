import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/Product'
import mongoose from 'mongoose'

// POST /api/orders/whatsapp - Create a WhatsApp order record
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { 
      customerName, 
      customerPhone, 
      customerEmail, 
      items, 
      shippingAddress,
      location,
      customerNotes,
      userId
    } = body
    
    if (!customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: customerName, customerPhone, and items are required' },
        { status: 400 }
      )
    }
    
    // Process order items and calculate totals
    let subtotal = 0
    const processedItems = []
    
    for (const item of items) {
      const itemTotal = item.price * item.quantity
      subtotal += itemTotal

      // Try to find product but don't fail if not found
      let productImage = item.image || '/placeholder-product.jpg'
      let productName = item.name || 'Product'
      try {
        if (mongoose.Types.ObjectId.isValid(item.productId)) {
          const product = await Product.findById(item.productId)
          if (product) {
            productName = item.name || product.name
            productImage = item.image || (product.images && product.images[0]) || productImage
          }
        }
      } catch (e) {
        // use cart data as fallback
      }

      processedItems.push({
        productId: item.productId,
        productName,
        productImage,
        variantId: item.variantId,
        variantDetails: item.variantDetails,
        quantity: item.quantity,
        price: item.price,
        totalPrice: itemTotal
      })
    }
    
    // Calculate shipping (free for orders over 5000, otherwise 500)
    const shippingCost = subtotal >= 5000 ? 0 : 500
    const totalAmount = subtotal + shippingCost

    // Generate order number
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const lastOrder = await Order.findOne({
      orderNumber: new RegExp(`^JV${year}${month}${day}`)
    }).sort({ orderNumber: -1 })
    const sequence = lastOrder ? parseInt(lastOrder.orderNumber.slice(-3)) + 1 : 1
    const orderNumber = `JV${year}${month}${day}${sequence.toString().padStart(3, '0')}`

    const order = new Order({
      orderNumber,
      ...(userId ? { userId: new mongoose.Types.ObjectId(userId) } : {}),
      customerEmail: customerEmail || 'guest@javic.co.ke',
      customerPhone: customerPhone,
      whatsapp_phone: customerPhone,
      items: processedItems,
      subtotal,
      shippingCost,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount,
      shippingAddress: {
        name: customerName,
        phone: customerPhone,
        county: shippingAddress?.county || location || 'Kenya',
        area: shippingAddress?.area || location || 'Kenya'
      },
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'cash_on_delivery',
      customerNotes: customerNotes || 'Order placed via WhatsApp',
      adminNotes: 'WhatsApp Order'
    })

    await order.save()

    return NextResponse.json({
      message: 'WhatsApp order recorded successfully',
      order: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating WhatsApp order:', error)
    return NextResponse.json(
      { error: 'Failed to create WhatsApp order' },
      { status: 500 }
    )
  }
}
