'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Package, CreditCard, MapPin } from 'lucide-react'
import Link from 'next/link'

// Prevent static generation since this page uses search params
export const dynamic = 'force-dynamic'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('orderNumber')
  const paymentMethod = searchParams.get('paymentMethod')
  
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-16">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Thank you for your order. We'll send you a confirmation email shortly.
          </p>
        </div>

        {orderNumber && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number:</span>
                <span className="font-semibold">{orderNumber}</span>
              </div>
              
              {paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-semibold">
                    {paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash on Delivery'}
                  </span>
                </div>
              )}

              {paymentMethod === 'mpesa' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900">M-Pesa Payment</p>
                      <p className="text-sm text-blue-700">
                        You will receive an M-Pesa prompt on your phone shortly. 
                        Please complete the payment to confirm your order.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900">Cash on Delivery</p>
                      <p className="text-sm text-green-700">
                        Your order will be delivered to your address. 
                        Please have the exact amount ready for payment.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">What's Next?</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-primary">1</span>
              </div>
              <p>We'll send you an order confirmation email with tracking details</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-primary">2</span>
              </div>
              <p>Your order will be processed and prepared for shipping</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-primary">3</span>
              </div>
              <p>We'll notify you when your order is shipped with tracking information</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
          <Button asChild className="flex-1">
            <Link href="/account/orders">View Orders</Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-8 sm:py-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Loading...
            </h1>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}