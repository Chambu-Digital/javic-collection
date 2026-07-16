'use client'

import { useState } from 'react'
import { Search, Filter, Download, Calendar, TrendingUp, DollarSign, Package, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function PosReportsPage() {
  const [dateRange, setDateRange] = useState('today')
  const [selectedReport, setSelectedReport] = useState('sales')

  const summaryData = {
    totalSales: 125000,
    onlineSales: 45000,
    posSales: 80000,
    retailSales: 95000,
    wholesaleSales: 30000,
    cashCollected: 70000,
    mpesaCollected: 55000,
    creditIssued: 15000,
    creditRepaid: 10000,
    outstandingCredit: 33000,
    discountsGiven: 5000,
    returns: 2000,
    refunds: 1500,
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Reports & Ledger</h1>
          <p className="text-gray-600">View sales, payments, and business activity</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-xl font-bold">KSH {summaryData.totalSales.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cash Collected</p>
                <p className="text-xl font-bold">KSH {summaryData.cashCollected.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Items Sold</p>
                <p className="text-xl font-bold">156</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-xl font-bold">42</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by order number, customer, or item..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={selectedReport} onValueChange={setSelectedReport}>
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="credit">Credit</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Online Sales</p>
                    <p className="text-lg font-semibold">KSH {summaryData.onlineSales.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">POS Sales</p>
                    <p className="text-lg font-semibold">KSH {summaryData.posSales.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Retail Sales</p>
                    <p className="text-lg font-semibold">KSH {summaryData.retailSales.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Wholesale Sales</p>
                    <p className="text-lg font-semibold">KSH {summaryData.wholesaleSales.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Cash</p>
                    <p className="text-sm text-gray-600">28 transactions</p>
                  </div>
                  <p className="text-lg font-semibold">KSH {summaryData.cashCollected.toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">M-Pesa</p>
                    <p className="text-sm text-gray-600">14 transactions</p>
                  </div>
                  <p className="text-lg font-semibold">KSH {summaryData.mpesaCollected.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Credit Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium">Credit Issued</p>
                    <p className="text-sm text-gray-600">8 transactions</p>
                  </div>
                  <p className="text-lg font-semibold text-red-600">KSH {summaryData.creditIssued.toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">Credit Repaid</p>
                    <p className="text-sm text-gray-600">5 transactions</p>
                  </div>
                  <p className="text-lg font-semibold text-green-600">KSH {summaryData.creditRepaid.toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium">Outstanding Balance</p>
                    <p className="text-sm text-gray-600">12 customers</p>
                  </div>
                  <p className="text-lg font-semibold text-yellow-600">KSH {summaryData.outstandingCredit.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ledger Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border-b">
                  <div>
                    <p className="font-medium">POS Sale #ORD12345</p>
                    <p className="text-sm text-gray-600">Cash payment - Jane Doe</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">KSH 5,000</p>
                    <p className="text-xs text-gray-500">10:30 AM</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border-b">
                  <div>
                    <p className="font-medium">Credit Repayment</p>
                    <p className="text-sm text-gray-600">M-Pesa - John Smith</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">KSH 2,000</p>
                    <p className="text-xs text-gray-500">09:45 AM</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border-b">
                  <div>
                    <p className="font-medium">Online Sale #ORD12344</p>
                    <p className="text-sm text-gray-600">M-Pesa payment</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">KSH 3,500</p>
                    <p className="text-xs text-gray-500">09:15 AM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
