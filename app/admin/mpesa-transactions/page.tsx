'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CreditCard, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle,
  RefreshCw,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface MpesaTransaction {
  _id: string
  merchantRequestID: string
  checkoutRequestID: string
  resultCode: number
  resultDesc: string
  mpesaReceiptNumber?: string
  transactionDate?: string
  phoneNumber: string
  amount: number
  orderId?: {
    _id: string
    orderNumber: string
    totalAmount: number
    status: string
    paymentStatus: string
  }
  orderNumber?: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed'
  responseCode?: string
  responseDescription?: string
  customerMessage?: string
  createdAt: string
  updatedAt: string
}

interface TransactionStats {
  total: number
  completed: number
  pending: number
  failed: number
  totalRevenue: number
}

export default function AdminMpesaTransactionsPage() {
  const [transactions, setTransactions] = useState<MpesaTransaction[]>([])
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchTransactions()
  }, [currentPage, statusFilter, paymentStatusFilter, searchTerm])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentStatusFilter !== 'all' && { paymentStatus: paymentStatusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/admin/mpesa-transactions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
        setStats(data.stats || null)
        setTotalPages(data.pagination?.pages || 1)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (status === 'completed' && paymentStatus === 'paid') {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    }
    if (status === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
    if (status === 'failed') {
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>
    }
    if (status === 'cancelled') {
      return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>
    }
    return <Badge variant="outline">{status}</Badge>
  }

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    if (phone.startsWith('254')) {
      return `+${phone}`
    }
    return phone
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">M-Pesa Transactions</h1>
          <p className="text-gray-600 mt-1">View and manage all M-Pesa payment transactions</p>
        </div>
        <Button onClick={fetchTransactions} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KSH {stats.totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentStatusFilter} onValueChange={(value) => {
              setPaymentStatusFilter(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setPaymentStatusFilter('all')
                setCurrentPage(1)
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${transactions.length} transaction(s) found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No transactions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Date</th>
                    <th className="text-left p-3 font-semibold">Phone</th>
                    <th className="text-left p-3 font-semibold">Amount</th>
                    <th className="text-left p-3 font-semibold">Receipt</th>
                    <th className="text-left p-3 font-semibold">Order</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="text-sm">
                          {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(transaction.createdAt), 'HH:mm:ss')}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium">
                          {formatPhoneNumber(transaction.phoneNumber)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-semibold">
                          KSH {transaction.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="p-3">
                        {transaction.mpesaReceiptNumber ? (
                          <div className="text-sm font-mono">
                            {transaction.mpesaReceiptNumber}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {transaction.orderId ? (
                          <Link
                            href={`/admin/orders/${transaction.orderId._id}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {transaction.orderId.orderNumber}
                          </Link>
                        ) : transaction.orderNumber ? (
                          <span className="text-sm">{transaction.orderNumber}</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {getStatusBadge(transaction.status, transaction.paymentStatus)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {transaction.orderId && (
                            <Link href={`/admin/orders/${transaction.orderId._id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
