'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'

interface ActiveRatingDisplayProps {
  productId: string
  initialRating?: number
  initialReviews?: number
  size?: 'sm' | 'md' | 'lg'
  showReviewCount?: boolean
}

export default function ActiveRatingDisplay({ 
  productId, 
  initialRating = 0, 
  initialReviews = 0,
  size = 'sm',
  showReviewCount = true
}: ActiveRatingDisplayProps) {
  const [rating, setRating] = useState(initialRating)
  const [reviewCount, setReviewCount] = useState(initialReviews)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (productId) {
      fetchRealRating()
    }
  }, [productId])

  const fetchRealRating = async () => {
    if (!productId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/reviews/stats?productId=${productId}`)
      if (response.ok) {
        const data = await response.json()
        setRating(data.averageRating || 0)
        setReviewCount(data.totalReviews || 0)
      }
    } catch (error) {
      console.error('Error fetching rating:', error)
      // Fallback to initial values if API fails
      setRating(initialRating)
      setReviewCount(initialReviews)
    } finally {
      setLoading(false)
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'lg':
        return 'w-6 h-6'
      case 'md':
        return 'w-5 h-5'
      default:
        return 'w-4 h-4'
    }
  }

  const getTextSize = () => {
    switch (size) {
      case 'lg':
        return 'text-base'
      case 'md':
        return 'text-sm'
      default:
        return 'text-xs'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="flex gap-1">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className={`${getSizeClasses()} bg-gray-200 rounded`} />
          ))}
        </div>
        {showReviewCount && (
          <div className={`${getTextSize()} bg-gray-200 rounded w-12 h-4`} />
        )}
      </div>
    )
  }

  if (rating === 0 && reviewCount === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="flex gap-1">
          {Array(5).fill(0).map((_, i) => (
            <Star key={i} className={`${getSizeClasses()} text-gray-300`} />
          ))}
        </div>
        {showReviewCount && (
          <span className={`${getTextSize()}`}>No reviews yet</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array(5).fill(0).map((_, i) => (
          <Star
            key={i}
            className={`${getSizeClasses()} ${
              i < Math.floor(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      {showReviewCount && (
        <span className={`${getTextSize()} text-muted-foreground`}>
          {rating > 0 ? `${rating.toFixed(1)} (${reviewCount})` : `(${reviewCount})`}
        </span>
      )}
    </div>
  )
}