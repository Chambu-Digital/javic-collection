'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, ThumbsUp, ThumbsDown, Verified, Calendar, User } from 'lucide-react'

interface Review {
  _id: string
  rating: number
  title: string
  comment: string
  images?: string[]
  customerName: string
  isVerifiedPurchase: boolean
  helpfulVotes: number
  totalVotes: number
  createdAt: string
}

interface ProductReviewsProps {
  productId: string
  averageRating?: number
  totalReviews?: number
}

export default function ProductReviews({ 
  productId, 
  averageRating: propAverageRating, 
  totalReviews: propTotalReviews 
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('createdAt')
  const [filterRating, setFilterRating] = useState('all')
  const [ratingDistribution, setRatingDistribution] = useState<{ [key: number]: number }>({})
  const [realAverageRating, setRealAverageRating] = useState(0)
  const [realTotalReviews, setRealTotalReviews] = useState(0)

  useEffect(() => {
    fetchReviews()
    fetchRatingDistribution()
  }, [productId, currentPage, sortBy, filterRating])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        productId,
        status: 'approved',
        page: currentPage.toString(),
        limit: '10',
        sortBy,
        sortOrder: sortBy === 'createdAt' ? 'desc' : 'asc'
      })

      if (filterRating && filterRating !== 'all') {
        params.append('rating', filterRating)
      }

      const response = await fetch(`/api/reviews?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRatingDistribution = async () => {
    try {
      const response = await fetch(`/api/reviews/stats?productId=${productId}`)
      if (response.ok) {
        const data = await response.json()
        setRatingDistribution(data.distribution)
        setRealAverageRating(data.averageRating || 0)
        setRealTotalReviews(data.totalReviews || 0)
      }
    } catch (error) {
      console.error('Error fetching rating distribution:', error)
    }
  }

  const handleHelpfulVote = async (reviewId: string, helpful: boolean) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ helpful })
      })

      if (response.ok) {
        fetchReviews() // Refresh to show updated vote counts
      }
    } catch (error) {
      console.error('Error voting on review:', error)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${starSize} ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  const renderRatingDistribution = () => {
    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = ratingDistribution[rating] || 0
          const percentage = realTotalReviews > 0 ? (count / realTotalReviews) * 100 : 0
          
          return (
            <div key={rating} className="flex items-center gap-2 text-sm">
              <span className="w-8">{rating}</span>
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-right">{count}</span>
            </div>
          )
        })}
      </div>
    )
  }

  if (realTotalReviews === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{realAverageRating.toFixed(1)}</div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(realAverageRating), 'md')}
              </div>
              <p className="text-gray-600">Based on {realTotalReviews} reviews</p>
            </div>

            {/* Rating Distribution */}
            <div>
              <h4 className="font-semibold mb-3">Rating Breakdown</h4>
              {renderRatingDistribution()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            <SelectItem value="5">5 stars only</SelectItem>
            <SelectItem value="4">4 stars only</SelectItem>
            <SelectItem value="3">3 stars only</SelectItem>
            <SelectItem value="2">2 stars only</SelectItem>
            <SelectItem value="1">1 star only</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Most recent</SelectItem>
            <SelectItem value="rating">Highest rated</SelectItem>
            <SelectItem value="helpfulVotes">Most helpful</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No reviews found for the selected filters.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Review Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(review.rating)}</div>
                        {review.isVerifiedPurchase && (
                          <Badge variant="secondary" className="text-xs">
                            <Verified className="w-3 h-3 mr-1" />
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold">{review.title}</h4>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Review Content */}
                  <p className="text-gray-700">{review.comment}</p>

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {review.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Review image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded border shrink-0"
                        />
                      ))}
                    </div>
                  )}

                  {/* Review Footer */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{review.customerName}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        Was this helpful?
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleHelpfulVote(review._id, true)}
                          className="h-8 px-2"
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          {review.helpfulVotes}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleHelpfulVote(review._id, false)}
                          className="h-8 px-2"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}