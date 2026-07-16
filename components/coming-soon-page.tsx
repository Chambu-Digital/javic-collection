'use client'

import { Clock, Mail, Phone, MapPin } from 'lucide-react'

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Main Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-30 animate-pulse" />
            <Clock className="relative w-32 h-32 md:w-40 md:h-40 text-purple-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Main Text */}
        <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Coming Soon
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-2">
          We are opening soon
        </p>
        
        <p className="text-gray-400 mb-12 max-w-md mx-auto">
          Something amazing is being built. Stay tuned for an exceptional shopping experience.
        </p>

        {/* Contact Info */}
        <div className="flex flex-col gap-4 justify-center items-center text-gray-300">
          <a href="mailto:sales@javic.co.ke" className="flex items-center gap-2 hover:text-purple-400 transition-colors">
            <Mail className="w-5 h-5" />
            <span>sales@javic.co.ke</span>
          </a>
          <a href="tel:+254706512984" className="flex items-center gap-2 hover:text-purple-400 transition-colors">
            <Phone className="w-5 h-5" />
            <span>+254 706 512 984</span>
          </a>
          <a href="tel:+254723277306" className="flex items-center gap-2 hover:text-purple-400 transition-colors">
            <Phone className="w-5 h-5" />
            <span>+254 723 277 306</span>
          </a>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <span className="text-center text-sm">Biashara Street, Marikiti — Mombasa</span>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="mt-16 flex justify-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  )
}
