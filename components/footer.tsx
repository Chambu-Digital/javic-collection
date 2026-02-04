'use client'

import { Mail, Phone, MapPin, Clock, MessageCircle, Zap } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-10">
          {/* Brand & Description */}
          <div className="md:col-span-1 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/electromatt-icon-only.svg" 
                alt="Electromatt Logo" 
                className="w-10 h-10 transition-transform duration-200 hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden">
                <Zap className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-wide">ELECTROMATT</h2>
            </div>
            <p className="text-base opacity-90 leading-relaxed max-w-sm">
              Kenya's trusted electronics retailer. Quality appliances, competitive prices, exceptional service.
            </p>
            <div className="flex items-center gap-3 text-sm opacity-80 bg-primary-foreground/5 px-4 py-3 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">Business Hours</div>
                <div className="text-xs opacity-75">Mon-Fri: 8AM-6PM, Sat: 9AM-5PM</div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold mb-4 text-primary">Contact Us</h3>
            <div className="space-y-4">
              <a 
                href="tel:+254713065412" 
                className="flex items-center gap-3 text-sm hover:text-primary transition-colors duration-200 group"
              >
                <div className="bg-primary-foreground/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium">Call Us</div>
                  <div className="text-xs opacity-75">+254 713 065 412</div>
                </div>
              </a>
              
              <a 
                href="https://wa.me/254713065412" 
                className="flex items-center gap-3 text-sm hover:text-green-400 transition-colors duration-200 group"
              >
                <div className="bg-green-600/20 p-2 rounded-lg group-hover:bg-green-600/30 transition-colors">
                  <MessageCircle className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <div className="font-medium text-green-400">WhatsApp</div>
                  <div className="text-xs opacity-75">Quick Support</div>
                </div>
              </a>
              
              <a 
                href="mailto:sales@electromatt.co.ke" 
                className="flex items-center gap-3 text-sm hover:text-primary transition-colors duration-200 group"
              >
                <div className="bg-primary-foreground/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium">Email Us</div>
                  <div className="text-xs opacity-75">sales@electromatt.co.ke</div>
                </div>
              </a>
              
              <div className="flex items-start gap-3 text-sm opacity-80">
                <div className="bg-primary-foreground/10 p-2 rounded-lg">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium">Visit Our Store</div>
                  <div className="text-xs opacity-75 leading-relaxed">
                    Taveta Lane, Nairobi<br />
                    <span className="text-xs opacity-60">Premium Electronics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold mb-4 text-primary">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Link 
                href="/products" 
                className="opacity-80 hover:opacity-100 hover:text-primary transition-all duration-200 py-1"
              >
                Products
              </Link>
              <Link 
                href="/categories" 
                className="opacity-80 hover:opacity-100 hover:text-primary transition-all duration-200 py-1"
              >
                Categories
              </Link>
              {/* <Link 
                href="/blog" 
                className="opacity-80 hover:opacity-100 hover:text-primary transition-all duration-200 py-1"
              >
                Tech Blog
              </Link> */}
              <Link 
                href="/about" 
                className="opacity-80 hover:opacity-100 hover:text-primary transition-all duration-200 py-1"
              >
                About Us
              </Link>
              <Link 
                href="/contact" 
                className="opacity-80 hover:opacity-100 hover:text-primary transition-all duration-200 py-1"
              >
                Contact
              </Link>
              {/* <Link 
                href="/testimonials" 
                className="opacity-80 hover:opacity-100 hover:text-primary transition-all duration-200 py-1"
              >
                Reviews
              </Link> */}
            </div>
            
            {/* Trust Badges */}
            <div className="mt-6 pt-4 border-t border-primary-foreground/10">
              <div className="text-xs opacity-60 space-y-1">
                <div>✓ Genuine Products Only</div>
                <div>✓ Warranty Guaranteed</div>
                <div>✓ Fast Delivery</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 pt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <span className="text-sm">
              &copy; 2026 <span className="font-bold uppercase tracking-wide">ELECTROMATT</span>. All rights reserved.
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs opacity-70">
            <span className="hidden sm:inline">•</span>
            <span>Quality • Service • Value</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
