'use client'

import { useState } from 'react'
import { Search, Plus, Phone, Mail, MapPin, CreditCard, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PosCustomersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const mockCustomers = [
    {
      id: '1',
      name: 'Jane Doe',
      phone: '+254712345678',
      email: 'jane@example.com',
      location: 'Nairobi',
      creditEnabled: true,
      creditLimit: 15000,
      outstandingBalance: 5000,
      availableCredit: 10000,
      totalPurchases: 45000,
      lastPurchase: new Date('2025-07-10'),
    },
    {
      id: '2',
      name: 'John Smith',
      phone: '+254798765432',
      email: 'john@example.com',
      location: 'Mombasa',
      creditEnabled: false,
      creditLimit: 0,
      outstandingBalance: 0,
      availableCredit: 0,
      totalPurchases: 12000,
      lastPurchase: new Date('2025-07-05'),
    },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Customers</h1>
          <p className="text-gray-600">Manage customer accounts and credit</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4" />
          New Customer
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockCustomers.map((customer) => (
          <Card key={customer.id}>
            <CardHeader>
              <CardTitle className="text-lg">{customer.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                {customer.creditEnabled ? (
                  <Badge className="bg-green-100 text-green-800">Credit Enabled</Badge>
                ) : (
                  <Badge variant="secondary">No Credit</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{customer.location}</span>
              </div>

              {customer.creditEnabled && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Credit Limit:</span>
                    <span className="font-medium">KSH {customer.creditLimit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Outstanding:</span>
                    <span className="font-medium text-red-600">KSH {customer.outstandingBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Available:</span>
                    <span className="text-green-600">KSH {customer.availableCredit.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-600">Total Purchases:</span>
                <span className="font-medium">KSH {customer.totalPurchases.toLocaleString()}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1">
                  <History className="w-3 h-3" />
                  History
                </Button>
                {customer.creditEnabled && (
                  <Button variant="outline" size="sm" className="flex-1 gap-1">
                    <CreditCard className="w-3 h-3" />
                    Credit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Customer Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle>Create New Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Full Name *</label>
                <Input placeholder="Enter customer name" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone Number *</label>
                <Input placeholder="+254..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input placeholder="email@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Location</label>
                <Input placeholder="City/Area" />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button className="flex-1">Create Customer</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
