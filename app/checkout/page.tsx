'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Stepper } from '@/components/ui/stepper'
import CheckoutStepOne from '@/components/checkout/checkout-step-one'
import CheckoutStepTwo from '@/components/checkout/checkout-step-two'
import { useCartStore } from '@/lib/cart-store'
import { useUserStore } from '@/lib/user-store'
import { toast } from 'sonner'

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

const steps = [
  { id: 'details', title: 'Order Details', description: 'Address & Payment' },
  { id: 'confirm', title: 'Confirm & Pay', description: 'Review & Place Order' }
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart, getTotalPrice, getItemPricing } = useCartStore()
  const { user } = useUserStore()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [calculatedShippingCost, setCalculatedShippingCost] = useState<number>(0)

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart')
    }
  }, [items.length, router])

  // Refresh user data on mount to ensure we have latest addresses
  useEffect(() => {
    const { refreshUser } = useUserStore.getState()
    refreshUser()
  }, [])

  // Auto-fill address for logged-in users
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      // First try to find default shipping address
      let addressToSelect = user.addresses.find(addr => 
        addr.type === 'shipping' && addr.isDefault
      )
      
      // If no default, use the first shipping address
      if (!addressToSelect) {
        addressToSelect = user.addresses.find(addr => addr.type === 'shipping')
      }
      
      // If still no shipping address, use any address as shipping
      if (!addressToSelect && user.addresses.length > 0) {
        addressToSelect = user.addresses[0]
      }
      
      if (addressToSelect) {
        setSelectedAddress(addressToSelect)
      }
    }
  }, [user])

  const handlePlaceOrder = async () => {
    if (!selectedAddress || !selectedPaymentMethod) {
      toast.error('Missing required information')
      return
    }

    // Only M-Pesa payment is supported now
    if (selectedPaymentMethod !== 'mpesa') {
      toast.error('Only M-Pesa payment is supported')
      return
    }

    try {
      // Prepare order items
      const orderItems = items.map(item => {
        const pricing = getItemPricing(item)
        return {
          productId: item.id,
          productName: item.name,
          productImage: item.image,
          variantId: item.variantId,
          variantDetails: item.selectedSize || item.selectedScent ? {
            type: item.selectedSize ? 'size' : 'scent',
            value: item.selectedSize || item.selectedScent || '',
            sku: item.variantId || ''
          } : undefined,
          quantity: item.quantity,
          price: pricing.unitPrice,
          totalPrice: pricing.totalPrice
        }
      })

      // Create order first
      toast.loading('Creating order...')
      
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          shippingAddress: {
            name: selectedAddress.name,
            phone: selectedAddress.phone,
            county: selectedAddress.county,
            area: selectedAddress.area
          },
          paymentMethod: 'mpesa',
          customerEmail: user?.email || 'guest@checkout.com',
          customerPhone: selectedAddress.phone,
          shippingCost: calculatedShippingCost
        })
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        toast.dismiss()
        const text = await response.text()
        console.error('Non-JSON response from order creation:', text)
        throw new Error('Server error: Invalid response format')
      }

      const data = await response.json()

      if (!response.ok) {
        toast.dismiss()
        throw new Error(data.error || 'Failed to create order')
      }

      // Initiate M-Pesa payment
      toast.dismiss()
      toast.loading('Initiating M-Pesa payment...')
      
      const mpesaResponse = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: data.order.totalAmount,
          phone: selectedAddress.phone,
          orderId: data.order._id,
          orderNumber: data.order.orderNumber
        })
      })

      const mpesaData = await mpesaResponse.json()

      if (!mpesaResponse.ok || !mpesaData.success) {
        toast.dismiss()
        throw new Error(mpesaData.error || 'Failed to initiate M-Pesa payment')
      }

      // Payment initiated successfully - redirect to waiting page
      // DON'T clear cart yet - only clear after payment confirmation
      toast.dismiss()
      toast.success('M-Pesa prompt sent! Please enter your PIN.')
      
      router.push(`/checkout/payment-pending?checkoutRequestID=${mpesaData.checkoutRequestID}&transactionId=${mpesaData.transactionId}&orderNumber=${data.order.orderNumber}`)
      
    } catch (error: any) {
      console.error('Checkout error:', error)
      toast.dismiss()
      toast.error(error.message || 'Failed to process checkout')
    }
  }

  if (items.length === 0) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-6 sm:mb-8">
          {currentStep === 1 ? 'Complete Your Order' : 'Confirm & Pay'}
        </h1>

        {/* Progress Stepper */}
        <div className="mb-6 sm:mb-8">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <div className="min-h-[400px] sm:min-h-[600px]">
          {currentStep === 1 && (
            <CheckoutStepOne
              selectedAddress={selectedAddress}
              onAddressSelect={setSelectedAddress}
              selectedPaymentMethod={selectedPaymentMethod}
              onPaymentMethodSelect={setSelectedPaymentMethod}
              onNext={() => setCurrentStep(2)}
              onShippingCostChange={setCalculatedShippingCost}
            />
          )}

          {currentStep === 2 && selectedAddress && selectedPaymentMethod && (
            <CheckoutStepTwo
              selectedAddress={selectedAddress}
              selectedPaymentMethod={selectedPaymentMethod}
              onBack={() => setCurrentStep(1)}
              onPlaceOrder={handlePlaceOrder}
              onShippingCostChange={setCalculatedShippingCost}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
