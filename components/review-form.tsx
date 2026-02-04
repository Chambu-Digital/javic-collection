'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Star, Upload, X } from 'lucide-react'
import { useToast } from '@/components/ui/custom-toast'
interface ReviewFormProps {
  productId: string
  orderId: string
  orderItemId: string
  productName: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ReviewForm({
  productId,
  orderId,
  orderItemId,
  productName,
  onSuccess,
  onCancel
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'review')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          return data.url
        }
        throw new Error('Upload failed')
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setImages([...images, ...uploadedUrls])
    } catch (error) {
      console.error('Error uploading images:', error)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!rating || !title.trim() || !comment.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const requestData = {
        productId,
        orderId,
        orderItemId,
        rating: Number(rating),
        title: title.trim(),
        comment: comment.trim(),
        images
      }
      

      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        onSuccess?.()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
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
        <CardTitle>Write a Review for {productName}</CardTitle>
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
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={100}
              required
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
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience with this product"
              rows={4}
              maxLength={1000}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/1000 characters
            </p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Add Photos (Optional)
            </label>
            <div className="space-y-3">
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="review-images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading || images.length >= 5}
                />
                <label
                  htmlFor="review-images"
                  className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-50 ${
                    uploading || images.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Add Photos'}
                </label>
                <span className="text-xs text-gray-500">
                  {images.length}/5 photos
                </span>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={submitting || !rating || !title.trim() || !comment.trim()}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Your review will be published after admin approval. Please be honest and helpful in your review.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}