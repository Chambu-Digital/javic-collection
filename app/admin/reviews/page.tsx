'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Star, Search, Eye, Check, X, MessageSquare, Calendar, User, Package, Clock } from 'lucide-react'
import { useUserStore } from '@/lib/user-store'
import PermissionGuard, { PermissionCheck } from '@/components/admin/permission-guard'
import { PERMISSIONS } from '@/lib/permissions'

interface Review {
  _id: string
  productId: {
    _id: string
    name: string
    slug: string
    images: string[]
  }
  userId: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  rating: number
  title: string
  comment: string
  images?: string[]
  customerName: string
  status: 'pending' | 'approved' | 'rejected'
  moderatedBy?: {
    firstName: string
    lastName: string
  }
  moderatedAt?: string
  moderationNotes?: string
  helpfulVotes: number
  totalVotes: number
  createdAt: string
}

interface ReviewStats {
  pending: number
  approved: number
  rejected: number
  total: number
}

export default function AdminReviewsPage() {
  const { user } = useUserStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedReviews, setSelectedReviews] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRating, setSelectedRating] = useState('all')
  const [moderationNotes, setModerationNotes] = useState('')
  const [showModerationDialog, setShowModerationDialog] = useState(false)
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject'>('approve')

  useEffect(() => {
    if (user) {
      fetchReviews()
    }
  }, [user, currentPage, activeTab, searchTerm, selectedRating])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        status: activeTab === 'all' ? '' : activeTab,
        search: searchTerm
      })

      if (selectedRating && selectedRating !== 'all') {
        params.append('rating', selectedRating)
      }

      const response = await fetch(`/api/admin/reviews?${params}`)

      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
        setStats(data.stats)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAction = async () => {
    if (selectedReviews.length === 0) return

    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reviewIds: selectedReviews,
          action: bulkAction,
          moderationNotes
        })
      })

      if (response.ok) {
        setSelectedReviews([])
        setModerationNotes('')
        setShowModerationDialog(false)
        fetchReviews()
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
    }
  }

  const handleSingleAction = async (reviewId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: action === 'approve' ? 'approved' : 'rejected',
          moderationNotes: notes
        })
      })

      if (response.ok) {
        fetchReviews()
      }
    } catch (error) {
      console.error('Error updating review:', error)
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

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return <div>Access denied</div>
  }

  return (
    <PermissionGuard permissions={[PERMISSIONS.REVIEWS_VIEW]}>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Review Management</h1>
        <PermissionCheck permissions={[PERMISSIONS.REVIEWS_MODERATE]}>
          {selectedReviews.length > 0 && (
            <Dialog open={showModerationDialog} onOpenChange={setShowModerationDialog}>
            <DialogTrigger asChild>
              <Button>
                Bulk Action ({selectedReviews.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Review Action</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={bulkAction} onValueChange={(value: 'approve' | 'reject') => setBulkAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve Reviews</SelectItem>
                    <SelectItem value="reject">Reject Reviews</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Moderation notes (optional)"
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={handleBulkAction} className="flex-1">
                    {bulkAction === 'approve' ? 'Approve' : 'Reject'} {selectedReviews.length} Reviews
                  </Button>
                  <Button variant="outline" onClick={() => setShowModerationDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        </PermissionCheck>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <X className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedRating} onValueChange={setSelectedRating}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
          <TabsTrigger value="all">All Reviews ({stats.total})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No reviews found</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review._id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedReviews.includes(review._id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedReviews([...selectedReviews, review._id])
                          } else {
                            setSelectedReviews(selectedReviews.filter(id => id !== review._id))
                          }
                        }}
                      />
                      
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="flex">{renderStars(review.rating)}</div>
                              {getStatusBadge(review.status)}
                            </div>
                            <h3 className="font-semibold">{review.title}</h3>
                          </div>
                          <div className="flex gap-2">
                            {review.status === 'pending' && (
                              <PermissionCheck permissions={[PERMISSIONS.REVIEWS_MODERATE]}>
                                <Button
                                  size="sm"
                                  onClick={() => handleSingleAction(review._id, 'approve')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleSingleAction(review._id, 'reject')}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </PermissionCheck>
                            )}
                          </div>
                        </div>

                        {/* Review Content */}
                        <p className="text-gray-700">{review.comment}</p>

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

                        {/* Product and Customer Info */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            <span>{review.productId.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{review.customerName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          {review.helpfulVotes > 0 && (
                            <span>{review.helpfulVotes}/{review.totalVotes} found helpful</span>
                          )}
                        </div>

                        {/* Moderation Info */}
                        {review.moderatedAt && (
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            <p>
                              <strong>Moderated by:</strong> {review.moderatedBy?.firstName} {review.moderatedBy?.lastName}
                            </p>
                            <p>
                              <strong>Date:</strong> {new Date(review.moderatedAt).toLocaleString()}
                            </p>
                            {review.moderationNotes && (
                              <p>
                                <strong>Notes:</strong> {review.moderationNotes}
                              </p>
                            )}
                          </div>
                        )}
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
        </TabsContent>
      </Tabs>
    </div>
    </PermissionGuard>
  )
}