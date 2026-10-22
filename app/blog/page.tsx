'use client'

import JijiModernNav from '@/components/jiji-modern-nav'
import JijiBreadcrumb from '@/components/jiji-breadcrumb'
import Footer from '@/components/footer'
import BackToTop from '@/components/back-to-top'
import Link from 'next/link'
import { Calendar, User, BookOpen, Search, ArrowRight } from 'lucide-react'
import { blogContent } from '@/app/page-content'
import { useState } from 'react'
import { Input } from '@/components/ui/input'

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPosts = blogContent.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categories = [...new Set(blogContent.map(p => p.category))]

  return (
    <div className="flex flex-col min-h-screen">
      <JijiModernNav />
      <JijiBreadcrumb customItems={[{ label: 'Blog' }]} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#003D7A] to-[#1E90FF] py-12 md:py-16 text-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">Freight & Logistics Blog</h1>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto">
              Industry insights, shipping tips, and best practices to help you optimize your logistics
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto relative mt-6">
              <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-5 rounded-lg border-none text-black"
              />
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-[#F5F7FA] rounded-lg p-6 sticky top-20 space-y-6">
                  <h3 className="font-bold text-[#003D7A] text-lg">Categories</h3>

                  <div className="space-y-2">
                    <button
                      onClick={() => setSearchQuery('')}
                      className={`block w-full text-left px-4 py-2 rounded-lg transition-all ${
                        searchQuery === ''
                          ? 'bg-[#1E90FF] text-white font-semibold'
                          : 'text-gray-700 hover:bg-white'
                      }`}
                    >
                      All Articles
                    </button>

                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSearchQuery(cat)}
                        className={`block w-full text-left px-4 py-2 rounded-lg transition-all ${
                          searchQuery === cat
                            ? 'bg-[#1E90FF] text-white font-semibold'
                            : 'text-gray-700 hover:bg-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Posts Grid */}
              <div className="lg:col-span-3">
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto" />
                    <p className="text-gray-600 text-lg">No articles found. Try a different search.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {filteredPosts.map((post) => (
                      <Link key={post.id} href={`/blog/${post.id}`}>
                        <div className="group rounded-xl overflow-hidden border-2 border-gray-200 hover:border-[#1E90FF] hover:shadow-lg transition-all">
                          <div className="grid md:grid-cols-3">
                            {/* Image */}
                            <div className="md:col-span-1 h-48 md:h-auto bg-gradient-to-br from-[#1E90FF] to-[#003D7A] flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                              {post.id === 1 ? '📦' : post.id === 2 ? '🛰️' : post.id === 3 ? '📊' : '⚡'}
                            </div>

                            {/* Content */}
                            <div className="md:col-span-2 p-8 flex flex-col justify-between">
                              <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-4 flex-wrap">
                                  <span className="inline-block px-3 py-1 rounded-full bg-[#FFD700] bg-opacity-20 text-[#003D7A] font-bold text-xs">
                                    {post.category}
                                  </span>
                                  <span className="text-sm text-gray-600 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(post.date).toLocaleDateString()}
                                  </span>
                                  <span className="text-sm text-gray-600 flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {post.author}
                                  </span>
                                </div>

                                <h3 className="text-2xl font-bold text-[#003D7A] group-hover:text-[#1E90FF] transition-colors">
                                  {post.title}
                                </h3>

                                <p className="text-gray-700">
                                  {post.excerpt}
                                </p>
                              </div>

                              <div className="flex items-center text-[#1E90FF] font-semibold group-hover:gap-2 transition-all">
                                Read Article <ArrowRight className="w-4 h-4 ml-2" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-12 md:py-16 bg-gradient-to-r from-[#003D7A] to-[#1E90FF]">
          <div className="max-w-2xl mx-auto px-4 md:px-8 text-center space-y-4 text-white">
            <h2 className="text-3xl md:text-4xl font-bold">Stay Updated</h2>
            <p className="text-gray-200">
              Get the latest freight industry insights delivered to your inbox weekly.
            </p>

            <form className="flex gap-2 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 py-2 rounded-lg border-none"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-[#FFD700] hover:bg-[#FFC700] text-[#003D7A] font-bold rounded-lg transition-all"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  )
}
