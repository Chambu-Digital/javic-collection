'use client'

import JijiModernNav from '@/components/jiji-modern-nav'
import Footer from '@/components/footer'
import BackToTop from '@/components/back-to-top'
import JijiHomeHero from '@/components/jiji-home-hero'
import JijiServicesSection from '@/components/jiji-services-section'
import JijiWhyChooseUs from '@/components/jiji-why-choose-us'
import JijiCoverageSection from '@/components/jiji-coverage-section'
import JijiCta from '@/components/jiji-cta'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <JijiModernNav />
      
      <main className="flex-1">
        {/* Hero Section - Freight Focus */}
        <JijiHomeHero />
        
        {/* Coverage Map */}
        <JijiCoverageSection />
        
        {/* Services Section */}
        <JijiServicesSection />
        
        {/* Why Choose Us */}
        <JijiWhyChooseUs />
        
        {/* Final CTA */}
        <JijiCta />
      </main>
      
      <Footer />
      <BackToTop />
    </div>
  )
}
