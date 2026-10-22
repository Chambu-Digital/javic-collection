'use client'

import JijiModernNav from '@/components/jiji-modern-nav'
import JijiBreadcrumb from '@/components/jiji-breadcrumb'
import Footer from '@/components/footer'
import BackToTop from '@/components/back-to-top'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Package, Truck, CheckCircle2, Clock, AlertCircle, MapPin } from 'lucide-react'
import { useState } from 'react'

interface TrackingInfo {
  trackingNumber: string
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered'
  sender: string
  recipient: string
  service: string
  weight: string
  currentLocation: string
  lastUpdate: string
  estimatedDelivery: string
  events: Array<{
    time: string
    location: string
    status: string
    description: string
  }>
}

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  // Demo tracking data
  const demoData: Record<string, TrackingInfo> = {
    'JF123456789': {
      trackingNumber: 'JF123456789',
      status: 'in_transit',
      sender: 'John Kipchoge, Nairobi',
      recipient: 'Sarah Mwangi, Kampala',
      service: 'Express Delivery',
      weight: '15 kg',
      currentLocation: 'Kisumu Hub',
      lastUpdate: new Date().toLocaleString(),
      estimatedDelivery: 'Today, 6:00 PM',
      events: [
        {
          time: '2 hours ago',
          location: 'Kisumu Hub',
          status: 'in_transit',
          description: 'Package picked up and in transit'
        },
        {
          time: '4 hours ago',
          location: 'Nairobi Hub',
          status: 'picked_up',
          description: 'Package picked up from sender'
        },
        {
          time: '1 day ago',
          location: 'Nairobi Hub',
          status: 'pending',
          description: 'Order received and confirmed'
        }
      ]
    },
    'JF987654321': {
      trackingNumber: 'JF987654321',
      status: 'delivered',
      sender: 'Tech Solutions Ltd, Nairobi',
      recipient: 'Electronics Store, Mombasa',
      service: 'Standard Shipping',
      weight: '45 kg',
      currentLocation: 'Mombasa Delivery Center',
      lastUpdate: 'Yesterday, 2:30 PM',
      estimatedDelivery: 'Delivered',
      events: [
        {
          time: 'Yesterday, 2:30 PM',
          location: 'Mombasa Hub',
          status: 'delivered',
          description: 'Package delivered successfully'
        },
        {
          time: 'Yesterday, 10:00 AM',
          location: 'Mombasa Hub',
          status: 'out_for_delivery',
          description: 'Out for delivery'
        },
        {
          time: '2 days ago',
          location: 'Nairobi Hub',
          status: 'in_transit',
          description: 'In transit to destination'
        },
        {
          time: '3 days ago',
          location: 'Nairobi Hub',
          status: 'picked_up',
          description: 'Package picked up'
        }
      ]
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTrackingInfo(null)

    // Simulate API call
    setTimeout(() => {
      const tracking = trackingNumber.toUpperCase()
      if (demoData[tracking]) {
        setTrackingInfo(demoData[tracking])
      } else {
        setError('Tracking number not found. Please check and try again.')
      }
      setSearched(true)
      setLoading(false)
    }, 800)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6" />
      case 'picked_up':
        return <Package className="w-6 h-6" />
      case 'in_transit':
        return <Truck className="w-6 h-6" />
      case 'out_for_delivery':
        return <Truck className="w-6 h-6" />
      case 'delivered':
        return <CheckCircle2 className="w-6 h-6" />
      default:
        return <AlertCircle className="w-6 h-6" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700'
      case 'picked_up':
        return 'bg-blue-100 text-blue-700'
      case 'in_transit':
        return 'bg-[#1E90FF] bg-opacity-10 text-[#1E90FF]'
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-700'
      case 'delivered':
        return 'bg-[#27AE60] bg-opacity-10 text-[#27AE60]'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'picked_up':
        return 'Picked Up'
      case 'in_transit':
        return 'In Transit'
      case 'out_for_delivery':
        return 'Out for Delivery'
      case 'delivered':
        return 'Delivered'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <JijiModernNav />
      <JijiBreadcrumb customItems={[{ label: 'Tracking' }]} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#003D7A] to-[#1E90FF] py-12 md:py-16 text-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">Track Your Shipment</h1>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto">
              Real-time tracking for your freight. Stay updated every step of the way.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
              <Input
                type="text"
                placeholder="Enter tracking number (e.g., JF123456789)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="flex-1 py-6 rounded-lg border-none text-black"
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#FFD700] hover:bg-[#FFC700] text-[#003D7A] font-bold px-8 rounded-lg"
              >
                <Search className="w-5 h-5" />
              </Button>
            </form>

            <p className="text-sm text-gray-300">Demo: Try "JF123456789" or "JF987654321"</p>
          </div>
        </section>

        {/* Results Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            {error && (
              <div className="max-w-2xl mx-auto mb-8">
                <div className="p-6 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-red-700 mb-1">Not Found</h3>
                    <p className="text-red-600">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {!searched && !trackingInfo && (
              <div className="max-w-2xl mx-auto text-center py-20 space-y-4">
                <div className="text-7xl">📦</div>
                <p className="text-gray-600 text-lg">Enter your tracking number above to get started</p>
              </div>
            )}

            {trackingInfo && (
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Status Banner */}
                <div className={`rounded-lg p-8 text-white text-center space-y-4 ${
                  trackingInfo.status === 'delivered'
                    ? 'bg-gradient-to-br from-[#27AE60] to-[#20C257]'
                    : trackingInfo.status === 'out_for_delivery'
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                    : 'bg-gradient-to-br from-[#1E90FF] to-[#003D7A]'
                }`}>
                  <div className="flex items-center justify-center gap-3">
                    {getStatusIcon(trackingInfo.status)}
                    <h2 className="text-2xl font-bold">{getStatusText(trackingInfo.status)}</h2>
                  </div>
                  <p className="text-sm text-gray-200">Last updated: {trackingInfo.lastUpdate}</p>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-[#F5F7FA] rounded-lg p-6 space-y-4">
                    <h3 className="font-bold text-[#003D7A] flex items-center gap-2">
                      <Package className="w-5 h-5" /> Shipment Details
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-gray-600">Tracking Number</p>
                        <p className="font-bold text-[#003D7A]">{trackingInfo.trackingNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Service</p>
                        <p className="font-bold text-[#003D7A]">{trackingInfo.service}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Weight</p>
                        <p className="font-bold text-[#003D7A]">{trackingInfo.weight}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F5F7FA] rounded-lg p-6 space-y-4">
                    <h3 className="font-bold text-[#003D7A] flex items-center gap-2">
                      <MapPin className="w-5 h-5" /> Location & Delivery
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-gray-600">Current Location</p>
                        <p className="font-bold text-[#003D7A]">{trackingInfo.currentLocation}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Estimated Delivery</p>
                        <p className="font-bold text-[#003D7A]">{trackingInfo.estimatedDelivery}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sender & Recipient */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border-2 border-gray-200 rounded-lg p-6">
                    <h4 className="font-bold text-[#003D7A] mb-4">From</h4>
                    <p className="text-gray-700">{trackingInfo.sender}</p>
                  </div>
                  <div className="border-2 border-gray-200 rounded-lg p-6">
                    <h4 className="font-bold text-[#003D7A] mb-4">To</h4>
                    <p className="text-gray-700">{trackingInfo.recipient}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="border-2 border-gray-200 rounded-lg p-8">
                  <h3 className="font-bold text-[#003D7A] text-lg mb-8">Tracking Timeline</h3>

                  <div className="space-y-6">
                    {trackingInfo.events.map((event, idx) => (
                      <div key={idx} className="flex gap-6">
                        <div className="flex flex-col items-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(event.status)}`}>
                            {getStatusIcon(event.status)}
                          </div>
                          {idx < trackingInfo.events.length - 1 && (
                            <div className="w-1 h-12 bg-gray-300 mt-2"></div>
                          )}
                        </div>

                        <div className="flex-1 pt-2">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-bold text-[#003D7A]">{event.time}</p>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status)}`}>
                              {getStatusText(event.status)}
                            </span>
                          </div>
                          <p className="text-gray-700">{event.description}</p>
                          <p className="text-sm text-gray-600 mt-1">{event.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => {
                      setTrackingNumber('')
                      setTrackingInfo(null)
                      setError('')
                      setSearched(false)
                    }}
                    className="bg-[#1E90FF] hover:bg-[#1A7FDD] text-white font-bold py-6 px-8"
                  >
                    Track Another
                  </Button>
                  <Button className="border-2 border-[#1E90FF] text-[#1E90FF] hover:bg-[#F5F7FA] font-bold py-6 px-8">
                    Contact Support
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-[#F5F7FA]">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <h2 className="text-3xl font-bold text-[#003D7A] text-center mb-12">Tracking FAQs</h2>

            <div className="space-y-6">
              {[
                {
                  q: 'How often is tracking updated?',
                  a: 'Tracking updates in real-time as your shipment moves through our network. You may see updates every 2-4 hours depending on the service level.'
                },
                {
                  q: 'Can I receive SMS or email notifications?',
                  a: 'Yes! By default, you receive email and SMS updates at key stages. You can manage notifications in your account settings.'
                },
                {
                  q: 'What if my shipment seems stuck?',
                  a: 'If you notice no updates for 24 hours, please contact our support team immediately. We\'ll investigate and provide you with an update.'
                },
                {
                  q: 'Can I redirect my shipment?',
                  a: 'For in-transit shipments, contact us immediately. We can attempt to redirect if the package hasn\'t been out for delivery yet.'
                },
                {
                  q: 'How do I get the tracking number?',
                  a: 'You\'ll receive the tracking number via email and SMS when your shipment is confirmed. You can also find it on your receipt or account.'
                },
                {
                  q: 'What if tracking shows a problem?',
                  a: 'If tracking shows an issue, contact our support team immediately at info@jijifreight.com or call +254 700 000 000.'
                }
              ].map((faq, idx) => (
                <div key={idx} className="bg-white rounded-lg p-6 space-y-3">
                  <h3 className="font-bold text-[#003D7A]">{faq.q}</h3>
                  <p className="text-gray-700">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  )
}
