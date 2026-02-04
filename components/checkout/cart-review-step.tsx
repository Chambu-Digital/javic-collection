'use client'

import { useCartStore } from '@/lib/cart-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Minus, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'

interface CartReviewStepProps {
  onNext: () => void
}

export default function CartReviewStep({ onNext }: CartReviewStepProps) {
  const { items, updateQuantity, removeItem, getTotalPrice, getItemPricing } = useCartStore()

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Your cart is empty</p>
        </CardContent>
      </Card>
    )
  }

  const subtotal = getTotalPrice()
  const shippingCost = 0 // Free shipping
  const taxAmount = subtotal * 0.16 // 16% VAT
  const total = subtotal + shippingCost + taxAmount

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Your Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => {
            const pricing = getItemPricing(item)
            
            return (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg">
                <div className="relative w-16 h-16 shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <h3 className="font-medium text-sm">{item.name}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                    {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                    {item.selectedScent && <span>Scent: {item.selectedScent}</span>}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-semibold">
                      KSH {pricing.unitPrice.toFixed(2)}
                    </span>
                    {pricing.isWholesale && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Wholesale
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="ml-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold">KSH {pricing.totalPrice.toFixed(2)}</p>
                    {pricing.savings > 0 && (
                      <p className="text-xs text-green-600">
                        Save KSH {pricing.savings.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>KSH {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="text-green-600 font-semibold">FREE</span>
          </div>
          <div className="flex justify-between">
            <span>VAT (16%)</span>
            <span>KSH {taxAmount.toFixed(2)}</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">KSH {total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Next: Shipping Address</span>
          <span>Step 2 of 4</span>
        </div>
        <Button onClick={onNext} className="w-full" size="lg">
          Continue to Shipping Address →
        </Button>
      </div>
    </div>
  )
}