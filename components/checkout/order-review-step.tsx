'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '../ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/cart-store'
import { MapPin, CreditCard, Package, Loader2, Truck } from 'lucide-react'
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

interface OrderReviewStepProps {
  selectedAddress: Address
  selectedPaymentMethod: PaymentMethod
  onBack: () => void
  onPlaceOrder: () => Promise<void>
}

export default function OrderReviewStep({
  selectedAddress,
  selectedPaymentMethod,
  onBack,
  onPlaceOrder
}: OrderReviewStepProps) {
  const { items, getTotalPrice, getItemPricing } = useCartStore()
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shippingCost, setShippingCost] = useState(0)
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState(0)
  const [loadingShipping, setLoadingShipping] = useState(true)

  const subtotal = getTotalPrice()
  const taxAmount = subtotal * 0.16 // 16% VAT
  const total = subtotal + shippingCost + taxAmount

  // Calculate shipping cost based on selected address
  useEffect(() => {
    calculateShipping()
  }, [selectedAddress])

  const calculateShipping = async () => {
    if (!selectedAddress.county || !selectedAddress.area) {
      setShippingCost(0)
      setEstimatedDeliveryDays(0)
      setLoadingShipping(false)
      return
    }

    try {
      setLoadingShipping(true)
      
      // First get the county
      const countiesResponse = await fetch('/api/locations/counties')
      const countiesData = await countiesResponse.json()
      const county = countiesData.counties?.find((c: any) => c.name === selectedAddress.county)
      
      if (!county) {
        setShippingCost(0)
        setEstimatedDeliveryDays(0)
        return
      }

      // Then get areas for that county
      const areasResponse = await fetch(`/api/locations/counties/${county._id}/areas`)
      const areasData = await areasResponse.json()
      const area = areasData.areas?.find((a: any) => a.name === selectedAddress.area)
      
      if (area) {
        // Use area-specific shipping
        setShippingCost(area.shippingFee)
        setEstimatedDeliveryDays(area.estimatedDeliveryDays)
      } else {
        // Fall back to county default
        setShippingCost(county.defaultShippingFee)
        setEstimatedDeliveryDays(county.estimatedDeliveryDays)
      }
    } catch (error) {
      console.error('Error calculating shipping:', error)
      setShippingCost(0)
      setEstimatedDeliveryDays(0)
    } finally {
      setLoadingShipping(false)
    }
  }

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

  return (
    <div className="space-y-6">
      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Items ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => {
            const pricing = getItemPricing(item)
            
            return (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border rounded-lg">
                <div className="relative w-12 h-12 shrink-0">
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
                    <span>Qty: {item.quantity}</span>
                  </div>
                  {pricing.isWholesale && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      Wholesale Price
                    </Badge>
                  )}
                </div>
                
                <div className="text-right w-full sm:w-auto">
                  <p className="font-semibold text-sm">KSH {pricing.totalPrice.toFixed(2)}</p>
                  {pricing.savings > 0 && (
                    <p className="text-xs text-green-600">
                      Save KSH {pricing.savings.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="font-medium">{selectedAddress.name}</p>
              <p className="text-sm text-muted-foreground">{selectedAddress.phone}</p>
              <p className="text-sm text-muted-foreground">
                {selectedAddress.area}, {selectedAddress.county}
              </p>
            </div>
            {estimatedDeliveryDays > 0 && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                <Truck className="w-4 h-4" />
                <span>
                  Estimated delivery: {estimatedDeliveryDays} {estimatedDeliveryDays === 1 ? 'day' : 'days'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{paymentMethodNames[selectedPaymentMethod]}</p>
          <p className="text-sm text-muted-foreground">
            {selectedPaymentMethod === 'mpesa' 
              ? 'You will receive an M-Pesa prompt after placing the order'
              : 'Pay in cash when your order is delivered'
            }
          </p>
        </CardContent>
      </Card>

      {/* Order Summary */}
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
            {loadingShipping ? (
              <span className="text-gray-500">Calculating...</span>
            ) : shippingCost === 0 ? (
              <span className="text-green-600 font-semibold">FREE</span>
            ) : (
              <span>KSH {shippingCost.toFixed(2)}</span>
            )}
          </div>
          <div className="flex justify-between">
            <span>VAT (16%)</span>
            <span>KSH {taxAmount.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">KSH {total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-2">
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
              </a>
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Final step - Place your order</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1 order-2 sm:order-1" disabled={loading}>
            ← Back to Payment
          </Button>
          <Button 
            onClick={handlePlaceOrder}
            disabled={!acceptedTerms || loading}
            className="flex-1 order-1 sm:order-2"
            size="lg"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? 'Placing Order...' : `Place Order - KSH ${total.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  )
}