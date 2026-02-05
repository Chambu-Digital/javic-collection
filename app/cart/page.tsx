'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Trash2, Plus, Minus, MessageCircle, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { generateOrderMessage, sendWhatsAppMessage, sendWhatsAppOrder } from '@/lib/whatsapp-service'
import { useToast } from '@/components/ui/custom-toast'

export default function CartPage() {
  const { 
    items: cartItems, 
    isLoaded, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    getTotalPrice, 
    getTotalItems 
  } = useCartStore()
  const toast = useToast()

  const handleWhatsAppCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    // Format cart items for order recording
    const orderItems = cartItems.map(item => ({
      productId: item.id,
      name: `${item.name}${item.selectedSize ? ` (${item.selectedSize})` : ''}${item.selectedScent ? ` - ${item.selectedScent}` : ''}`,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
      variantId: item.variantId,
      variantDetails: {
        type: item.selectedSize ? 'size' : (item.selectedScent ? 'scent' : 'default'),
        value: item.selectedSize || item.selectedScent || 'default',
        sku: item.variantId || 'default'
      }
    }))

    try {
      // Send WhatsApp order with automatic recording
      await sendWhatsAppOrder(
        'Customer', // Default name - customer will provide real name in WhatsApp
        '+254713065412', // Placeholder - customer will provide real phone
        orderItems,
        { county: 'Nairobi', area: 'CBD' }, // Default location
        'whatsapp@javiccollection.co.ke' // Default email
      )
      
      // Clear cart after successful order
      clearCart()
      
      // Show success message
      toast.success('Order sent to WhatsApp and recorded in admin panel!')
    } catch (error) {
      console.error('Error processing WhatsApp order:', error)
      toast.error('Failed to process order. Please try again.')
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-8" />
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Shopping Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">Your cart is empty</p>
            <Link href="/">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${item.selectedSize}-${item.selectedScent}-${index}`} className="bg-white rounded-lg p-4 shadow-sm border">
                  {/* Mobile Layout */}
                  <div className="block sm:hidden">
                    <div className="flex gap-4 mb-4">
                      {/* Product Image - Larger for mobile */}
                      <Link href={`/product/${item.id}`} className="flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                        />
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${item.id}`}>
                          <h3 className="font-semibold text-base hover:text-primary cursor-pointer line-clamp-2">
                            {item.name}
                          </h3>
                        </Link>
                        
                        {/* Variations */}
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.selectedSize && <div>Size: {item.selectedSize}</div>}
                          {item.selectedScent && <div>Scent: {item.selectedScent}</div>}
                        </div>

                        {/* Price */}
                        <div className="mt-2">
                          {(() => {
                            const pricing = useCartStore.getState().getItemPricing(item)
                            return (
                              <div>
                                <p className="text-base font-bold text-primary">
                                  KSH {pricing.unitPrice.toFixed(2)}
                                  {pricing.isWholesale && (
                                    <span className="text-sm text-muted-foreground line-through ml-2">
                                      KSH {item.price.toFixed(2)}
                                    </span>
                                  )}
                                </p>
                                {pricing.isWholesale && (
                                  <p className="text-xs text-green-600 font-medium">
                                    Wholesale • Save KSH {(item.price - pricing.unitPrice).toFixed(2)}/item
                                  </p>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controls and Remove - Full width on mobile */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="p-2 hover:bg-gray-100 transition"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 font-semibold min-w-12 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="p-2 hover:bg-gray-100 transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Wholesale Progress - Mobile */}
                    {(() => {
                      const pricing = useCartStore.getState().getItemPricing(item)
                      return pricing.hasWholesale && !pricing.isWholesale && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-sm text-blue-600 mb-1">
                            Add {pricing.wholesaleThreshold - item.quantity} more for wholesale pricing
                          </p>
                          <div className="w-full bg-blue-100 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((item.quantity / pricing.wholesaleThreshold) * 100, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-blue-500 mt-1">
                            {item.quantity}/{pricing.wholesaleThreshold} needed
                          </p>
                        </div>
                      )
                    })()}

                    {/* Item Total - Mobile */}
                    <div className="mt-3 pt-3 border-t border-gray-100 text-right">
                      {(() => {
                        const pricing = useCartStore.getState().getItemPricing(item)
                        return (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Subtotal: <span className="font-semibold text-foreground">KSH {pricing.totalPrice.toFixed(2)}</span>
                            </p>
                            {pricing.savings > 0 && (
                              <p className="text-sm text-green-600 font-medium">
                                You save: KSH {pricing.savings.toFixed(2)}
                              </p>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:block">
                    <div className="flex items-start gap-4">
                      {/* Product Image - Larger for desktop */}
                      <Link href={`/product/${item.id}`} className="flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-28 h-28 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                        />
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${item.id}`}>
                          <h3 className="font-semibold text-lg hover:text-primary cursor-pointer">
                            {item.name}
                          </h3>
                        </Link>
                        
                        {/* Variations */}
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                          {item.selectedSize && item.selectedScent && <span> • </span>}
                          {item.selectedScent && <span>Scent: {item.selectedScent}</span>}
                        </div>

                        <div className="mt-2">
                          {(() => {
                            const pricing = useCartStore.getState().getItemPricing(item)
                            return (
                              <div>
                                <p className="text-lg font-bold text-primary">
                                  KSH {pricing.unitPrice.toFixed(2)}
                                  {pricing.isWholesale && (
                                    <span className="text-sm text-muted-foreground line-through ml-2">
                                      KSH {item.price.toFixed(2)}
                                    </span>
                                  )}
                                </p>
                                {pricing.isWholesale && (
                                  <p className="text-sm text-green-600 font-medium">
                                    Wholesale Price • Save KSH {(item.price - pricing.unitPrice).toFixed(2)} per item
                                  </p>
                                )}
                                {pricing.hasWholesale && !pricing.isWholesale && (
                                  <div className="mt-2">
                                    <p className="text-sm text-blue-600 mb-1">
                                      Add {pricing.wholesaleThreshold - item.quantity} more for wholesale pricing
                                    </p>
                                    <div className="w-full bg-blue-100 rounded-full h-1.5">
                                      <div 
                                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min((item.quantity / pricing.wholesaleThreshold) * 100, 100)}%` }}
                                      />
                                    </div>
                                    <p className="text-xs text-blue-500 mt-1">
                                      {item.quantity}/{pricing.wholesaleThreshold} needed • Save KSH {((item.price - item.wholesalePrice!) * pricing.wholesaleThreshold).toFixed(2)} total
                                    </p>
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100 transition"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-2 font-semibold min-w-12 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100 transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Item Total - Desktop */}
                    <div className="mt-3 pt-3 border-t border-gray-100 text-right">
                      {(() => {
                        const pricing = useCartStore.getState().getItemPricing(item)
                        return (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Subtotal: <span className="font-semibold text-foreground">KSH {pricing.totalPrice.toFixed(2)}</span>
                            </p>
                            {pricing.savings > 0 && (
                              <p className="text-sm text-green-600 font-medium">
                                You save: KSH {pricing.savings.toFixed(2)}
                              </p>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              ))}

              {/* Clear Cart */}
              <div className="pt-4">
                <Button
                  onClick={clearCart}
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear Cart
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 shadow-sm border sticky top-4">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span>Items ({getTotalItems()})</span>
                    <span>KSH {getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-gray-600">From KSH 150</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Subtotal</span>
                      <span className="text-primary">KSH {getTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* WhatsApp Checkout Button */}
                  <Button 
                    onClick={handleWhatsAppCheckout}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Order via WhatsApp
                  </Button>
                  
                  {/* Future Online Payment - Disabled for now */}
                  <Link href="/checkout">
                    <Button 
                      className="w-full bg-gray-400 text-gray-600 py-3 cursor-not-allowed opacity-50"
                      disabled
                    >
                      Online Payment (Coming Soon)
                      {/* <ArrowRight className="w-5 h-5 ml-2" /> */}
                    </Button>
                  </Link>
                </div>

                {/* WhatsApp Notice */}
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800 text-center">
                     Orders are processed via WhatsApp for personalized service
                  </p>
                </div>

                <Link href="/" className="block mt-4">
                  <Button variant="ghost" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  )
}