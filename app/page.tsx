'use client'

import { useState, useRef, useEffect } from 'react'
import { ShoppingCart, User, Search, Zap, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      
      <main className="flex-1 space-y-12 md:space-y-16">
        <HeroSlider />
        
        <div className="space-y-8 md:space-y-12">
          <CategoryGrid />
          <FlashDealsSection />
          <AllProductsSection />
        </div>
        
        <div className="space-y-8 md:space-y-12 bg-gray-50/50">
          <BlogSection />
          <ReviewStatsSection />
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
