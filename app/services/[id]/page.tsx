'use client'

import JijiModernNav from '@/components/jiji-modern-nav'
import JijiBreadcrumb from '@/components/jiji-breadcrumb'
import Footer from '@/components/footer'
import BackToTop from '@/components/back-to-top'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { servicesContent } from '@/app/page-content'
import { CheckCircle2, AlertCircle, ArrowRight, Clock, DollarSign, Zap } from 'lucide-react'
import { useParams } from 'next/navigation'

export default function ServiceDetailPage() {
  const params = useParams()
  const serviceId = params.id as string
  const service = servicesContent.find(s => s.id === serviceId)

  if (!service) {
    return (
      <div className="flex flex-col min-h-screen">
        <JijiModernNav />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-3xl font-bold text-[#003D7A]">Service Not Found</h1>
            <p className="text-gray-600">The service you're looking for doesn't exist.</p>
            <Link href="/services">
              <Button className="bg-[#1E90FF] hover:bg-[#1A7FDD] text-white">
                Back to Services
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <JijiModernNav />
      <JijiBreadcrumb customItems={[
        { label: 'Services', href: '/services' },
        { label: service.name }
      ]} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#003D7A] to-[#1E90FF] py-12 md:py-16 text-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-start gap-8">
              <div className="flex-1 space-y-4">
                <span className="inline-block px-4 py-2 rounded-full bg-[#FFD700] bg-opacity-20 text-[#FFD700] font-bold">
                  {service.name}
                </span>
                <h1 className="text-5xl md:text-6xl font-bold">{service.name}</h1>
                <p className="text-xl text-gray-200 max-w-2xl">{service.description}</p>
              </div>
              <div className="hidden md:flex text-9xl">{service.icon}</div>
            </div>
          </div>
        </section>

        {/* Overview */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="bg-gradient-to-br from-[#1E90FF] to-[#003D7A] rounded-lg p-8 text-white">
                <div className="flex items-start gap-4 mb-4">
                  <Clock className="w-8 h-8 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-200">Estimated Delivery</p>
                    <p className="text-2xl font-bold">{service.estimatedDelivery}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#FFD700] to-[#FFC700] rounded-lg p-8 text-[#003D7A]">
                <div className="flex items-start gap-4 mb-4">
                  <DollarSign className="w-8 h-8 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-[#003D7A] opacity-75">Starting Price</p>
                    <p className="text-2xl font-bold">{service.pricing}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1E90FF] to-[#003D7A] rounded-lg p-8 text-white">
                <div className="flex items-start gap-4 mb-4">
                  <Zap className="w-8 h-8 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-200">Best For</p>
                    <p className="text-2xl font-bold">Businesses</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#F5F7FA] rounded-lg p-8">
              <h2 className="text-2xl font-bold text-[#003D7A] mb-6">About This Service</h2>
              <p className="text-gray-700 leading-relaxed mb-6">{service.description}</p>
              <p className="text-gray-700 leading-relaxed">
                {service.bestFor && (
                  <>
                    <strong>Ideal for:</strong> {service.bestFor}
                  </>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-12 md:py-16 bg-gradient-to-br from-[#003D7A] to-[#1E90FF] text-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h2 className="text-4xl font-bold text-center mb-16">Key Features</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {service.features.map((feature, idx) => (
                <div key={idx} className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-[#FFD700] flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-lg">{feature}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-[#003D7A]">Ready to Get Started?</h2>
              <p className="text-xl text-gray-600">
                Get a customized quote for {service.name} and experience our professional service.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/quote?service=${service.id}`}>
                <Button className="bg-[#1E90FF] hover:bg-[#1A7FDD] text-white font-bold py-6 px-8 rounded-lg text-lg">
                  Get a Quote
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button className="border-2 border-[#1E90FF] text-[#1E90FF] hover:bg-[#F5F7FA] font-bold py-6 px-8 rounded-lg text-lg">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Related Services */}
        <section className="py-12 md:py-16 bg-[#F5F7FA]">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h2 className="text-4xl font-bold text-[#003D7A] text-center mb-12">Other Services</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {servicesContent.filter(s => s.id !== service.id).slice(0, 3).map((svc) => (
                <Link key={svc.id} href={`/services/${svc.id}`}>
                  <div className="bg-white rounded-lg p-8 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                    <div className="text-6xl mb-4">{svc.icon}</div>
                    <h3 className="text-xl font-bold text-[#003D7A] mb-2">{svc.name}</h3>
                    <p className="text-gray-600 mb-4 flex-1">{svc.shortDesc}</p>
                    <div className="flex items-center text-[#1E90FF] font-semibold">
                      Learn More <ArrowRight className="ml-2 w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/services">
                <Button className="bg-[#1E90FF] hover:bg-[#1A7FDD] text-white font-bold py-6 px-8 rounded-lg">
                  View All Services
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  )
}
