'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  initiateMpesaPayment,
  processCashOnDelivery,
  sendWhatsAppOrder,
  getBankTransferDetails,
  type PaymentMethod,
} from '@/lib/payment-service'

interface PaymentGatewayProps {
  method: PaymentMethod
  amount: number
  customerEmail: string
  customerPhone: string
  customerName: string
  orderId: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function PaymentGateway({
  method,
  amount,
  customerEmail,
  customerPhone,
  customerName,
  orderId,
  onSuccess,
  onError,
}: PaymentGatewayProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleMpesaPayment = async () => {
    setLoading(true)
    setStatus('processing')
    try {
      const response = await initiateMpesaPayment({
        method: 'mpesa',
        amount,
        currency: 'KES',
        orderId,
        customerEmail,
        customerPhone,
      })

      if (response.success) {
        setStatus('success')
        setMessage('M-Pesa prompt sent to your phone. Complete the payment.')
        onSuccess?.()
      } else {
        setStatus('error')
        setMessage('Failed to initiate M-Pesa payment. Please try again.')
        onError?.(message)
      }
    } catch (error) {
      setStatus('error')
      setMessage('Error processing payment. Please try again.')
      onError?.(message)
    } finally {
      setLoading(false)
    }
  }

  const handleCashOnDelivery = async () => {
    setLoading(true)
    setStatus('processing')
    try {
      const response = await processCashOnDelivery({
        method: 'cod',
        amount,
        currency: 'KES',
        orderId,
        customerEmail,
        customerPhone,
      })

      if (response.success) {
        setStatus('success')
        setMessage('Order confirmed! You will pay on delivery.')
        onSuccess?.()
      } else {
        setStatus('error')
        setMessage('Failed to create order. Please try again.')
        onError?.(message)
      }
    } catch (error) {
      setStatus('error')
      setMessage('Error creating order. Please try again.')
      onError?.(message)
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppOrder = () => {
    sendWhatsAppOrder(
      customerName,
      customerPhone,
      `Order ID: ${orderId}`,
      amount
    )
    setStatus('success')
    setMessage('WhatsApp opened. Please send your order details to complete.')
    onSuccess?.()
  }

  const bankDetails = getBankTransferDetails()

  return (
    <div className="space-y-4">
      {status === 'success' && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-800">{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{message}</p>
        </div>
      )}

      {method === 'mpesa' && (
        <Button
          onClick={handleMpesaPayment}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg font-semibold"
        >
          {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
          {loading ? 'Processing...' : `Pay KSH ${(amount * 130).toFixed(0)} with M-Pesa`}
        </Button>
      )}

      {method === 'bank' && (
        <div className="bg-muted p-6 rounded-lg space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">
              Bank Transfer Details
            </p>
            <div className="space-y-3 text-sm text-card-foreground">
              <div>
                <p className="text-muted-foreground">Bank Name</p>
                <p className="font-semibold">{bankDetails.bankName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Name</p>
                <p className="font-semibold">{bankDetails.accountName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Number</p>
                <p className="font-semibold font-mono">{bankDetails.accountNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-semibold">KSH {(amount * 130).toFixed(0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reference</p>
                <p className="font-semibold font-mono">{orderId}</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => {
              setStatus('success')
              setMessage('Please send a screenshot of your transfer receipt to confirm.')
              onSuccess?.()
            }}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4"
          >
            I Have Transferred
          </Button>
        </div>
      )}

      {method === 'cod' && (
        <div className="space-y-4">
          <div className="bg-secondary/20 p-4 rounded-lg">
            <p className="text-sm text-card-foreground">
              You will pay KSH {(amount * 130).toFixed(0)} when your order arrives.
            </p>
          </div>
          <Button
            onClick={handleCashOnDelivery}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg font-semibold"
          >
            {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {loading ? 'Processing...' : 'Confirm Cash on Delivery Order'}
          </Button>
        </div>
      )}

      {method === 'whatsapp' && (
        <Button
          onClick={handleWhatsAppOrder}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold"
        >
          {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
          Open WhatsApp to Order
        </Button>
      )}
    </div>
  )
}
