'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Search, 
  Filter,
  Mail,
  Phone,
  Calendar,
  MapPin,
  UserCheck,
  UserX,
  Eye
} from 'lucide-react'

interface Customer {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  isActive: boolean
  isEmailVerified: boolean
  addresses: Array<{
    name: string
    phone: string
    county: string
    area: string
    type: string
  }>
  createdAt: string
  updatedAt: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')


  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCustomerStatus = async (customerId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        fetchCustomers()
      }
    } catch (error) {
      console.error('Error updating customer status:', error)
    }
  }



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && customer.isActive) ||
      (statusFilter === 'inactive' && !customer.isActive)
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
        <p className="text-gray-600 mt-2">
          View and manage customer accounts
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
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
        ) : filteredCustomers.length > 0 ? (
          <>
            <div className="text-sm text-gray-600 mb-4">
              Showing {filteredCustomers.length} of {customers.length} customers
            </div>
            
            {filteredCustomers.map((customer) => (
              <Card key={customer._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Users className="h-4 w-4 text-gray-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {customer.firstName} {customer.lastName}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-3 w-3" />
                            Joined {formatDate(customer.createdAt)}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {customer.addresses.length > 0 && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="h-3 w-3" />
                              {customer.addresses[0].area}, {customer.addresses[0].county}
                            </div>
                          )}
                          <div className="text-gray-600">
                            {customer.addresses.length} address{customer.addresses.length !== 1 ? 'es' : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Badge 
                            variant={customer.isActive ? 'default' : 'secondary'}
                            className={customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          
                          {customer.isEmailVerified && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/admin/customers/${customer._id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCustomerStatus(customer._id, customer.isActive)}
                        >
                          {customer.isActive ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No customers have registered yet'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}