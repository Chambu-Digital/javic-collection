'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Truck } from 'lucide-react'
import { servicesContent } from '@/app/page-content'

// Image mapping for services
const serviceImages: Record<string, string> = {
  'express': '/img2.jpg',
  'standard': '/img3.jpg',
  'fragile': '/img4.jpg',
  'temperature': '/img5.jpg',
  'bulk': '/img6.jpg',
  'port': '/img7.jpg',
}

export default function JijiServicesSection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E90FF] bg-opacity-10 border border-[#1E90FF] border-opacity-30">
            <span className="text-[#1E90FF] font-semibold text-sm">Our Services</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-[#003D7A] leading-tight">
            Freight Solutions for Every Need
          </h2>

          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Six specialized services designed for your logistics requirements
          </p>
        </div>

        {/* Services Grid - Modern Layout */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {servicesContent.map((service) => (
            <Link key={service.id} href={`/services/${service.id}`}>
              <div className="group h-full rounded-xl bg-white border border-gray-200 hover:border-[#1E90FF] overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col">
                
                {/* Image Container */}
                <div 
                  className="h-40 bg-gray-100 overflow-hidden"
                  style={{
                    backgroundImage: `url(${serviceImages[service.id]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {/* Gradient overlay */}
                  <div className="w-full h-full bg-gradient-to-b from-transparent via-transparent to-black/20 group-hover:from-black/10 transition-all duration-300" />
                </div>

                {/* Content Container */}
                <div className="p-6 flex flex-col flex-grow">
                  
                  {/* Service Name */}
                  <h3 className="text-lg font-bold text-[#003D7A] mb-2 group-hover:text-[#1E90FF] transition-colors">
                    {service.name}
                  </h3>

                  {/* Short Description */}
                  <p className="text-sm text-gray-600 font-medium mb-3 leading-snug">
                    {service.shortDesc}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-gray-700 mb-4 leading-relaxed flex-grow">
                    {service.description}
                  </p>

                  {/* Info Pills */}
                  <div className="flex gap-3 mb-5 pt-4 border-t border-gray-100">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Delivery</p>
                      <p className="font-bold text-[#003D7A] text-sm">{service.estimatedDelivery}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">From</p>
                      <p className="font-bold text-[#1E90FF] text-sm">{service.pricing}</p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button className="w-full bg-gradient-to-r from-[#1E90FF] to-[#003D7A] hover:from-[#1A7FDD] hover:to-[#002A5A] text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md">
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-6">
          <Link href="/contact">
            <Button className="bg-[#FFD700] hover:bg-[#FFC700] text-[#003D7A] font-bold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all text-base">
              Contact Our Team
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
