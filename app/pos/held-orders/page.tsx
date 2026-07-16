'use client'

import { useState } from 'react'
import { Clock, Search, Filter, RotateCcw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HeldOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCashier, setFilterCashier] = useState('all')
  const [filterCustomer, setFilterCustomer] = useState('all')

  const mockHeldOrders = [
    {
      holdId: 'HLD20250715ABC123',
      items: [
        { productName: 'Bridal Robe', selectedSize: 'M', quantity: 2, actualUnitPrice: 1000 },
        { productName: 'Lace Bra Set', selectedSize: '8', quantity: 1, actualUnitPrice: 1000 },
      ],
      totalMinor: 3000,
      customer: { name: 'Jane Doe', phone: '+254712345678' },
      cashierName: 'John Smith',
      createdAt: new Date('2025-07-15T10:30:00'),
      holdReason: 'Customer went to get more items',
      notes: 'Customer wants to add matching accessories'
    },
    {
      holdId: 'HLD20250715DEF456',
      items: [
        { productName: 'XL Robe', selectedSize: '3XL', quantity: 1, actualUnitPrice: 1200 },
      ],
      totalMinor: 1200,
      customer: null,
      cashierName: 'Mary Johnson',
      createdAt: new Date('2025-07-15T11:45:00'),
      holdReason: 'Waiting for approval on discount',
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Held Orders</h1>
        <p className="text-gray-600">Resume or cancel incomplete orders</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by hold ID, customer, or order number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Held Orders List */}
      <div className="space-y-4">
        {mockHeldOrders.map((order) => (
          <Card key={order.holdId}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{order.holdId}</CardTitle>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {order.createdAt.toLocaleString()}
                    </span>
                    <span>Cashier: {order.cashierName}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Resume
                  </Button>
                  <Button variant="destructive" className="gap-2">
                    <XCircle className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.customer && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">{order.customer.name}</Badge>
                    <span className="text-gray-600">{order.customer.phone}</span>
                  </div>
                )}
                
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2">Items ({order.items.length})</p>
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.productName} {item.selectedSize && `(${item.selectedSize})`} × {item.quantity}</span>
                        <span>KSH {(item.actualUnitPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.holdReason && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
                    <span className="font-medium">Reason:</span> {order.holdReason}
                  </div>
                )}

                {order.notes && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {order.notes}
                  </div>
                )}

                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>KSH {(order.totalMinor / 100).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
