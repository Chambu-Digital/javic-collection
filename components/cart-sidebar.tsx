'use client'

import { useState } from 'react'
import { Plus, Minus, ShoppingBag, Trash2, MessageCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useCartStore } from '@/lib/cart-store'
import { useUserStore } from '@/lib/user-store'
import { sendWhatsAppOrder } from '@/lib/whatsapp-service'
import { useToast } from '@/components/ui/custom-toast'
import Link from 'next/link'

interface CartSidebarProps {
  children: React.ReactNode
}

type CartView = 'items' | 'checkout'

export default function CartSidebar({ children }: CartSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<CartView>('items')
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [location, setLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems, clearCart } = useCartStore()
  const { user } = useUserStore()
  const toast = useToast()

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(index)
      toast.success('Item removed from cart')
    } else {
      updateQuantity(index, newQuantity)
    }
  }

  const handleRemoveItem = (index: number, itemName: string) => {
    removeItem(index)
    toast.success(`${itemName} removed from cart`)
  }

  const handleClearCart = () => {
    clearCart()
    toast.success('Cart cleared')
  }

  const handleWhatsAppCheckout = async () => {
    if (!name.trim()) { toast.error('Please enter your name'); return }
    if (!whatsapp.trim()) { toast.error('Please enter your WhatsApp number'); return }
    if (!location.trim()) { toast.error('Please enter your delivery location'); return }

    setSubmitting(true)

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
      await sendWhatsAppOrder(
        name.trim(),
        whatsapp.trim(),
        orderItems,
        { county: location.trim(), area: location.trim() },
        undefined,
        undefined,
        user?.id  // attach user_id if logged in
      )

      setIsOpen(false)
      clearCart()
      setView('items')
      setName('')
      setWhatsapp('')
      setLocation('')
      toast.success('Order sent via WhatsApp!')
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to process order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setView('items') }}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {view === 'checkout' && (
              <button onClick={() => setView('items')} className="mr-1 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <ShoppingBag className="w-5 h-5" />
            {view === 'items' ? `Shopping Cart (${totalItems})` : 'Order Details'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Add some products to get started</p>
              <Button onClick={() => setIsOpen(false)}>Continue Shopping</Button>
            </div>
          ) : view === 'items' ? (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto py-4">
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={`${item.id}-${item.selectedSize || 'default'}-${item.selectedScent || 'default'}`}
                      className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.image || '/placeholder.svg'} alt={item.name} className="w-full h-full object-cover" />
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
                        <p className="text-base font-bold text-primary">KSH {item.price.toLocaleString()}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 border rounded-lg">
                            <Button variant="ghost" size="icon" className="h-8 w-8"
                              onClick={() => handleQuantityChange(index, item.quantity - 1)}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="px-2 text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8"
                              onClick={() => handleQuantityChange(index, item.quantity + 1)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveItem(index, item.name)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">KSH {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">KSH {totalPrice.toLocaleString()}</span>
                </div>
                <Button onClick={() => setView('checkout')}
                  className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 text-white">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Order via WhatsApp
                </Button>
                <Link href="/cart" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full">View Full Cart</Button>
                </Link>
                <Button variant="ghost" className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={handleClearCart}>
                  Clear Cart
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Checkout Form */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {/* Order summary */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700 truncate mr-2">{item.name} × {item.quantity}</span>
                      <span className="font-medium flex-shrink-0">KSH {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t pt-1 mt-1 flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">KSH {totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      WhatsApp Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                      placeholder="e.g. 0712 345 678"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                    />
                    <p className="text-xs text-gray-400 mt-1">We'll send your order confirmation here</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Delivery Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. Mombasa, Nairobi CBD, Kisumu..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="border-t pt-4">
                <Button
                  onClick={handleWhatsAppCheckout}
                  disabled={submitting || !name.trim() || !whatsapp.trim() || !location.trim()}
                  className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {submitting ? 'Sending...' : 'Confirm & Send via WhatsApp'}
                </Button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  You'll be redirected to WhatsApp to complete your order
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
