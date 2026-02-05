'use client'

import { Zap, Award, Shield, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Breadcrumb from '@/components/breadcrumb'
import Header from '@/components/header'
import Footer from '@/components/footer'
import Link from 'next/link'

export default function AboutPage() {
  const values = [
    {
      icon: Zap,
      title: 'Latest Technology',
      description: 'We offer premium quality inner wear and sleepwear with the finest fabrics and latest comfort innovations.',
    },
    {
      icon: Shield,
      title: 'Quality Guaranteed',
      description: 'All our products come with manufacturer warranties and our commitment to quality service.',
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Quick and reliable delivery across Kenya with professional installation services available.',
    },
    {
      icon: Award,
      title: 'Expert Support',
      description: 'Our knowledgeable team provides expert advice and after-sales support for all products.',
    },
  ]

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
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
              About <span className="font-black uppercase tracking-wide">ELECTROMATT</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-3xl mx-auto">
              Kenya's premier clothing retailer specializing in quality inner wear and sleepwear. From comfortable pajamas to premium intimate apparel, we offer the finest fabrics with exceptional comfort and style at unbeatable prices. Call +254 706 512 984.
            </p>
          </div>
        </section>

        {/* Brand Story */}
        <section className="py-8 md:py-12 px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
             Electromatt has grown from a small Nairobi shop to Kenya's trusted electronics retailer. We partner with leading brands like Samsung, LG, Sony, and Apple to bring you quality technology at competitive prices.
            </p>
 
          </div>
        </section>

        {/* Store Information & Contact */}
        <section className="py-8 md:py-12 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
              Visit Our Store
            </h2>
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="grid md:grid-cols-2 gap-6 text-center md:text-left">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-3">Location & Contact</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Phone: +254 706 512 984</p>
                    <p>Email: sales@electromatt.co.ke</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-3">Business Hours</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Mon-Fri: 8:00 AM - 6:00 PM</p>
                    <p>Saturday: 9:00 AM - 5:00 PM</p>
                    <p>Sunday: 10:00 AM - 4:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-8 md:py-12 px-4 md:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              Why Choose Us
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => {
                return (
                  <div key={index} className="bg-card rounded-lg p-6 border border-border">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-card-foreground mb-2">
                          {value.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-8 md:py-12 px-4 md:px-8 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to Shop?
            </h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of satisfied customers. Quality electronics, expert service, unbeatable prices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3">
                  Shop Now
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="px-6 py-3">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
