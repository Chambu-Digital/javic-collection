import { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, ArrowRight } from 'lucide-react'
import { IBlogPost } from '@/models/BlogPost'
import { getBlogPosts } from '@/lib/blog-service'
import Breadcrumb from '@/components/breadcrumb'
import Header from '@/components/header'
import Footer from '@/components/footer'

export const metadata: Metadata = {
  title: 'Our Blog | Electronics Reviews, Tips & Tech News',
  description: 'Stay updated with the latest electronics reviews, buying guides, tech tips, and product comparisons. Your trusted source for electronics knowledge.',
  keywords: 'electronics blog, product reviews, tech news, buying guides, electronics tips, appliance reviews'
}

async function fetchBlogPosts() {
  try {
    const data = await getBlogPosts({ published: true })
    return data.posts || []
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    // Return empty array to show featured content instead
    return []
  }
}

export default async function BlogPage() {
  let posts: IBlogPost[] = []
  
  try {
    posts = await fetchBlogPosts()
  } catch (error) {
    console.error('Failed to fetch blog posts:', error)
    // Continue with empty posts array to show featured content
  }

  // Simplified featured content - only 4 posts
  const featuredContent = [
    {
      id: 1,
      title: "Smart Home Revolution with Electromatt",
      excerpt: "Discover the latest smart home devices that are changing how we live.",
      category: "Smart Home",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      date: "Jan 20, 2025",
      slug: "smart-home-revolution"
    },
    {
      id: 2,
      title: "Kitchen Electronics Buying Guide",
      excerpt: "Essential appliances that will revolutionize your cooking experience.",
      category: "Kitchen Tech",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      date: "Jan 18, 2025",
      slug: "kitchen-electronics-guide"
    },
    {
      id: 3,
      title: "TV Technology: OLED vs QLED vs LED",
      excerpt: "Which display technology is right for your entertainment setup?",
      category: "Entertainment",
      image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600",
      date: "Jan 15, 2025",
      slug: "tv-technology-explained"
    },
    {
      id: 4,
      title: "Mobile Phone Maintenance Tips",
      excerpt: "Keep your smartphone running like new with these essential tips.",
      category: "Mobile Tech",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
      date: "Jan 12, 2025",
      slug: "mobile-maintenance-tips"
    }
  ]

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      {/* Compact Hero Section */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-3">Our  Blog</h1>
            <p className="text-primary-foreground/90">
              Electronics reviews, buying guides, and tech tips
            </p>
          </div>
        </div>
      </div>

      {/* Blog Posts */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />
        
        {posts.length === 0 ? (
          <div>
            {/* Featured Content */}
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Latest Articles</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              {featuredContent.map((post) => (
                <article key={post.id} className="bg-card rounded-lg overflow-hidden hover:shadow-md transition-shadow group border">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  <div className="p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <time>{post.date}</time>
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                        {post.category}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-muted-foreground mb-3 line-clamp-2 text-xs">
                      {post.excerpt}
                    </p>

                    <Link href={`/blog/${post.slug}`} className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors text-xs">
                      Read More
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Compact Newsletter */}
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <h3 className="font-semibold text-foreground mb-2">Stay Updated</h3>
              <p className="text-muted-foreground mb-3 text-sm">
                Get electronics news and deals
              </p>
              <div className="flex gap-2 max-w-sm mx-auto">
                <input
                  type="email"
                  placeholder="Enter email"
                  className="flex-1 px-3 py-2 border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded font-medium transition-colors text-sm">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post._id} href={`/blog/${post.slug}`}>
                <article className="bg-card rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group border">
                  {post.featuredImage && (
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  
                  <div className="p-3">
                    <div className="flex items-center text-xs text-muted-foreground mb-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      <time dateTime={post.publishedAt?.toString()}>
                        {post.publishedAt 
                          ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })
                          : new Date(post.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })
                        }
                      </time>
                    </div>

                    <h2 className="font-semibold text-sm text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>

                    <p className="text-muted-foreground mb-3 line-clamp-2 text-xs">{post.excerpt}</p>

                    {post.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {post.categories.slice(0, 2).map((category) => (
                          <span
                            key={category}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-primary/10 text-primary"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors text-xs">
                      Read More
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  )
}