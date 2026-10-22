'use client'

import { testimonials } from '@/app/page-content'
import { Star } from 'lucide-react'

export default function JijiTestimonialsSection() {
  return (
    <section className="py-12 md:py-16 bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-block px-4 py-2 rounded-full bg-[#1E90FF] bg-opacity-10 border border-[#1E90FF] border-opacity-30">
            <span className="text-[#1E90FF] font-semibold text-sm">Testimonials</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-[#003D7A]">
            What Our Customers Say
          </h2>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Trusted by businesses across East Africa.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg border border-gray-100 hover:border-[#1E90FF] hover:shadow-md transition-all p-5 space-y-3"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 text-sm leading-relaxed">
                "{testimonial.feedback}"
              </p>

              {/* Author */}
              <div className="pt-3 border-t border-gray-100 space-y-1">
                <p className="font-semibold text-[#003D7A] text-sm">{testimonial.name}</p>
                <p className="text-xs text-gray-600">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
