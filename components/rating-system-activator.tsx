'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, MessageSquare, Users, TrendingUp } from 'lucide-react'
import { useToast } from '@/components/ui/custom-toast'
import ReviewForm from '@/components/review-form'

interface RatingSystemActivatorProps {
  productId: string
  productName: string
}

export default function RatingSystemActivator({ productId, productName }: RatingSystemActivatorProps) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  // For demo purposes, we'll create a simplified review form that doesn't require authentication
  const handleQuickReview = async (rating: number, title: string, comment: string) => {
    if (!productId) {
      toast.error('Product ID is missing. Cannot submit review.')
      return
    }
    
    setIsSubmitting(true)
    try {
      // Create a demo review without authentication requirements
      const response = await fetch('/api/reviews/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          rating,
          title,
          comment,
          customerName: 'Anonymous Customer',
          isDemo: true
        })
      })

      if (response.ok) {
        toast.success('Thank you for your review! It has been submitted successfully.')
        setShowReviewForm(false)
        // Refresh the page to show the new review
        window.location.reload()
      } else {
        throw new Error('Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showReviewForm) {
    return <QuickReviewForm 
      productName={productName}
      onSubmit={handleQuickReview}
      onCancel={() => setShowReviewForm(false)}
      isSubmitting={isSubmitting}
    />
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          Share Your Experience
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Help other customers by sharing your experience with {productName}
          </p>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <MessageSquare className="w-6 h-6 text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">Share Review</p>
            </div>
            <div className="space-y-1">
              <Users className="w-6 h-6 text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">Help Others</p>
            </div>
            <div className="space-y-1">
              <TrendingUp className="w-6 h-6 text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">Build Trust</p>
            </div>
          </div>

          <Button 
            onClick={() => setShowReviewForm(true)}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Write a Review
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface QuickReviewFormProps {
  productName: string
  onSubmit: (rating: number, title: string, comment: string) => void
  onCancel: () => void
  isSubmitting: boolean
}

function QuickReviewForm({ productName, onSubmit, onCancel, isSubmitting }: QuickReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const toast = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating || !title.trim() || !comment.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    onSubmit(rating, title.trim(), comment.trim())
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1
      return (
        <button
          key={i}
          type="button"
          className="focus:outline-none"
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setRating(starValue)}
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              starValue <= (hoverRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-200'
            }`}
          />
        </button>
      )
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review {productName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1">
              {renderStars()}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {rating} out of 5 stars
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Review Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={100}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/100 characters
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience with this product"
              rows={4}
              maxLength={500}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || !rating || !title.trim() || !comment.trim()}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Your review will help other customers make informed decisions.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}