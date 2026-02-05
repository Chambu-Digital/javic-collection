'use client'

import { useState } from 'react'
import { MessageCircle, Mail, Phone, MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Breadcrumb from '@/components/breadcrumb'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { useToast } from '@/components/ui/custom-toast'
import Link from 'next/link'
import { openWhatsAppChat } from '@/lib/whatsapp-service'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const toast = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    toast.success('Thank you for your message! We will get back to you soon.')
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  const handleWhatsAppClick = () => {
    const message = `Hello JAVIC COLLECTION Store!

I am interested in getting in touch with your store. Please let me know how I can get more information about your products and services.

Thank you!`
    
    const encodedMessage = encodeURIComponent(message)
    const whatsappLink = `https://wa.me/254706512984?text=${encodedMessage}`
    window.open(whatsappLink, '_blank')
  }

  const contactInfo = [
    {
      icon: Phone,
      title: 'Call Us',
      details: '+254 706 512 984',
      link: 'tel:+254706512984',
      color: 'text-blue-600'
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      details: '+254 706 512 984',
      link: 'https://wa.me/254706512984',
      color: 'text-green-600'
    },
    {
      icon: Mail,
      title: 'Email Us',
      details: 'info@javiccollection.co.ke',
      link: 'mailto:info@javiccollection.co.ke',
      color: 'text-purple-600'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      details: 'Agro House, Moi Avenue, 1st Floor Rm 35',
      link: '#',
      color: 'text-orange-600'
    },
  ]

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Contact', href: '/contact' }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background relative">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="py-4 px-4 md:px-8 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        {/* Hero Section */}
        <section className="py-8 md:py-12 px-4 md:px-8 bg-primary/10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Get in <span className="font-black uppercase tracking-wide">Touch</span>
            </h1>
            <p className="text-muted-foreground">
              Questions about our products? Need support? We're here to help!
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-8 md:py-12 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {contactInfo.map((info, index) => {
                const Icon = info.icon
                return (
                  <a
                    key={index}
                    href={info.link}
                    target={info.link.startsWith('http') ? '_blank' : undefined}
                    className="bg-card rounded-lg p-4 text-center border border-border hover:shadow-lg transition group"
                  >
                    <Icon className={`w-6 h-6 ${info.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                    <h3 className="font-semibold text-card-foreground mb-1 text-sm">
                      {info.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{info.details}</p>
                  </a>
                )
              })}
            </div>

            {/* Main Content Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Form */}
              <div className="bg-card rounded-lg p-6 border border-border">
                <h2 className="text-xl font-bold text-card-foreground mb-4">
                  Send us a Message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-card-foreground">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-card-foreground">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-card-foreground">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="What is this about?"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-card-foreground">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                      placeholder="Tell us what's on your mind..."
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3"
                  >
                    Send Message
                  </Button>
                </form>
              </div>

              {/* Store Info & FAQ */}
              <div className="space-y-6">
                {/* Store Hours */}
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-card-foreground">Store Hours</h3>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span>8:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span>9:00 AM - 5:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span>10:00 AM - 4:00 PM</span>
                    </div>
                  </div>
                </div>

                {/* Quick FAQ */}
                <div className="bg-card rounded-lg p-6 border border-border">
                  <h3 className="font-semibold text-card-foreground mb-4">Quick Answers</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-card-foreground mb-1 text-sm">
                        Free Delivery?
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Yes! Free delivery within Nairobi for orders above KSh 10,000.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground mb-1 text-sm">
                        Installation Service?
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Professional fitting consultation available for all intimate apparel.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground mb-1 text-sm">
                        Warranty Support?
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        All products come with manufacturer warranties and our support.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 border border-primary/20 text-center">
                  <h3 className="font-semibold text-foreground mb-2">
                    Ready to Shop?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Browse our latest inner wear and sleepwear collections
                  </p>
                  <Link href="/products">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2">
                      Shop Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleWhatsAppClick}
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group animate-pulse hover:animate-none"
          title="Chat with us on WhatsApp"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Chat with JAVIC COLLECTION
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
