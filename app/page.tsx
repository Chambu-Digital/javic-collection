'use client'

import HeroSlider from '@/components/hero-slider'
import CategoryGrid from '@/components/category-grid'
import FlashDealsSection from '@/components/flash-deals'
import AllProductsSection from '@/components/all-products-section'
import BlogSection from '@/components/blog-section'
import ReviewStatsSection from '@/components/review-stats-section'
import Header from '@/components/header'
import Footer from '@/components/footer'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSlider />
        
        {/* Main Content Sections */}
        <div className="space-y-16 md:space-y-20 py-12 md:py-16">
          <CategoryGrid />
          <FlashDealsSection />
          <AllProductsSection />
        </div>
        
        {/* Blog & Reviews Section with subtle background */}
        <div className="space-y-16 md:space-y-20 py-16 md:py-20 bg-muted/30">
          <BlogSection />
          <ReviewStatsSection />
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
