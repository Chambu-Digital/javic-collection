'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Package, CheckCircle, Clock, XCircle, MapPin, ShoppingBag, Phone } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'

interface Order {
  _id: string
  orderNumber: string
  status: 'pending' | 'completed' | 'cancelled'
  items: Array<{ productName: string; productImage: string; quantity: number; price: number; totalPrice: number }>
  totalAmount: number
  shippingAddress: { name: string; phone: string; county: string; area: string }
  createdAt: string
  updatedAt: string
}

export default function TrackOrderPage() {
  const [searchType, setSearchType] = useState<'order' | 'phone'>('order')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [notFound, setNotFound] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setNotFound(false)
    setOrder(null)

    try {
      const params = new URLSearchParams({ [searchType]: searchQuery.trim() })
      const res = await fetch(`/api/orders/track?${params}`)
      const data = await res.json()
      if (res.ok && data.order) {
        setOrder(data.order)
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'completed') return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1 inline" />Completed</Badge>
    if (status === 'cancelled') return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1 inline" />Cancelled</Badge>
    return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1 inline" />Pending</Badge>
  }

  const getStatusMessage = (status: string) => {
    if (status === 'completed') return 'Your order has been completed and delivered.'
    if (status === 'cancelled') return 'This order was cancelled. Contact us if you have questions.'
    return 'Your order has been received and is being processed. We will contact you on WhatsApp shortly.'
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">Enter your order number or WhatsApp number to check status</p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setSearchType('order')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${searchType === 'order' ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Order Number
                </button>
                <button type="button" onClick={() => setSearchType('phone')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${searchType === 'phone' ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  WhatsApp Number
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={searchType === 'order' ? 'e.g. JV250325001' : 'e.g. 0712345678'}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  <Search className="w-4 h-4 mr-2" />
                  {loading ? 'Searching...' : 'Track'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Not found */}
        {notFound && (
          <Card className="mb-6">
            <CardContent className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Order Not Found</h3>
              <p className="text-gray-500 text-sm mb-4">Check your order number or WhatsApp number and try again.</p>
              <a href="https://wa.me/254723277306" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4 mr-2" />Contact Us on WhatsApp
                </Button>
              </a>
            </CardContent>
          </Card>
        )}

        {/* Order found */}
        {order && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order #{order.orderNumber}</CardTitle>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{getStatusMessage(order.status)}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Order Date</p>
                    <p className="font-medium">{new Date(order.createdAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-medium">KSH {order.totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>{order.shippingAddress.area}, {order.shippingAddress.county}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />Items ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <img src={item.productImage || '/placeholder.svg'} alt={item.productName}
                        className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity} × KSH {item.price.toLocaleString()}</p>
                      </div>
                      <p className="font-medium text-sm">KSH {item.totalPrice.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {order.status === 'pending' && (
              <div className="text-center">
                <a href="https://wa.me/254723277306" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    <Phone className="w-4 h-4 mr-2" />Ask about your order on WhatsApp
                  </Button>
                </a>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
