'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Phone, Mail } from 'lucide-react'
import { ctaContent } from '@/app/page-content'

export default function JijiCta() {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-r from-[#003D7A] via-[#1E90FF] to-[#0066CC] relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD700] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 text-center space-y-6">
        {/* Content */}
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {ctaContent.title}
          </h2>

          <p className="text-lg text-gray-200">
            {ctaContent.description}
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/quote">
            <Button className="w-full sm:w-auto bg-[#FFD700] hover:bg-[#FFC700] text-[#003D7A] font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all">
              {ctaContent.primaryCta}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>

          <Link href="/contact">
            <Button variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-[#003D7A] px-8 py-3 rounded-lg font-bold">
              {ctaContent.secondaryCta}
            </Button>
          </Link>
        </div>

        {/* Quick Contact Links */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 border-t border-white border-opacity-10">
          <a
            href="tel:+254706512984"
            className="flex items-center justify-center gap-2 text-white hover:text-[#FFD700] transition-colors text-sm font-medium"
          >
            <Phone className="w-4 h-4" />
            +254 706 512 984
          </a>

          <div className="hidden sm:block text-white text-opacity-30">•</div>

          <a
            href="mailto:info@jijieastafrica.co.ke"
            className="flex items-center justify-center gap-2 text-white hover:text-[#FFD700] transition-colors text-sm font-medium"
          >
            <Mail className="w-4 h-4" />
            info@jijieastafrica.co.ke
          </a>
        </div>
      </div>
    </section>
  )
}
