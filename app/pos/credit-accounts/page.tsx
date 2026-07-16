'use client'

import { useState } from 'react'
import { Search, CreditCard, DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function CreditAccountsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState('active')

  const mockCreditAccounts = [
    {
      customerId: '1',
      customerName: 'Jane Doe',
      customerPhone: '+254712345678',
      creditLimit: 15000,
      outstandingBalance: 5000,
      availableCredit: 10000,
      creditStatus: 'active',
      lastTransactionDate: new Date('2025-07-10'),
      totalCreditUsed: 25000,
    },
    {
      customerId: '2',
      customerName: 'John Smith',
      customerPhone: '+254798765432',
      creditLimit: 20000,
      outstandingBalance: 18000,
      availableCredit: 2000,
      creditStatus: 'active',
      lastTransactionDate: new Date('2025-07-12'),
      totalCreditUsed: 38000,
    },
    {
      customerId: '3',
      customerName: 'Mary Johnson',
      customerPhone: '+254755555555',
      creditLimit: 10000,
      outstandingBalance: 10000,
      availableCredit: 0,
      creditStatus: 'suspended',
      lastTransactionDate: new Date('2025-06-20'),
      totalCreditUsed: 15000,
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspended</Badge>
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800">Blocked</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Credit Accounts</h1>
        <p className="text-gray-600">Manage customer credit limits and repayments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Credit Limit</p>
                <p className="text-xl font-bold">KSH 45,000</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Outstanding Balance</p>
                <p className="text-xl font-bold">KSH 33,000</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Credit</p>
                <p className="text-xl font-bold">KSH 12,000</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">At Risk</p>
                <p className="text-xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by customer name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Credit Accounts */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <div className="space-y-4">
            {mockCreditAccounts.map((account) => (
              <Card key={account.customerId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{account.customerName}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{account.customerPhone}</p>
                    </div>
                    {getStatusBadge(account.creditStatus)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Credit Limit</p>
                      <p className="text-lg font-semibold">KSH {account.creditLimit.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Outstanding</p>
                      <p className="text-lg font-semibold text-red-600">KSH {account.outstandingBalance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Available</p>
                      <p className="text-lg font-semibold text-green-600">KSH {account.availableCredit.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <span>Total Credit Used: KSH {account.totalCreditUsed.toLocaleString()}</span>
                    <span>Last Transaction: {account.lastTransactionDate.toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View History
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Record Repayment
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Adjust Limit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
