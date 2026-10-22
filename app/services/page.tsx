'use client'

import JijiModernNav from '@/components/jiji-modern-nav'
import JijiBreadcrumb from '@/components/jiji-breadcrumb'
import Footer from '@/components/footer'
import BackToTop from '@/components/back-to-top'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { servicesContent } from '@/app/page-content'
import { ArrowRight, Check } from 'lucide-react'
import Image from 'next/image'

const serviceImages: Record<string, string> = {
  'express': '/img2.jpg',
  'standard': '/img3.jpg',
  'fragile': '/img4.jpg',
  'temperature': '/img5.jpg',
  'bulk': '/img6.jpg',
  'port': '/img7.jpg',
}

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <JijiModernNav />
      <JijiBreadcrumb customItems={[{ label: 'Services' }]} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#003D7A] to-[#1E90FF] py-10 md:py-12 text-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold">Our Services</h1>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto">
              Specialized freight solutions for every need across East Africa
            </p>
          </div>
        </section>

        {/* Services Grid - Card Style */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicesContent.map((service) => (
                <Link key={service.id} href={`/services/${service.id}`}>
                  <div className="group h-full bg-white border border-gray-100 hover:border-[#1E90FF] rounded-lg p-6 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                    {/* Service Image */}
                    <div className="relative w-20 h-20 mb-4 group-hover:scale-110 transition-transform">
                      <Image
                        src={serviceImages[service.id] || '/service-express.svg'}
                        alt={service.name}
                        fill
                        className="object-contain"
                      />
                    </div>

                    {/* Header */}
                    <h3 className="text-lg font-bold text-[#003D7A] mb-1">
                      {service.name}
                    </h3>
                    <p className="text-xs text-gray-600 font-medium mb-3">
                      {service.shortDesc}
                    </p>

                    {/* Description */}
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                      {service.description}
                    </p>

                    {/* Key Highlight - Just 1 feature */}
                    <div className="flex items-start gap-2 mb-4">
                      <Check className="w-4 h-4 text-[#FFD700] flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-700">{service.features[0]}</span>
                    </div>

                    {/* Price & Delivery */}
                    <div className="flex justify-between items-end mb-4 pb-4 border-b border-gray-100">
                      <div className="text-left">
                        <p className="text-xs text-gray-600">Delivery</p>
                        <p className="font-bold text-[#003D7A] text-sm">{service.estimatedDelivery}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">From</p>
                        <p className="font-bold text-[#1E90FF] text-sm">{service.pricing}</p>
                      </div>
                    </div>

                    {/* CTA */}
                    <button className="w-full bg-[#1E90FF] hover:bg-[#1A7FDD] text-white font-semibold py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors">
                      View Details
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Comparison */}
        <section className="py-12 md:py-16 bg-[#F5F7FA]">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[#003D7A] text-center mb-10">
              Service Comparison
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg overflow-hidden border border-gray-200">
                <thead>
                  <tr className="bg-[#003D7A] text-white">
                    <th className="px-4 py-3 text-left font-semibold text-sm">Service</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Delivery</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Coverage</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Tracking</th>
                  </tr>
                </thead>
                <tbody>
                  {servicesContent.map((service) => (
                    <tr key={service.id} className="border-b border-gray-100 hover:bg-[#F5F7FA] text-sm">
                      <td className="px-4 py-3 font-semibold text-[#003D7A]">{service.name}</td>
                      <td className="px-4 py-3 text-gray-700">{service.estimatedDelivery}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {service.id === 'port' ? 'International' : 'East Africa'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-[#1E90FF] bg-opacity-10 text-[#1E90FF] rounded text-xs font-semibold">
                          Real-time
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[#003D7A] text-center mb-10">
              Frequently Asked Questions
            </h2>

            <div className="space-y-3">
              {[
                {
                  q: "Can I switch between services?",
                  a: "Yes, you can modify your service for pending shipments. Contact our support team for in-transit modifications.",
                },
                {
                  q: "What's included in pricing?",
                  a: "Pricing includes transport, basic insurance, tracking, and customer support. Specialized services have additional costs.",
                },
                {
                  q: "Do you offer custom services?",
                  a: "Absolutely! Contact us for custom solutions tailored to your specific logistics needs.",
                },
                {
                  q: "What's the minimum shipment size?",
                  a: "We accept shipments of any size, from small packages to full container loads.",
                },
              ].map((faq, idx) => (
                <div key={idx} className="border border-gray-100 rounded-lg p-5 hover:border-[#1E90FF] transition-colors">
                  <h3 className="font-bold text-[#003D7A] text-sm mb-2">{faq.q}</h3>
                  <p className="text-sm text-gray-700">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-10 md:py-12 bg-gradient-to-r from-[#003D7A] to-[#1E90FF]">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-200">
              Choose a service and get a quote in minutes
            </p>
            <Link href="/quote">
              <Button className="bg-[#FFD700] hover:bg-[#FFC700] text-[#003D7A] font-bold px-8 py-3">
                Get Quote Now
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  )
}