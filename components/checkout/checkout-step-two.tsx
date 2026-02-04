'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '../ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/cart-store'
import { useShippingCost } from '@/lib/use-shipping'
import { MapPin, CreditCard, Package, Loader2, Shield, Truck, Clock } from 'lucide-react'
import Image from 'next/image'

interface Address {
  _id?: string
  type: 'shipping' | 'billing'
  name: string
  phone: string
  county: string
  area: string
  isDefault: boolean
}

type PaymentMethod = 'mpesa' | 'cod'

interface CheckoutStepTwoProps {
  selectedAddress: Address
  selectedPaymentMethod: PaymentMethod
  onBack: () => void
  onPlaceOrder: () => Promise<void>
  onShippingCostChange?: (cost: number) => void
}

export default function CheckoutStepTwo({
  selectedAddress,
  selectedPaymentMethod,
  onBack,
  onPlaceOrder,
  onShippingCostChange
}: CheckoutStepTwoProps) {
  const { items, getTotalPrice, getItemPricing } = useCartStore()
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { shippingCost, loading: shippingLoading } = useShippingCost(
    selectedAddress.county, 
    selectedAddress.area
  )

  const subtotal = getTotalPrice()
  const taxAmount = 0 // No VAT
  const total = subtotal + shippingCost

  // Notify parent component of shipping cost changes
  React.useEffect(() => {
    if (!shippingLoading && onShippingCostChange) {
      onShippingCostChange(shippingCost)
    }
  }, [shippingCost, shippingLoading, onShippingCostChange])

  const handlePlaceOrder = async () => {
    if (!acceptedTerms) return
    
    setLoading(true)
    try {
      await onPlaceOrder()
    } catch (error) {
      console.error('Error placing order:', error)
    } finally {
      setLoading(false)
    }
  }

  const paymentMethodNames = {
    mpesa: 'M-Pesa',
    cod: 'Cash on Delivery'
  }

  const paymentMethodDetails = {
    mpesa: 'You will receive an M-Pesa prompt on your phone to complete the payment',
    cod: 'Pay in cash when your order is delivered to your address'
  }

  return (
    <div className="space-y-6">
      {/* Trust Signals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Shield className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-900">Secure Checkout</p>
            <p className="text-xs text-green-700">Your data is protected</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Truck className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Fast Delivery</p>
            <p className="text-xs text-blue-700">Delivered to your area</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <Clock className="w-5 h-5 text-purple-600" />
          <div>
            <p className="text-sm font-semibold text-purple-900">Fast Processing</p>
            <p className="text-xs text-purple-700">Ships within 24hrs</p>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Your Order ({items.length} items)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => {
            const pricing = getItemPricing(item)
            
            return (
              <div key={index} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="relative w-16 h-16 shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{item.name}</h3>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-1">
                    {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                    {item.selectedScent && <span>Scent: {item.selectedScent}</span>}
                    <span>Quantity: {item.quantity}</span>
                  </div>
                  {pricing.isWholesale && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      Wholesale Price - Save KSH {pricing.savings.toFixed(2)}
                    </Badge>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="font-semibold">KSH {pricing.totalPrice.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    KSH {pricing.unitPrice.toFixed(2)} each
                  </p>
                </div>
              </div>
            )
          })}

          <Separator />
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>KSH {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping to {selectedAddress.area}, {selectedAddress.county}</span>
              <span>
                {shippingLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : shippingCost === 0 ? (
                  <span className="text-green-600 font-semibold">FREE</span>
                ) : (
                  `KSH ${shippingCost.toFixed(2)}`
                )}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">KSH {total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-medium">{selectedAddress.name}</p>
              <p className="text-sm text-muted-foreground">{selectedAddress.phone}</p>
              <p className="text-sm text-muted-foreground">
                {selectedAddress.area}, {selectedAddress.county}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="w-4 h-4" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{paymentMethodNames[selectedPaymentMethod]}</p>
              <p className="text-sm text-muted-foreground">
                {paymentMethodDetails[selectedPaymentMethod]}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Terms and Conditions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked: boolean) => setAcceptedTerms(checked)}
            />
            <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              I agree to the{' '}
              <a href="/terms" className="text-primary hover:underline" target="_blank">
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary hover:underline" target="_blank">
                Privacy Policy
              </a>. I confirm that all information provided is accurate.
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-4">
        <Button 
          onClick={handlePlaceOrder}
          disabled={!acceptedTerms || loading}
          className="w-full"
          size="lg"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {loading ? 'Processing Your Order...' : 
           selectedPaymentMethod === 'mpesa' ? 
           `Pay KSH ${total.toFixed(2)} with M-Pesa` : 
           `Place Order - KSH ${total.toFixed(2)}`
          }
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onBack} 
          disabled={loading}
          className="w-full"
        >
          ← Back to Order Details
        </Button>
      </div>

      {/* Security Notice */}
      <div className="text-center text-xs text-muted-foreground">
        <p>🔒 Your payment information is secure and encrypted</p>
      </div>
    </div>
  )
}