'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Star, Package, Calendar, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/use-auth'
import ReviewForm from './review-form'

interface OrderItem {
  _id: string
  productId: {
    _id: string
    name: string
    images: string[]
  }
  productName: string
  productImage: string
  variantDetails?: {
    type: string
    value: string
  }
  quantity: number
  price: number
}

interface Order {
  _id: string
  orderNumber: string
  items: OrderItem[]
  status: string
  deliveredAt: string
  createdAt: string
}

interface Review {
  _id: string
  productId: {
    _id: string
    name: string
    images: string[]
  }
  orderId: string
  orderItemId: string
  rating: number
  title: string
  comment: string
  images?: string[]
  status: 'pending' | 'approved' | 'rejected'
  moderationNotes?: string
  createdAt: string
}

export default function CustomerReviews() {
  const { user } = useAuth()
  const [eligibleOrders, setEligibleOrders] = useState<Order[]>([])
  const [myReviews, setMyReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{
    productId: string
    orderId: string
    orderItemId: string
    productName: string
  } | null>(null)

  useEffect(() => {
    if (user) {
      fetchEligibleOrders()
      fetchMyReviews()
    }
  }, [user])

  const fetchEligibleOrders = async () => {
    try {
      const response = await fetch('/api/orders?status=delivered')

      if (response.ok) {
        const data = await response.json()
        setEligibleOrders(data.orders)
      }
    } catch (error) {
      console.error('Error fetching eligible orders:', error)
    }
  }

  const fetchMyReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?userId=${user?.id}`)

      if (response.ok) {
        const data = await response.json()
        setMyReviews(data.reviews)
      }
    } catch (error) {
      console.error('Error fetching my reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWriteReview = (productId: string, orderId: string, orderItemId: string, productName: string) => {
    setSelectedProduct({ productId, orderId, orderItemId, productName })
    setShowReviewForm(true)
  }

  const handleReviewSuccess = () => {
    setShowReviewForm(false)
    setSelectedProduct(null)
    fetchMyReviews()
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchMyReviews()
      }
    } catch (error) {
      console.error('Error deleting review:', error)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const isProductReviewed = (productId: string, orderId: string, orderItemId: string) => {
    return myReviews.some(review => 
      review.productId._id === productId && 
      review.orderId === orderId && 
      review.orderItemId === orderItemId
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Please log in to view and write reviews.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="write" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="write">Write Reviews</TabsTrigger>
          <TabsTrigger value="my-reviews">My Reviews ({myReviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="write" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Products Available for Review</CardTitle>
              <p className="text-sm text-gray-600">
                You can review products from delivered orders
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : eligibleOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No delivered orders found.</p>
                  <p className="text-sm">Complete an order to write reviews!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {eligibleOrders.map((order) => (
                    <div key={order._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">Order #{order.orderNumber}</h4>
                          <p className="text-sm text-gray-600">
                            Delivered on {new Date(order.deliveredAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {order.items.map((item) => {
                          const isReviewed = isProductReviewed(item.productId._id, order._id, item._id)
                          
                          return (
                            <div key={item._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div className="flex-1">
                                <h5 className="font-medium">{item.productName}</h5>
                                {item.variantDetails && (
                                  <p className="text-sm text-gray-600">
                                    {item.variantDetails.type}: {item.variantDetails.value}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600">
                                  Quantity: {item.quantity}
                                </p>
                              </div>
                              <div>
                                {isReviewed ? (
                                  <Badge variant="secondary">Reviewed</Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleWriteReview(
                                      item.productId._id,
                                      order._id,
                                      item._id,
                                      item.productName
                                    )}
                                  >
                                    Write Review
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-reviews" className="space-y-4">
          {myReviews.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-gray-500">
                  <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>You haven't written any reviews yet.</p>
                  <p className="text-sm">Share your experience with other customers!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myReviews.map((review) => (
                <Card key={review._id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Review Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <img
                            src={review.productId.images[0]}
                            alt={review.productId.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div>
                            <h4 className="font-semibold">{review.productId.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">{renderStars(review.rating)}</div>
                              {getStatusBadge(review.status)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {review.status === 'pending' && (
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteReview(review._id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Review Content */}
                      <div>
                        <h5 className="font-medium mb-2">{review.title}</h5>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>

                      {/* Review Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2">
                          {review.images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Review image ${index + 1}`}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ))}
                        </div>
                      )}

                      {/* Review Footer */}
                      <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        {review.status === 'rejected' && review.moderationNotes && (
                          <div className="text-red-600">
                            Reason: {review.moderationNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Form Dialog */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Write Review</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ReviewForm
              productId={selectedProduct.productId}
              orderId={selectedProduct.orderId}
              orderItemId={selectedProduct.orderItemId}
              productName={selectedProduct.productName}
              onSuccess={handleReviewSuccess}
              onCancel={() => setShowReviewForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}