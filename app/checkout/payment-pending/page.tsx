'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { toast } from 'sonner'

function PaymentPendingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearCart } = useCartStore()
  
  const checkoutRequestID = searchParams.get('checkoutRequestID')
  const transactionId = searchParams.get('transactionId')
  const orderNumberParam = searchParams.get('orderNumber')
  
  const [status, setStatus] = useState<'pending' | 'completed' | 'failed'>('pending')
  const [orderNumber, setOrderNumber] = useState<string | null>(orderNumberParam)
  const [checking, setChecking] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(180) // 3 minutes in seconds

  // Poll for payment status
  useEffect(() => {
    if (!checkoutRequestID) return

    let pollCount = 0
    const maxPolls = 90 // Poll for 3 minutes (90 * 2 seconds)
    
    const pollInterval = setInterval(async () => {
      pollCount++
      setTimeRemaining(180 - (pollCount * 2)) // Update countdown
      
      try {
        const response = await fetch(`/api/payments/verify?checkoutRequestID=${checkoutRequestID}`)
        const data = await response.json()
        
        if (data.success && data.transaction) {
          if (data.transaction.paymentStatus === 'paid') {
            setStatus('completed')
            setOrderNumber(data.transaction.orderNumber)
            clearInterval(pollInterval)
            
            // Clear cart and redirect to success
            clearCart()
            toast.success('Payment successful!')
            
            setTimeout(() => {
              router.push(`/checkout/success?orderNumber=${data.transaction.orderNumber}&paymentMethod=mpesa`)
            }, 2000)
          } else if (data.transaction.paymentStatus === 'failed' && data.transaction.status === 'failed') {
            // Only show failed if transaction status is actually failed (M-Pesa responded)
            setStatus('failed')
            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
      }
      
      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        console.log('Payment timeout after', pollCount * 2, 'seconds')
        clearInterval(pollInterval)
        setStatus('failed')
      }
    }, 2000) // Check every 2 seconds

    return () => clearInterval(pollInterval)
  }, [checkoutRequestID, router, clearCart])

  const handleCheckStatus = async () => {
    if (!checkoutRequestID) return
    
    setChecking(true)
    try {
      const response = await fetch(`/api/payments/verify?checkoutRequestID=${checkoutRequestID}`)
      const data = await response.json()
      
      if (data.success && data.transaction) {
        if (data.transaction.paymentStatus === 'paid') {
          setStatus('completed')
          setOrderNumber(data.transaction.orderNumber)
          clearCart()
          toast.success('Payment confirmed!')
          router.push(`/checkout/success?orderNumber=${data.transaction.orderNumber}&paymentMethod=mpesa`)
        } else if (data.transaction.paymentStatus === 'failed') {
          setStatus('failed')
          toast.error('Payment failed')
        } else {
          toast.info('Payment still pending. Please complete on your phone.')
        }
      }
    } catch (error) {
      toast.error('Failed to check payment status')
    } finally {
      setChecking(false)
    }
  }

  const handleCancel = () => {
    router.push('/checkout')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-sm mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            {status === 'pending' && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
                
                <div>
                  <h1 className="text-xl font-semibold mb-2">Waiting to confirm...</h1>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleCheckStatus}
                    disabled={checking}
                    variant="outline"
                    className="w-full"
                  >
                    {checking ? 'Checking...' : 'Check Status'}
                  </Button>
                  
                  <Button
                    onClick={handleCancel}
                    variant="ghost"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {status === 'completed' && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                
                <div>
                  <h1 className="text-xl font-semibold text-green-600">Payment Successful!</h1>
                  <p className="text-muted-foreground">Redirecting...</p>
                </div>
              </div>
            )}

            {status === 'failed' && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
                
                <div>
                  <h1 className="text-xl font-semibold text-red-600">Payment Failed</h1>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => router.push('/checkout')}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/cart')}
                    variant="outline"
                    className="w-full"
                  >
                    Return to Cart
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <PaymentPendingContent />
    </Suspense>
  )
}
