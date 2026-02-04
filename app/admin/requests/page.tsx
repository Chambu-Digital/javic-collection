'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  UserPlus, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Calendar,
  Mail,
  User,
  AlertCircle
} from 'lucide-react'
import { useUserStore } from '@/lib/user-store'
import { useNotifications } from '@/lib/use-notifications'
import PermissionSelectionModal from '@/components/admin/permission-selection-modal'

interface AdminRequest {
  _id: string
  firstName: string
  lastName: string
  email: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
}

export default function AdminRequestsPage() {
  const { user } = useUserStore()
  const { refresh: refreshNotifications } = useNotifications()
  const [requests, setRequests] = useState<AdminRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null)
  const [showPermissionModal, setShowPermissionModal] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/admin/requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveClick = (request: AdminRequest) => {
    setSelectedRequest(request)
    setShowPermissionModal(true)
  }

  const handleApproveWithPermissions = async (permissions: any) => {
    if (!selectedRequest) return

    try {
      const response = await fetch(`/api/admin/requests/${selectedRequest._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'approve',
          permissions
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Admin request approved successfully' })
        fetchRequests()
        refreshNotifications() // Refresh notification count
        setShowPermissionModal(false)
        setSelectedRequest(null)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve request')
      }
    } catch (error: any) {
      throw error // Let the modal handle the error
    }
  }

  const handleReject = async (requestId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'reject',
          rejectionReason: reason
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Admin request rejected' })
        fetchRequests()
        refreshNotifications() // Refresh notification count
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to reject request' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Only super admins can manage admin requests
  if (user?.role !== 'super_admin') {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only super administrators can manage admin requests.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Requests</h1>
        <p className="text-gray-600 mt-2">
          Review and manage admin access requests
        </p>
      </div>

      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : requests.length > 0 ? (
          <>
            {requests.map((request) => (
              <Card key={request._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(request.status)}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {request.firstName} {request.lastName}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {request.email}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Requested on {formatDate(request.requestedAt)}
                        </div>
                        {request.reviewedAt && (
                          <div className="text-sm text-gray-500">
                            Reviewed on {formatDate(request.reviewedAt)}
                          </div>
                        )}
                        {request.rejectionReason && (
                          <div className="text-sm text-red-600">
                            <span className="font-medium">Rejection reason: </span>
                            {request.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(request.status)}`}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>

                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveClick(request)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const reason = prompt('Reason for rejection:')
                              if (reason) {
                                handleReject(request._id, reason)
                              }
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No admin requests</h3>
              <p className="text-gray-500">
                No pending admin requests at the moment
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Permission Selection Modal */}
      <PermissionSelectionModal
        isOpen={showPermissionModal}
        onClose={() => {
          setShowPermissionModal(false)
          setSelectedRequest(null)
        }}
        adminRequest={selectedRequest}
        onApprove={handleApproveWithPermissions}
      />
    </div>
  )
}