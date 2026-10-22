'use client'

import JijiModernNav from '@/components/jiji-modern-nav'
import JijiBreadcrumb from '@/components/jiji-breadcrumb'
import Footer from '@/components/footer'
import BackToTop from '@/components/back-to-top'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { servicesContent, coverage } from '@/app/page-content'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, AlertCircle, CheckCircle2, Loader } from 'lucide-react'

interface Quote {
  basePricePerKg: number
  tierMultiplier: number
  totalWeight: number
  basePrice: number
  distancePricePerKm: number
  estimatedDistance: number
  distancePrice: number
  surcharges: Array<{ name: string; amount: number }>
  minimumCharge: number
  total: number
  finalTotal: number
}

export default function QuotePage() {
  const searchParams = useSearchParams()
  const initialServiceId = searchParams.get('service') || ''

  const [formData, setFormData] = useState({
    serviceId: initialServiceId || 'express',
    senderName: '',
    senderEmail: '',
    senderPhone: '',
    senderLocation: '',
    recipientName: '',
    recipientLocation: '',
    description: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
    },
    surcharges: [] as string[],
  })

  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const selectedService = servicesContent.find(s => s.id === formData.serviceId)

  // Base pricing for demo (in production, this would come from database)
  const basePricing = {
    express: { pricePerKg: 50, minimumCharge: 500 },
    standard: { pricePerKg: 30, minimumCharge: 300 },
    fragile: { pricePerKg: 40, minimumCharge: 800 },
    temperature: { pricePerKg: 60, minimumCharge: 1000 },
    bulk: { pricePerKg: 20, minimumCharge: 200 },
    port: { pricePerKg: 25, minimumCharge: 400 },
  }

  const surchargeOptions = [
    { id: 'insurance', label: 'Full Insurance Coverage', amount: 200 },
    { id: 'rush', label: 'Rush Processing', amount: 500 },
    { id: 'handling', label: 'Special Handling', amount: 300 },
  ]

  const calculateQuote = (data: typeof formData) => {
    if (!data.weight || parseFloat(data.weight) <= 0) {
      setError('Please enter a valid weight')
      return
    }

    const weight = parseFloat(data.weight)
    const pricing = basePricing[data.serviceId as keyof typeof basePricing] || basePricing.standard

    // Base calculation
    const basePrice = weight * pricing.pricePerKg

    // Calculate surcharges
    let totalSurcharges = 0
    const appliedSurcharges = surchargeOptions
      .filter(s => data.surcharges.includes(s.id))
      .map(s => {
        totalSurcharges += s.amount
        return { name: s.label, amount: s.amount }
      })

    // Calculate final total
    const subtotal = basePrice + totalSurcharges
    const finalTotal = Math.max(subtotal, pricing.minimumCharge)

    const newQuote: Quote = {
      basePricePerKg: pricing.pricePerKg,
      tierMultiplier: 1,
      totalWeight: weight,
      basePrice,
      distancePricePerKm: 0,
      estimatedDistance: 0,
      distancePrice: 0,
      surcharges: appliedSurcharges,
      minimumCharge: pricing.minimumCharge,
      total: subtotal,
      finalTotal,
    }

    setQuote(newQuote)
    setError('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name.startsWith('dimensions.')) {
      const dimensionKey = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimensionKey]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSurchargeToggle = (id: string) => {
    setFormData(prev => ({
      ...prev,
      surcharges: prev.surcharges.includes(id)
        ? prev.surcharges.filter(s => s !== id)
        : [...prev.surcharges, id]
    }))
  }

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    calculateQuote(formData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quote) {
      setError('Please calculate a quote first')
      return
    }

    // Validate required fields
    if (!formData.senderName || !formData.senderEmail || !formData.recipientName) {
      setError('Please fill in all required fields (Name, Email, Recipient)')
      return
    }

    setLoading(true)
    try {
      // Simulate quote submission (in production, this would call the API)
      // For now, we'll just show success without hitting the backend
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSubmitted(true)
      // Reset form after success
      setTimeout(() => {
        setFormData({
          serviceId: initialServiceId || 'express',
          senderName: '',
          senderEmail: '',
          senderPhone: '',
          senderLocation: '',
          recipientName: '',
          recipientLocation: '',
          description: '',
          weight: '',
          dimensions: { length: '', width: '', height: '' },
          surcharges: [],
        })
        setQuote(null)
        setSubmitted(false)
      }, 3000)
    } catch (err) {
      setError('Failed to submit quote. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <JijiModernNav />
      <JijiBreadcrumb customItems={[{ label: 'Quote' }]} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#003D7A] to-[#1E90FF] py-12 md:py-16 text-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold">Get Your Quote</h1>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto">
              Fast, accurate pricing for your shipment. Get a quote in seconds.
            </p>
          </div>
        </section>

        {/* Quote Form Section */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Form */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Success Message */}
                  {submitted && (
                    <div className="p-6 bg-[#27AE60] bg-opacity-10 border-2 border-[#27AE60] rounded-lg flex items-start gap-4">
                      <CheckCircle2 className="w-6 h-6 text-[#27AE60] flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-[#27AE60] mb-1">Quote Submitted Successfully!</h3>
                        <p className="text-gray-700">We'll contact you shortly with confirmation details.</p>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="p-6 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-4">
                      <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                      <p className="text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Service Selection */}
                  <div>
                    <label className="block font-bold text-[#003D7A] mb-3">Select Service *</label>
                    <select
                      name="serviceId"
                      value={formData.serviceId}
                      onChange={handleInputChange}
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[#1E90FF] focus:outline-none"
                    >
                      {servicesContent.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name} - {service.estimatedDelivery}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Shipment Details */}
                  <div className="border-t-2 border-gray-200 pt-8">
                    <h3 className="text-lg font-bold text-[#003D7A] mb-6">Shipment Details</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block font-bold text-[#003D7A] mb-2">Weight (kg) *</label>
                        <Input
                          type="number"
                          name="weight"
                          placeholder="e.g., 50"
                          value={formData.weight}
                          onChange={handleInputChange}
                          step="0.1"
                          className="border-2 border-gray-300"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#003D7A] mb-2">Description</label>
                        <textarea
                          name="description"
                          placeholder="Describe your cargo (e.g., Electronics, Fragile glassware)"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[#1E90FF] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sender Details */}
                  <div className="border-t-2 border-gray-200 pt-8">
                    <h3 className="text-lg font-bold text-[#003D7A] mb-6">Sender Details</h3>

                    <div className="space-y-4">
                      <Input
                        type="text"
                        name="senderName"
                        placeholder="Full Name *"
                        value={formData.senderName}
                        onChange={handleInputChange}
                        className="border-2 border-gray-300"
                      />
                      <Input
                        type="email"
                        name="senderEmail"
                        placeholder="Email *"
                        value={formData.senderEmail}
                        onChange={handleInputChange}
                        className="border-2 border-gray-300"
                      />
                      <Input
                        type="tel"
                        name="senderPhone"
                        placeholder="Phone Number *"
                        value={formData.senderPhone}
                        onChange={handleInputChange}
                        className="border-2 border-gray-300"
                      />
                      <select
                        name="senderLocation"
                        value={formData.senderLocation}
                        onChange={handleInputChange}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[#1E90FF] focus:outline-none"
                      >
                        <option value="">Select Pickup Location</option>
                        {coverage.countries.map(country =>
                          country.cities.map(city => (
                            <option key={city} value={city}>
                              {city}, {country.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Recipient Details */}
                  <div className="border-t-2 border-gray-200 pt-8">
                    <h3 className="text-lg font-bold text-[#003D7A] mb-6">Recipient Details</h3>

                    <div className="space-y-4">
                      <Input
                        type="text"
                        name="recipientName"
                        placeholder="Recipient Name *"
                        value={formData.recipientName}
                        onChange={handleInputChange}
                        className="border-2 border-gray-300"
                      />
                      <select
                        name="recipientLocation"
                        value={formData.recipientLocation}
                        onChange={handleInputChange}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[#1E90FF] focus:outline-none"
                      >
                        <option value="">Select Delivery Location</option>
                        {coverage.countries.map(country =>
                          country.cities.map(city => (
                            <option key={city} value={city}>
                              {city}, {country.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Surcharges */}
                  <div className="border-t-2 border-gray-200 pt-8">
                    <h3 className="text-lg font-bold text-[#003D7A] mb-6">Additional Options</h3>

                    <div className="space-y-3">
                      {surchargeOptions.map(option => (
                        <label key={option.id} className="flex items-center gap-3 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-[#1E90FF] transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.surcharges.includes(option.id)}
                            onChange={() => handleSurchargeToggle(option.id)}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="flex-1 font-semibold text-gray-700">{option.label}</span>
                          <span className="font-bold text-[#1E90FF]">+KES {option.amount}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Calculate Button */}
                  <div className="pt-4">
                    <Button
                      type="button"
                      onClick={handleCalculate}
                      className="w-full bg-[#1E90FF] hover:bg-[#1A7FDD] text-white font-bold py-6 rounded-lg transition-all"
                    >
                      Calculate Quote
                    </Button>
                  </div>
                </form>
              </div>

              {/* Quote Summary */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-[#003D7A] to-[#1E90FF] rounded-lg p-8 text-white sticky top-24 space-y-6">
                  <h3 className="text-2xl font-bold">Quote Summary</h3>

                  {!quote ? (
                    <div className="space-y-4 text-center py-12">
                      <div className="text-6xl">📋</div>
                      <p className="text-gray-300">Enter shipment details and click "Calculate Quote" to see pricing.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Service Info */}
                      <div className="border-b border-white border-opacity-20 pb-4">
                        <p className="text-sm text-gray-300">Service</p>
                        <p className="text-xl font-bold">{selectedService?.name}</p>
                      </div>

                      {/* Weight */}
                      <div className="border-b border-white border-opacity-20 pb-4">
                        <p className="text-sm text-gray-300">Weight</p>
                        <p className="text-xl font-bold">{quote.totalWeight} kg</p>
                      </div>

                      {/* Price Breakdown */}
                      <div className="bg-white bg-opacity-10 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span>Base Price</span>
                          <span className="font-semibold">KES {quote.basePrice.toLocaleString()}</span>
                        </div>

                        {quote.surcharges.map((surcharge, idx) => (
                          <div key={idx} className="flex justify-between text-gray-300">
                            <span>{surcharge.name}</span>
                            <span>KES {surcharge.amount.toLocaleString()}</span>
                          </div>
                        ))}

                        <div className="border-t border-white border-opacity-20 pt-3 flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>KES {quote.finalTotal.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button
                        onClick={handleSubmit}
                        disabled={loading || submitted}
                        className="w-full bg-[#FFD700] hover:bg-[#FFC700] text-[#003D7A] font-bold py-6 rounded-lg flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Submit Quote
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-16 md:py-24 bg-[#F5F7FA]">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <h2 className="text-3xl font-bold text-[#003D7A] mb-12 text-center">How It Works</h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="text-5xl mb-4">1️⃣</div>
                <h3 className="text-xl font-bold text-[#003D7A]">Fill Details</h3>
                <p className="text-gray-700">Enter your shipment details, pickup and delivery locations.</p>
              </div>

              <div className="text-center space-y-4">
                <div className="text-5xl mb-4">2️⃣</div>
                <h3 className="text-xl font-bold text-[#003D7A]">Calculate</h3>
                <p className="text-gray-700">Click Calculate to get instant pricing with options.</p>
              </div>

              <div className="text-center space-y-4">
                <div className="text-5xl mb-4">3️⃣</div>
                <h3 className="text-xl font-bold text-[#003D7A]">Submit</h3>
                <p className="text-gray-700">Review and submit. We'll confirm within 1 hour.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  )
}
