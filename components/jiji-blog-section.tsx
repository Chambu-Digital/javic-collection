'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react'
import { blogContent } from '@/app/page-content'

export default function JijiBlogSection() {
  const featuredPost = blogContent[0]
  const otherPosts = blogContent.slice(1, 3)

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block px-4 py-2 rounded-full bg-[#1E90FF] bg-opacity-10 border border-[#1E90FF] border-opacity-30">
            <span className="text-[#1E90FF] font-semibold text-sm">Knowledge Hub</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-[#003D7A]">
            Freight Insights & Tips
          </h2>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stay informed with industry trends, shipping tips, and best practices for logistics.
          </p>
        </div>

        {/* Featured Post - Large Card */}
        <div className="mb-12">
          <div className="grid md:grid-cols-2 gap-8 bg-gradient-to-br from-[#F5F7FA] to-white rounded-2xl overflow-hidden border border-gray-200 hover:border-[#1E90FF] hover:shadow-xl transition-all">
            {/* Left - Content */}
            <div className="p-8 md:p-12 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Category & Date */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#FFD700] bg-opacity-20 text-[#003D7A] font-bold">
                    {featuredPost.category}
                  </span>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(featuredPost.date).toLocaleDateString()}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-3xl font-bold text-[#003D7A]">
                  {featuredPost.title}
                </h3>

                {/* Description */}
                <p className="text-gray-700 text-lg leading-relaxed">
                  {featuredPost.excerpt}
                </p>
              </div>

              {/* Author & CTA */}
              <div className="space-y-4 pt-6 border-t border-gray-300">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>By {featuredPost.author}</span>
                </div>

                <Link href={`/blog/${featuredPost.id}`}>
                  <Button className="w-full bg-[#1E90FF] hover:bg-[#1A7FDD] text-white font-bold rounded-lg">
                    Read Full Article
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right - Image */}
            <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-[#1E90FF] to-[#003D7A] p-8">
              <div className="text-6xl">📖</div>
            </div>
          </div>
        </div>

        {/* Other Posts Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {otherPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.id}`}>
              <div className="group h-full rounded-xl bg-white border-2 border-gray-100 hover:border-[#1E90FF] overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                {/* Top Image Area - Icon only */}
                <div className="bg-gradient-to-r from-[#1E90FF] to-[#003D7A] h-32 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform">
                  {post.id === 2 ? '🎯' : '📈'}
                </div>

                {/* Content */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-block px-2 py-1 text-xs rounded font-bold bg-[#FFD700] bg-opacity-20 text-[#003D7A]">
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(post.date).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-[#003D7A] text-lg group-hover:text-[#1E90FF] transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-gray-600 text-sm line-clamp-2">
                    {post.excerpt}
                  </p>

                  <div className="pt-2 flex items-center text-[#1E90FF] font-semibold text-sm group-hover:gap-2 transition-all">
                    Read More <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Posts CTA */}
        <div className="text-center">
          <Link href="/blog">
            <Button variant="outline" className="border-2 border-[#1E90FF] text-[#1E90FF] hover:bg-[#1E90FF] hover:text-white font-bold px-8 py-6 rounded-lg">
              <BookOpen className="mr-2 w-5 h-5" />
              View All Articles
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
