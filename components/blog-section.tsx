'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Calendar, Clock, Zap, Smartphone, Tv, Home } from 'lucide-react'
import { IBlogPost } from '@/models/BlogPost'

export default function BlogSection() {
  const [posts, setPosts] = useState<IBlogPost[]>([])
  const [loading, setLoading] = useState(true)

  // Featured tech content when no database posts
  const featuredTechContent = [
    {
      id: 1,
      title: "2025 Smart TV Buying Guide: OLED vs QLED vs Mini-LED",
      excerpt: "Discover the latest TV technologies and find the perfect display for your home entertainment setup. Compare features, prices, and performance.",
      image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600",
      category: "Entertainment",
      readTime: "8 min read",
      date: "January 22, 2025",
      trending: true,
      slug: "tv-buying-guide-2025"
    },
    {
      id: 2,
      title: "Top 10 Kitchen Appliances That Will Transform Your Cooking",
      excerpt: "From smart ovens to precision blenders, explore the must-have kitchen electronics that professional chefs swear by.",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      category: "Kitchen Tech",
      readTime: "6 min read",
      date: "January 20, 2025",
      trending: false,
      slug: "kitchen-appliances-2025"
    },
    {
      id: 3,
      title: "Smartphone Photography: Best Camera Phones Under 50K",
      excerpt: "Capture stunning photos with these budget-friendly smartphones that rival professional cameras. Complete comparison and reviews.",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
      category: "Mobile Tech",
      readTime: "5 min read",
      date: "January 18, 2025",
      trending: true,
      slug: "best-camera-phones-2025"
    }
  ]

  useEffect(() => {
    fetchBlogPosts()
  }, [])

  const fetchBlogPosts = async () => {
    try {
      const response = await fetch('/api/blog?published=true&limit=3')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'entertainment':
        return <Tv className="w-4 h-4" />
      case 'kitchen tech':
      case 'kitchen electronics':
        return <Home className="w-4 h-4" />
      case 'mobile tech':
      case 'mobile & tablets':
        return <Smartphone className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <section className="py-8 md:py-12 px-4 md:px-8 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="h-8 bg-muted animate-pulse rounded w-80 mx-auto mb-3"></div>
            <div className="h-5 bg-muted animate-pulse rounded w-96 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-card rounded-lg overflow-hidden shadow-sm animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-5 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const displayContent = posts.length > 0 ? posts : featuredTechContent

  // return (
  //   <section className="py-8 md:py-12 px-4 md:px-8 bg-muted/20">
  //     <div className="max-w-6xl mx-auto">
  //       {/* Header */}
  //       <div className="text-center mb-8">
  //         <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
  //           Tech News & Electronics Guide
  //         </h2>
  //         <p className="text-muted-foreground">
  //           Stay updated with the latest electronics trends and buying guides
  //         </p>
  //       </div>

  //       {/* Featured Content Grid */}
  //       <div className="grid md:grid-cols-3 gap-6 mb-8">
  //         {displayContent.map((post, index) => {
  //           // Handle both IBlogPost and featured content types
  //           const isDbPost = '_id' in post
  //           const postId = isDbPost ? post._id : (post as any).id
  //           const postImage = isDbPost ? post.featuredImage : (post as any).image
  //           const postCategory = isDbPost ? (post.categories?.[0] || 'Tech') : (post as any).category
  //           const postDate = isDbPost 
  //             ? (post.publishedAt 
  //                 ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  //                 : new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  //             : (post as any).date
  //           const postReadTime = isDbPost ? '5 min read' : (post as any).readTime
  //           const isTrending = isDbPost ? index === 0 : (post as any).trending

  //           return (
  //             <Link key={postId} href={`/blog/${post.slug}`}>
  //               <div className="group bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-border/50">
  //                 {/* Image Container */}
  //                 <div className="relative h-48 overflow-hidden">
  //                   <img
  //                     src={postImage || "/placeholder.svg"}
  //                     alt={post.title}
  //                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
  //                   />
                    
  //                   {/* Trending Badge */}
  //                   {isTrending && (
  //                     <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
  //                       TRENDING
  //                     </div>
  //                   )}
                    
  //                   {/* Category Badge */}
  //                   <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
  //                     {getCategoryIcon(postCategory)}
  //                     {postCategory}
  //                   </div>
  //                 </div>

  //                 {/* Content */}
  //                 <div className="p-4">
  //                   {/* Meta Info */}
  //                   <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
  //                     <div className="flex items-center gap-1">
  //                       <Calendar className="w-3 h-3" />
  //                       {postDate}
  //                     </div>
  //                     <div className="flex items-center gap-1">
  //                       <Clock className="w-3 h-3" />
  //                       {postReadTime}
  //                     </div>
  //                   </div>

  //                   {/* Title */}
  //                   <h3 className="text-lg font-semibold text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
  //                     {post.title}
  //                   </h3>

  //                   {/* Excerpt */}
  //                   <p className="text-sm text-muted-foreground line-clamp-2">
  //                     {post.excerpt}
  //                   </p>
  //                 </div>
  //               </div>
  //             </Link>
  //           )
  //         })}
  //       </div>

  //       {/* Simple Call to Action */}
  //       <div className="text-center">
  //         <Link href="/blog">
  //           <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
  //             Read More Articles
  //           </button>
  //         </Link>
  //       </div>
  //     </div>
  //   </section>
  // )
}
