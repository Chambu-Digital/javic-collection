'use client'

import JijiModernNav from '@/components/jiji-modern-nav'
import JijiBreadcrumb from '@/components/jiji-breadcrumb'
import Footer from '@/components/footer'
import BackToTop from '@/components/back-to-top'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle2, Users, Zap, Globe, Award, TrendingUp } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <JijiModernNav />
      <JijiBreadcrumb customItems={[{ label: 'About' }]} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#003D7A] to-[#1E90FF] py-12 md:py-16 text-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">About Jiji Freight</h1>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto">
              Connecting East Africa through reliable, professional, and affordable freight services since our establishment.
            </p>
          </div>
        </section>

        {/* Company Overview */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-[#003D7A]">Who We Are</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Jiji East Africa Limited is a professional freight and logistics provider serving East Africa's growing economies. Based in Nairobi at Armana Shopping Complex, Eastleigh, we specialize in comprehensive shipping solutions for businesses of all sizes.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  With presence across Kenya, Uganda, Tanzania, Rwanda, and Burundi, we connect businesses across borders. From express deliveries to bulk freight and international sea shipping, we handle it all with professionalism and reliability.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Our commitment to excellence, transparency, and customer satisfaction has made us the trusted partner for thousands of businesses across the region. Contact us at info@jijieastafrica.co.ke or call our team for a consultation.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-[#1E90FF] to-[#003D7A] rounded-lg p-8 text-white text-center space-y-4">
                  <div className="text-5xl font-bold">50,000+</div>
                  <p className="text-sm">Successful Deliveries</p>
                </div>

                <div className="bg-gradient-to-br from-[#FFD700] to-[#FFC700] rounded-lg p-8 text-[#003D7A] text-center space-y-4">
                  <div className="text-5xl font-bold">10,000+</div>
                  <p className="text-sm font-semibold">Active Customers</p>
                </div>

                <div className="bg-gradient-to-br from-[#1E90FF] to-[#003D7A] rounded-lg p-8 text-white text-center space-y-4">
                  <div className="text-5xl font-bold">5</div>
                  <p className="text-sm">Countries Served</p>
                </div>

                <div className="bg-gradient-to-br from-[#27AE60] to-[#20C257] rounded-lg p-8 text-white text-center space-y-4">
                  <div className="text-5xl font-bold">99.2%</div>
                  <p className="text-sm">On-Time Delivery</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Values */}
        <section className="py-16 md:py-24 bg-[#F5F7FA]">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h2 className="text-4xl font-bold text-[#003D7A] text-center mb-16">Our Mission & Values</h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg p-8 space-y-4 text-center">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold text-[#003D7A]">Our Mission</h3>
                <p className="text-gray-700">
                  To be the most reliable, efficient, and customer-centric freight logistics partner in East Africa, connecting businesses and communities through seamless transportation solutions.
                </p>
              </div>

              <div className="bg-white rounded-lg p-8 space-y-4 text-center">
                <div className="text-5xl mb-4">💎</div>
                <h3 className="text-2xl font-bold text-[#003D7A]">Our Vision</h3>
                <p className="text-gray-700">
                  To revolutionize freight logistics across East Africa by leveraging technology, professional expertise, and customer commitment to drive economic growth.
                </p>
              </div>

              <div className="bg-white rounded-lg p-8 space-y-4 text-center">
                <div className="text-5xl mb-4">⭐</div>
                <h3 className="text-2xl font-bold text-[#003D7A]">Our Values</h3>
                <p className="text-gray-700">
                  Reliability, Transparency, Professionalism, Innovation, and Customer-First mindset guide every decision and action we take.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h2 className="text-4xl font-bold text-[#003D7A] text-center mb-16">Why Choose Jiji Freight</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <CheckCircle2 className="w-8 h-8 text-[#1E90FF] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-[#003D7A] text-lg mb-2">Extensive Coverage</h3>
                  <p className="text-gray-700">Operating across 5 countries with major hubs and local presence in key cities.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle2 className="w-8 h-8 text-[#1E90FF] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-[#003D7A] text-lg mb-2">Real-Time Tracking</h3>
                  <p className="text-gray-700">GPS-enabled real-time tracking available on all shipments for complete visibility.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle2 className="w-8 h-8 text-[#1E90FF] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-[#003D7A] text-lg mb-2">Professional Team</h3>
                  <p className="text-gray-700">Experienced, trained staff and drivers ensure your cargo is handled with care.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle2 className="w-8 h-8 text-[#1E90FF] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-[#003D7A] text-lg mb-2">Competitive Pricing</h3>
                  <p className="text-gray-700">Best rates without compromising quality. Transparent pricing with no hidden fees.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle2 className="w-8 h-8 text-[#1E90FF] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-[#003D7A] text-lg mb-2">24/7 Support</h3>
                  <p className="text-gray-700">Round-the-clock customer service available every day, including emergencies.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle2 className="w-8 h-8 text-[#1E90FF] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-[#003D7A] text-lg mb-2">Full Insurance</h3>
                  <p className="text-gray-700">All shipments covered with comprehensive insurance options available.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Services */}
        <section className="py-16 md:py-24 bg-[#F5F7FA]">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h2 className="text-4xl font-bold text-[#003D7A] text-center mb-16">Our Services</h2>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: '⚡', name: 'Express Delivery', desc: 'Next-day delivery to major cities' },
                { icon: '📦', name: 'Standard Shipping', desc: 'Cost-effective delivery across East Africa' },
                { icon: '🔒', name: 'Fragile Cargo', desc: 'Specialized handling for delicate items' },
                { icon: '❄️', name: 'Temperature Control', desc: 'Climate-managed transport for sensitive goods' },
                { icon: '🚛', name: 'Bulk Freight', desc: 'Large volume cargo solutions' },
                { icon: '⛴️', name: 'Port & Sea Freight', desc: 'International and maritime shipping' },
              ].map((service, idx) => (
                <Link key={idx} href="/services">
                  <div className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow cursor-pointer h-full space-y-3">
                    <div className="text-5xl">{service.icon}</div>
                    <h3 className="font-bold text-[#003D7A] text-lg">{service.name}</h3>
                    <p className="text-gray-700 text-sm">{service.desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/services">
                <Button className="bg-[#1E90FF] hover:bg-[#1A7FDD] text-white font-bold py-6 px-8">
                  Explore All Services
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h2 className="text-4xl font-bold text-[#003D7A] text-center mb-16">Our Team</h2>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { emoji: '👨‍💼', name: 'John Kipchoge', role: 'CEO & Founder' },
                { emoji: '👩‍💼', name: 'Sarah Mwangi', role: 'Operations Director' },
                { emoji: '👨‍💼', name: 'James Omondi', role: 'Head of Logistics' },
                { emoji: '👩‍💼', name: 'Grace Njoroge', role: 'Customer Relations' },
              ].map((member, idx) => (
                <div key={idx} className="bg-[#F5F7FA] rounded-lg p-6 text-center space-y-3">
                  <div className="text-6xl">{member.emoji}</div>
                  <h3 className="font-bold text-[#003D7A]">{member.name}</h3>
                  <p className="text-gray-600 text-sm">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-16 md:py-24 bg-[#F5F7FA]">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <h2 className="text-4xl font-bold text-[#003D7A] text-center mb-16">Our Journey</h2>

            <div className="space-y-8">
              {[
                { year: '2020', event: 'Company Founded', description: 'Started with a vision to revolutionize freight logistics in East Africa' },
                { year: '2021', event: 'Regional Expansion', description: 'Expanded to Uganda, Tanzania, Rwanda, and Burundi' },
                { year: '2022', event: '50,000 Shipments', description: 'Achieved milestone of 50,000 successful deliveries' },
                { year: '2023', event: 'Technology Integration', description: 'Launched real-time GPS tracking and mobile app' },
                { year: '2024', event: 'Market Leader', description: 'Recognized as a top freight provider in East Africa' },
                { year: '2026', event: 'Continued Growth', description: 'Serving 10,000+ active customers with 99.2% on-time delivery' },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#1E90FF] text-white flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    {idx < 5 && <div className="w-1 h-20 bg-[#1E90FF] mt-2"></div>}
                  </div>

                  <div className="flex-1 pt-2">
                    <h3 className="font-bold text-[#003D7A] text-lg">{item.year}: {item.event}</h3>
                    <p className="text-gray-700 mt-2">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-[#003D7A] to-[#1E90FF]">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center space-y-8 text-white">
            <h2 className="text-4xl font-bold">Ready to Experience Jiji Freight?</h2>
            <p className="text-lg text-gray-200">
              Join thousands of businesses trusting us with their freight needs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/quote">
                <Button className="bg-[#FFD700] hover:bg-[#FFC700] text-[#003D7A] font-bold py-6 px-8">
                  Get a Quote
                </Button>
              </Link>
              <Link href="/contact">
                <Button className="border-2 border-white text-white hover:bg-white hover:text-[#003D7A] font-bold py-6 px-8">
                  Contact Us
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
