import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, User, Tag, ArrowLeft, Share2, Zap } from 'lucide-react'
import { IBlogPost } from '@/models/BlogPost'
import { IProduct } from '@/models/Product'
import { Button } from '@/components/ui/button'
import { getProductDisplayPrice, getProductDisplayImage } from '@/lib/product-utils'
import { getBlogPostBySlug, getRelatedBlogPosts } from '@/lib/blog-service'
import Breadcrumb from '@/components/breadcrumb'
import Header from '@/components/header'
import Footer from '@/components/footer'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug)
  
  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.'
    }
  }

  return {
    title: `${post.title} | JAVIC COLLECTION Blog`,
    description: post.metaDescription || post.excerpt,
    keywords: post.metaKeywords || post.tags.join(', '),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : [],
      type: 'article',
      publishedTime: post.publishedAt?.toString(),
      authors: post.author ? [post.author] : undefined,
      tags: post.tags
    }
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  
  // Featured blog content for Javic Collection (fallback when no database posts)
  const featuredBlogContent: { [key: string]: any } = {
    'smart-home-revolution': {
      title: "Smart Home Revolution: Transform Your Living Space with Javic Collection",
      subtitle: "Discover the future of home automation and intelligent living",
      content: `
        <h2>The Smart Home Revolution is Here</h2>
        <p>Smart home technology has evolved from a luxury to a necessity in modern living. At Javic Collection, we're at the forefront of this revolution, offering cutting-edge smart devices that transform your house into an intelligent, efficient, and secure home.</p>
        
        <h3>Essential Smart Home Devices</h3>
        <p><strong>Smart Lighting Systems:</strong> Control your home's ambiance with voice commands or smartphone apps. Our smart bulbs and switches offer energy savings of up to 80% compared to traditional lighting.</p>
        
        <p><strong>Smart Thermostats:</strong> Optimize your home's temperature automatically, learning your preferences and schedule to reduce energy costs by up to 23%.</p>
        
        <p><strong>Smart Security Systems:</strong> Monitor your home 24/7 with HD cameras, smart doorbells, and motion sensors that send real-time alerts to your phone.</p>
        
        <h3>Benefits of Smart Home Technology</h3>
        <ul>
          <li><strong>Energy Efficiency:</strong> Smart devices can reduce your electricity bills by 10-25%</li>
          <li><strong>Enhanced Security:</strong> Real-time monitoring and automated alerts</li>
          <li><strong>Convenience:</strong> Control everything from your smartphone</li>
          <li><strong>Increased Property Value:</strong> Smart homes sell for 5% more on average</li>
        </ul>
        
        <h3>Getting Started with Smart Home</h3>
        <p>Start small with smart plugs and bulbs, then gradually add more devices. Our experts at Javic Collection can help you design a smart home system that fits your budget and lifestyle.</p>
        
        <p>Visit our showroom to experience smart home technology firsthand and discover how Javic Collection can transform your living space into a modern, intelligent home.</p>
      `,
      featuredImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      categories: ["Smart Home", "Technology"],
      tags: ["smart home", "automation", "IoT", "energy efficiency"],
      author: "Javic Collection Tech Team",
      publishedAt: new Date("2025-01-20")
    },
    'kitchen-electronics-guide': {
      title: "Kitchen Electronics Buying Guide: Essential Appliances for Modern Cooking",
      subtitle: "Your complete guide to choosing the perfect kitchen appliances",
      content: `
        <h2>Transform Your Kitchen with Modern Electronics</h2>
        <p>The kitchen is the heart of every home, and having the right electronics can make cooking more enjoyable, efficient, and healthy. At Javic Collection, we offer a comprehensive range of kitchen appliances to suit every cooking style and budget.</p>
        
        <h3>Must-Have Kitchen Electronics</h3>
        <p><strong>Microwave Ovens:</strong> From basic reheating to advanced convection cooking, choose from our range of LG, Samsung, and other premium brands. Consider size, power, and features like grill and convection modes.</p>
        
        <p><strong>Blenders & Food Processors:</strong> Perfect for smoothies, soups, and meal prep. Look for powerful motors (1000W+) and multiple speed settings for versatility.</p>
        
        <p><strong>Coffee Makers:</strong> Start your day right with our selection of drip coffee makers, espresso machines, and French presses. Consider programmable features for convenience.</p>
        
        <h3>Choosing the Right Appliances</h3>
        <p><strong>Consider Your Space:</strong> Measure your counter and storage space before purchasing. Compact designs work well for smaller kitchens.</p>
        
        <p><strong>Energy Efficiency:</strong> Look for Energy Star ratings to save on electricity bills. Our energy-efficient models can reduce power consumption by up to 40%.</p>
        
        <p><strong>Brand Reliability:</strong> We stock trusted brands like LG, Samsung, Philips, and Kenwood, all backed by comprehensive warranties.</p>
        
        <h3>Maintenance Tips</h3>
        <ul>
          <li>Clean appliances regularly to maintain performance</li>
          <li>Use manufacturer-recommended cleaning products</li>
          <li>Schedule professional servicing annually</li>
          <li>Replace filters and parts as recommended</li>
        </ul>
        
        <p>Visit Javic Collection today to see our full range of kitchen electronics and get expert advice on choosing the perfect appliances for your culinary needs.</p>
      `,
      featuredImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
      categories: ["Kitchen Electronics", "Buying Guide"],
      tags: ["kitchen appliances", "microwave", "blender", "buying guide"],
      author: "Javic Collection Kitchen Experts",
      publishedAt: new Date("2025-01-18")
    }
  };
  
  let post = await getBlogPostBySlug(slug)
  
  // If no post found in database, check featured content
  if (!post && featuredBlogContent[slug]) {
    post = {
      _id: slug,
      slug: slug,
      ...featuredBlogContent[slug],
      excerpt: featuredBlogContent[slug].content.substring(0, 200) + "...",
      createdAt: featuredBlogContent[slug].publishedAt,
      relatedProducts: []
    } as IBlogPost
  }
  
  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedBlogPosts(slug, post.categories)

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: post.title, href: `/blog/${slug}` }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      {/* Breadcrumb Navigation */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      {/* Article */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-lg shadow-lg overflow-hidden">
          {/* Featured Image */}
          {post.featuredImage && (
            <div className="aspect-w-16 aspect-h-9">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-64 md:h-96 object-cover"
              />
            </div>
          )}

          <div className="p-8">
            {/* Categories */}
            {post.categories.length > 0 && (
              <div className="flex items-center mb-4">
                <Tag className="h-4 w-4 text-muted-foreground mr-2" />
                <div className="flex flex-wrap gap-2">
                  {post.categories.map((category) => (
                    <span
                      key={category}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Title and Subtitle */}
            <h1 className="text-3xl md:text-4xl font-bold text-card-foreground mb-4">
              {post.title}
            </h1>
            
            {post.subtitle && (
              <p className="text-xl text-muted-foreground mb-6">{post.subtitle}</p>
            )}

            {/* Meta Information */}
            <div className="flex items-center text-sm text-muted-foreground mb-8 pb-8 border-b">
              <Calendar className="h-4 w-4 mr-1" />
              <time dateTime={post.publishedAt?.toString()}>
                {post.publishedAt 
                  ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : new Date(post.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                }
              </time>
              {post.author && (
                <>
                  <span className="mx-3">•</span>
                  <User className="h-4 w-4 mr-1" />
                  <span>By {post.author}</span>
                </>
              )}
              <div className="ml-auto">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div 
                dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
                className="text-card-foreground leading-relaxed [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-4 [&>h2]:text-card-foreground [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3 [&>h3]:text-card-foreground [&>p]:mb-4 [&>ul]:mb-4 [&>ul]:pl-6 [&>li]:mb-2"
              />
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-sm font-medium text-card-foreground mb-3">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-primary/5 rounded-2xl p-8 text-center">
          <img 
            src="/electromatt-icon-only.svg" 
            alt="Javic Collection Logo" 
            className="w-12 h-12 mx-auto mb-4"
          />
          <h3 className="text-2xl font-bold text-card-foreground mb-4">Ready to Upgrade Your Electronics?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Visit our showroom or browse our online catalog to find the perfect electronics for your home. 
            Our experts are ready to help you make the right choice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button className="px-8 py-3">
                Browse Products
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="px-8 py-3">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>

        {/* Related Products */}
        {post.relatedProducts && post.relatedProducts.length > 0 && (
          <div className="mt-12">
            <div className="bg-card rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-card-foreground mb-6">Featured Products</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {post.relatedProducts.map((product: any) => {
                  if (!product || typeof product === 'string' || !product.name) {
                    return null;
                  }

                  const displayImage = getProductDisplayImage(product);
                  const { price, oldPrice } = getProductDisplayPrice(product);
                  
                  return (
                    <div key={product._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <img
                        src={displayImage}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded mb-3"
                      />
                      <h3 className="font-semibold text-card-foreground mb-2">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-primary">
                            KSH {price.toLocaleString()}
                          </span>
                          {oldPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              KSH {oldPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <Link href={`/product/${product._id}`}>
                          <Button size="sm">View Product</Button>
                        </Link>
                      </div>
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            </div>
          </div>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <div className="bg-card rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-card-foreground mb-6">Related Articles</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <article key={relatedPost._id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    {relatedPost.featuredImage && (
                      <img
                        src={relatedPost.featuredImage}
                        alt={relatedPost.title}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-card-foreground mb-2 line-clamp-2">
                        <Link href={`/blog/${relatedPost.slug}`} className="hover:text-primary transition-colors">
                          {relatedPost.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{relatedPost.excerpt}</p>
                      <div className="mt-3">
                        <Link
                          href={`/blog/${relatedPost.slug}`}
                          className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                        >
                          Read More →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  )
}