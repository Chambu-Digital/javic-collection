'use client'

import { useState } from 'react'
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useCartStore } from '@/lib/cart-store'
import { generateOrderMessage, sendWhatsAppMessage, sendWhatsAppOrder } from '@/lib/whatsapp-service'
import { useToast } from '@/components/ui/custom-toast'
import Link from 'next/link'

interface CartSidebarProps {
  children: React.ReactNode
}

export default function CartSidebar({ children }: CartSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems, clearCart } = useCartStore()
  const toast = useToast()

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(index)
      toast.success('Item removed from cart')
    } else {
      updateQuantity(index, newQuantity)
    }
  }

  const handleRemoveItem = (index: number, name: string) => {
    removeItem(index)
    toast.success(`${name} removed from cart`)
  }

  const handleClearCart = () => {
    clearCart()
    toast.success('Cart cleared')
  }

  const handleWhatsAppCheckout = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    // Format cart items for order recording
    const orderItems = items.map(item => ({
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
        'whatsapp@electromatt.co.ke' // Default email
      )
      
      // Close cart sidebar
      setIsOpen(false)
      
      // Clear cart after successful order
      clearCart()
      
      // Show success message
      toast.success('Order sent to WhatsApp and recorded in admin panel!')
    } catch (error) {
      console.error('Error processing WhatsApp order:', error)
      toast.error('Failed to process order. Please try again.')
    }
  }

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Shopping Cart ({totalItems})
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Add some products to get started</p>
              <Button onClick={() => setIsOpen(false)}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto py-6">
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={`${item.id}-${item.selectedSize || 'default'}-${item.selectedScent || 'default'}`} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image || '/placeholder.svg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                        {(item.selectedSize || item.selectedScent) && (
                          <div className="text-sm text-gray-500">
                            {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                            {item.selectedSize && item.selectedScent && <span> • </span>}
                            {item.selectedScent && <span>Scent: {item.selectedScent}</span>}
                          </div>
                        )}
                        <p className="text-lg font-bold text-primary">
                          KSH {item.price.toLocaleString()}
                        </p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 border rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(index, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="px-2 text-sm font-medium min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(index, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveItem(index, item.name)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          KSH {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Summary */}
              <div className="border-t pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    KSH {totalPrice.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* WhatsApp Checkout Button */}
                  <Button 
                    onClick={handleWhatsAppCheckout}
                    className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Order via WhatsApp
                  </Button>
                  
                  {/* Future M-Pesa Checkout - Disabled for now */}
                  <Link href="/checkout" onClick={() => setIsOpen(false)}>
                    <Button 
                      variant="outline" 
                      className="w-full h-12 text-lg opacity-50 cursor-not-allowed"
                      disabled
                    >
                      Online Payment (Coming Soon)
                      {/* <ArrowRight className="w-5 h-5 ml-2" /> */}
                    </Button>
                  </Link>
                  
                  <Link href="/cart" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">
                      View Full Cart
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={handleClearCart}
                  >
                    Clear Cart
                  </Button>
                </div>

                {/* WhatsApp Notice */}
                {/* <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800 text-center">
                     Orders are processed via WhatsApp for personalized service
                  </p>
                </div> */}

               
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}