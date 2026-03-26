'use client'

import { useState, useEffect, use } from 'react'
import { Star, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

interface OrderItem {
  orderItemId: string
  productId: string
  productName: string
  productImage: string
  quantity: number
}

type PageState = 'loading' | 'valid' | 'invalid' | 'submitting' | 'success'

export default function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [pageState, setPageState] = useState<PageState>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [orderId, setOrderId] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [items, setItems] = useState<OrderItem[]>([])
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [customerName, setCustomerName] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)

  useEffect(() => {
    validateToken()
  }, [token])

  const validateToken = async () => {
    try {
      const res = await fetch(`/api/reviews/verify/${token}`)
      const data = await res.json()
      if (!data.valid) {
        setErrorMsg(data.error || 'This review link is no longer valid.')
        setPageState('invalid')
        return
      }
      setOrderId(data.orderId)
      setOrderNumber(data.orderNumber)
      setItems(data.items)
      setPageState('valid')
    } catch {
      setErrorMsg('Failed to load review page. Please try again.')
      setPageState('invalid')
    }
  }

  const handleSubmit = async () => {
    const item = items[currentItemIndex]
    if (!customerName.trim()) return alert('Please enter your name.')
    if (rating === 0) return alert('Please select a rating.')

    setSubmitting(true)
    try {
      const res = await fetch(`/api/reviews/verify/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          orderItemId: item.orderItemId,
          rating,
          comment,
          customerName
        })
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to submit review.')
        setSubmitting(false)
        return
      }

      const newCount = reviewedCount + 1
      setReviewedCount(newCount)

      if (newCount < items.length) {
        setCurrentItemIndex(currentItemIndex + 1)
        setRating(0)
        setComment('')
      } else {
        setPageState('success')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a0010, #2d0020)' }}>
        <Loader2 className="w-10 h-10 animate-spin text-pink-400" />
      </div>
    )
  }

  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #1a0010, #2d0020)' }}>
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Not Valid</h1>
          <p className="text-gray-500 mb-6">{errorMsg}</p>
          <Link href="/">
            <Button className="w-full" style={{ background: 'linear-gradient(135deg, #CC0066, #FF0080)' }}>
              Back to Store
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #1a0010, #2d0020)' }}>
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-500 mb-2">Your review{reviewedCount > 1 ? 's have' : ' has'} been submitted.</p>
          <p className="text-sm text-gray-400 mb-6">It will appear on the product page once approved.</p>
          <Link href="/">
            <Button className="w-full" style={{ background: 'linear-gradient(135deg, #CC0066, #FF0080)' }}>
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentItem = items[currentItemIndex]

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(135deg, #1a0010, #2d0020)' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center" style={{ background: 'linear-gradient(135deg, #990044, #FF0080)' }}>
          <img src="/javic-logo1.png" alt="Javic" className="h-12 mx-auto mb-3 object-contain"
            onError={e => { (e.target as HTMLImageElement).src = '/javiclogo.png' }} />
          <h1 className="text-white font-bold text-xl tracking-wide">JAVIC COLLECTION</h1>
          <p className="text-pink-100 text-sm mt-1">Order #{orderNumber}</p>
          {items.length > 1 && (
            <p className="text-pink-200 text-xs mt-1">
              Review {currentItemIndex + 1} of {items.length}
            </p>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Product */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
            <img
              src={currentItem.productImage && currentItem.productImage.startsWith('http') 
                ? currentItem.productImage 
                : currentItem.productImage || '/placeholder.svg'}
              alt={currentItem.productName}
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
            />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{currentItem.productName}</p>
              <p className="text-xs text-gray-500">Qty: {currentItem.quantity}</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />
          </div>

          {/* Stars */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Comment <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={3}
              maxLength={500}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 resize-none"
            />
            <p className="text-xs text-gray-400 text-right">{comment.length}/500</p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0 || !customerName.trim()}
            className="w-full py-3 text-base font-semibold"
            style={{ background: 'linear-gradient(135deg, #CC0066, #FF0080)' }}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            ) : items.length > 1 && currentItemIndex < items.length - 1 ? (
              'Submit & Review Next Product'
            ) : (
              'Submit Review'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
