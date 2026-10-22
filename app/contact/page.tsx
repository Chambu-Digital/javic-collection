'use client'

import JijiModernNav from '@/components/jiji-modern-nav'
import JijiBreadcrumb from '@/components/jiji-breadcrumb'
import Footer from '@/components/footer'
import BackToTop from '@/components/back-to-top'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // In production, submit to API
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSubmitted(true)

      // Reset form
      setTimeout(() => {
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
        setSubmitted(false)
      }, 3000)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <JijiModernNav />
      <JijiBreadcrumb customItems={[{ label: 'Contact' }]} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#003D7A] to-[#1E90FF] py-12 md:py-16 text-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold">Contact Us</h1>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto">
              Have a question? We're here to help. Reach out to our team anytime.
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-[#1E90FF] to-[#003D7A] rounded-lg p-6 text-white text-center space-y-3">
                <Phone className="w-8 h-8 mx-auto" />
                <h3 className="font-bold">Phone</h3>
                <p className="text-sm text-gray-200">+254 726-497674</p>
                <p className="text-xs text-gray-300">Darow</p>
              </div>

              <div className="bg-gradient-to-br from-[#1E90FF] to-[#003D7A] rounded-lg p-6 text-white text-center space-y-3">
                <Mail className="w-8 h-8 mx-auto" />
                <h3 className="font-bold">Email</h3>
                <p className="text-sm text-gray-200">info@jijieastafrica.co.ke</p>
                <p className="text-xs text-gray-300">Response within 24h</p>
              </div>

              <div className="bg-gradient-to-br from-[#1E90FF] to-[#003D7A] rounded-lg p-6 text-white text-center space-y-3">
                <MapPin className="w-8 h-8 mx-auto" />
                <h3 className="font-bold">Main Office</h3>
                <p className="text-sm text-gray-200">Eastleigh, Nairobi</p>
                <p className="text-xs text-gray-300">Kenya</p>
              </div>

              <div className="bg-gradient-to-br from-[#1E90FF] to-[#003D7A] rounded-lg p-6 text-white text-center space-y-3">
                <Clock className="w-8 h-8 mx-auto" />
                <h3 className="font-bold">Hours</h3>
                <p className="text-sm text-gray-200">Business Hours</p>
                <p className="text-xs text-gray-300">or by appointment</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form & Map */}
        <section className="py-16 md:py-24 bg-[#F5F7FA]">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Form */}
              <div className="bg-white rounded-lg p-8 shadow-lg">
                <h2 className="text-3xl font-bold text-[#003D7A] mb-8">Send us a Message</h2>

                {submitted && (
                  <div className="mb-6 p-6 bg-[#27AE60] bg-opacity-10 border-2 border-[#27AE60] rounded-lg flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-[#27AE60] flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-[#27AE60] mb-1">Message Sent!</h3>
                      <p className="text-gray-700">We'll get back to you shortly.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      type="text"
                      name="name"
                      placeholder="Your Name *"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="border-2 border-gray-300"
                    />
                    <Input
                      type="email"
                      name="email"
                      placeholder="Your Email *"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="border-2 border-gray-300"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="border-2 border-gray-300"
                    />
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="p-3 border-2 border-gray-300 rounded-lg focus:border-[#1E90FF] focus:outline-none"
                    >
                      <option value="">Select Subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="quote">Quote Request</option>
                      <option value="support">Customer Support</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <textarea
                    name="message"
                    placeholder="Your Message *"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[#1E90FF] focus:outline-none"
                  />

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1E90FF] hover:bg-[#1A7FDD] text-white font-bold py-6 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </div>

              {/* Info & Map */}
              <div className="space-y-8">
                {/* Offices */}
                <div className="bg-white rounded-lg p-8 shadow-lg">
                  <h3 className="text-2xl font-bold text-[#003D7A] mb-6">Our Offices</h3>

            <div className="space-y-6">
                    <div>
                      <h4 className="font-bold text-[#003D7A] mb-2">🇰🇪 Main Office</h4>
                      <p className="text-gray-700 text-sm">
                        Jiji East Africa Limited<br />
                        Armana Shopping Complex<br />
                        3rd Floor, Room T2<br />
                        Captain Mungai St, Eastleigh<br />
                        Nairobi, Kenya<br />
                        <br />
                        <strong>P.O. Box:</strong> 787-00610, Nairobi<br />
                        <br />
                        <strong>Phone Contacts:</strong><br />
                        Darow: +254 726-497674<br />
                        Abdinoor: +254 722-682976<br />
                        Dekow: +254 726-803000<br />
                        <br />
                        <strong>Email:</strong> info@jijieastafrica.co.ke
                      </p>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="font-bold text-[#003D7A] mb-2">📍 Service Coverage</h4>
                      <p className="text-gray-700 text-sm">
                        We operate across:<br />
                        • Kenya<br />
                        • Uganda<br />
                        • Tanzania<br />
                        • Rwanda<br />
                        • Burundi
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="bg-gradient-to-br from-[#003D7A] to-[#1E90FF] rounded-lg p-8 text-white">
                  <h3 className="text-2xl font-bold mb-6">Quick Links</h3>

                  <div className="space-y-3">
                    <a href="/services" className="block p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg font-semibold transition-all">
                      → View All Services
                    </a>
                    <a href="/quote" className="block p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg font-semibold transition-all">
                      → Get a Quote
                    </a>
                    <a href="/tracking" className="block p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg font-semibold transition-all">
                      → Track Your Shipment
                    </a>
                    <a href="/blog" className="block p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg font-semibold transition-all">
                      → Read Our Blog
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Mini Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <h2 className="text-3xl font-bold text-[#003D7A] text-center mb-12">Quick Answers</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-bold text-[#003D7A]">What's your response time?</h3>
                <p className="text-gray-700">We respond to all inquiries within 24 hours. For urgent matters, call us directly.</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-[#003D7A]">Do you provide support 24/7?</h3>
                <p className="text-gray-700">Yes! Emergency support is available 24/7 for all customers. Call our hotline anytime.</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-[#003D7A]">How do I track my shipment?</h3>
                <p className="text-gray-700">Use your tracking number on our website, app, or via SMS. Real-time GPS updates available.</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-[#003D7A]">Can I get a quote online?</h3>
                <p className="text-gray-700">Absolutely! Use our quote calculator for instant pricing or contact our team for custom quotes.</p>
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
