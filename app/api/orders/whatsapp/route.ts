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
      customerNotes,
      whatsappMessage 
    } = body
    
    if (!customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: customerName, customerPhone, and items are required' },
        { status: 400 }
      )
    }

    // Create a guest user ID for WhatsApp orders
    const guestUserId = new mongoose.Types.ObjectId()
    
    // Process order items and calculate totals
    let subtotal = 0
    const processedItems = []
    
    for (const item of items) {
      // Verify product exists
      const product = await Product.findById(item.productId)
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        )
      }
      
      const itemTotal = item.price * item.quantity
      subtotal += itemTotal
      
      processedItems.push({
        productId: item.productId,
        productName: item.name || product.name,
        productImage: item.image || (product.images && product.images[0]) || '/placeholder-product.jpg',
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
    
    // Create the order
    const order = new Order({
      userId: guestUserId,
      customerEmail: customerEmail || 'whatsapp@electromatt.co.ke',
      customerPhone: customerPhone,
      items: processedItems,
      subtotal,
      shippingCost,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount,
      shippingAddress: {
        name: customerName,
        phone: customerPhone,
        county: shippingAddress?.county || 'Nairobi',
        area: shippingAddress?.area || 'CBD'
      },
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'mpesa', // Default for WhatsApp orders
      customerNotes: customerNotes || 'Order placed via WhatsApp',
      adminNotes: `WhatsApp Order - Original Message: ${whatsappMessage || 'N/A'}`
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
