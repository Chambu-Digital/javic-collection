'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Calendar, ArrowLeft, Tag } from 'lucide-react'
import Breadcrumb from '@/components/breadcrumb'
import Header from '@/components/header'
import Footer from '@/components/footer'

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string

  // Blog post data matching the main blog page
  const blogPosts: Record<string, any> = {
    'strappy-bikini-collection': {
      title: "Bold & Vibrant: Strappy Bikini Sets",
      category: "Swimwear",
      date: "Feb 25, 2025",
      image: "/pppp.jpeg",
      content: `
        <h2>Make a Statement This Summer</h2>
        <p>Our strappy bikini collection is designed for the confident woman who isn't afraid to stand out. Featuring bold neon green and vibrant red options, these pieces combine eye-catching colors with intricate strap detailing.</p>
        
        <h3>Key Features</h3>
        <ul>
          <li>Premium quality stretch fabric for perfect fit</li>
          <li>Adjustable straps for customized comfort</li>
          <li>Bold color options: Neon Green and Vibrant Red</li>
          <li>Unique strappy design for a fashion-forward look</li>
          <li>Quick-dry material perfect for beach and pool</li>
        </ul>

        <h3>Styling Tips</h3>
        <p>Pair these statement pieces with high-waisted shorts or a flowing beach cover-up. The bold colors look stunning against sun-kissed skin and complement a variety of skin tones.</p>

        <h3>Care Instructions</h3>
        <p>Hand wash in cold water and lay flat to dry. Avoid direct sunlight when drying to maintain the vibrant colors. Rinse immediately after swimming in chlorinated or salt water.</p>
      `
    },
    'black-lace-lingerie': {
      title: "Elegant Black Lace Lingerie",
      category: "Lingerie",
      date: "Feb 22, 2025",
      image: "/black_lingeries.jpeg",
      content: `
        <h2>Timeless Elegance in Black Lace</h2>
        <p>Discover the allure of our exquisite black lace lingerie collection. Crafted with delicate floral lace patterns and intricate strap details, these pieces are designed to make you feel confident and beautiful.</p>
        
        <h3>Collection Highlights</h3>
        <ul>
          <li>Delicate floral lace with scalloped edges</li>
          <li>Adjustable strappy details for a perfect fit</li>
          <li>Soft, breathable fabric for all-day comfort</li>
          <li>Available in multiple sizes for every body type</li>
          <li>Matching sets for a coordinated look</li>
        </ul>

        <h3>Why Choose Black Lace?</h3>
        <p>Black lace is a timeless classic that never goes out of style. It's versatile, elegant, and perfect for any occasion - whether you're looking for everyday comfort or something special for a romantic evening.</p>

        <h3>Fit & Sizing</h3>
        <p>Our black lace collection runs true to size. For the best fit, we recommend measuring your bust, waist, and hips and comparing with our size chart. If you're between sizes, we suggest sizing up for comfort.</p>
      `
    },
    'heart-print-sleepwear': {
      title: "Cozy Sleepwear: Hearts & Comfort",
      category: "Sleepwear",
      date: "Feb 20, 2025",
      image: "/innerwear.jpeg",
      content: `
        <h2>Sweet Dreams in Style</h2>
        <p>Our adorable heart-print sleepwear collection combines comfort with playful style. Perfect for lounging at home or getting a good night's sleep, these pieces are made from soft, breathable fabrics.</p>
        
        <h3>What's Included</h3>
        <ul>
          <li>Comfortable black cami top with button details</li>
          <li>Matching heart-print shorts for warm nights</li>
          <li>Coordinating heart-print pants for cooler evenings</li>
          <li>Soft, lightweight fabric that feels great on skin</li>
          <li>Elastic waistband with drawstring for adjustable fit</li>
        </ul>

        <h3>Perfect for Lounging</h3>
        <p>This versatile set isn't just for sleeping - it's perfect for lazy Sunday mornings, movie nights, or relaxing at home. The cute heart print adds a touch of fun to your downtime wardrobe.</p>

        <h3>Fabric & Care</h3>
        <p>Made from a soft cotton blend that's gentle on skin and easy to care for. Machine washable in cold water. Tumble dry on low heat or hang to dry for best results.</p>
      `
    },
    'stylish-sportswear': {
      title: "Active & Stylish Sportswear",
      category: "Sportswear",
      date: "Feb 18, 2025",
      image: "/sportwear.jpeg",
      content: `
        <h2>Performance Meets Style</h2>
        <p>Our sportswear collection is designed for the active woman who refuses to compromise on style. Whether you're hitting the gym, going for a run, or practicing yoga, these pieces provide the support and comfort you need.</p>
        
        <h3>Collection Features</h3>
        <ul>
          <li>Moisture-wicking fabric keeps you dry and comfortable</li>
          <li>Four-way stretch for unrestricted movement</li>
          <li>Supportive sports bras with adjustable straps</li>
          <li>High-waisted leggings with compression fit</li>
          <li>Breathable mesh panels for ventilation</li>
        </ul>

        <h3>Designed for Movement</h3>
        <p>Every piece in our sportswear collection is engineered for performance. The fabrics move with you, providing support where you need it while allowing complete freedom of movement.</p>

        <h3>Style & Function</h3>
        <p>Look great while you work out! Our sportswear features modern designs and flattering cuts that transition seamlessly from the gym to casual outings.</p>
      `
    },
    'perfect-fit-guide': {
      title: "Finding Your Perfect Fit",
      category: "Fitting Guide",
      date: "Feb 15, 2025",
      image: "/black_lingeries.jpeg",
      content: `
        <h2>The Ultimate Fitting Guide</h2>
        <p>Finding the perfect fit is essential for comfort and confidence. This comprehensive guide will help you measure yourself accurately and choose the right size for all your intimate apparel needs.</p>
        
        <h3>How to Measure</h3>
        <ul>
          <li><strong>Bust:</strong> Measure around the fullest part of your bust</li>
          <li><strong>Underbust:</strong> Measure directly under your bust</li>
          <li><strong>Waist:</strong> Measure at the narrowest part of your waist</li>
          <li><strong>Hips:</strong> Measure around the fullest part of your hips</li>
        </ul>

        <h3>Finding Your Bra Size</h3>
        <p>Subtract your underbust measurement from your bust measurement. The difference determines your cup size: 1 inch = A cup, 2 inches = B cup, 3 inches = C cup, and so on.</p>

        <h3>Signs of a Good Fit</h3>
        <p>A well-fitting bra should sit flat against your ribcage, with the band parallel to the ground. The cups should fully contain your breasts without spillage or gaping. Straps should stay in place without digging into your shoulders.</p>

        <h3>When to Get Refitted</h3>
        <p>We recommend getting measured every 6-12 months, as your body can change due to weight fluctuations, pregnancy, or aging. If your bras feel uncomfortable, it's time for a new fitting!</p>
      `
    },
    'summer-collection': {
      title: "Summer Collection: Light & Breathable",
      category: "Seasonal",
      date: "Feb 12, 2025",
      image: "/innerwear.jpeg",
      content: `
        <h2>Stay Cool This Summer</h2>
        <p>Kenya's warm climate calls for lightweight, breathable fabrics that keep you comfortable all day long. Our summer collection features carefully selected materials designed for hot weather.</p>
        
        <h3>Summer Essentials</h3>
        <ul>
          <li>Lightweight cotton and cotton-blend fabrics</li>
          <li>Moisture-wicking properties to keep you dry</li>
          <li>Breathable mesh panels for air circulation</li>
          <li>Light colors that reflect heat</li>
          <li>Seamless designs to prevent chafing</li>
        </ul>

        <h3>Fabric Technology</h3>
        <p>Our summer pieces use advanced fabric technology that wicks moisture away from your skin, allowing it to evaporate quickly. This keeps you feeling fresh and comfortable even in the hottest weather.</p>

        <h3>Color Choices</h3>
        <p>Light colors like white, pastels, and soft neutrals are perfect for summer as they reflect rather than absorb heat. Our collection features a beautiful range of summer-appropriate shades.</p>

        <h3>Care Tips for Summer Wear</h3>
        <p>Wash frequently in cool water to remove sweat and bacteria. Hang dry in a shaded area to prevent fabric damage from direct sunlight. Avoid fabric softeners which can reduce moisture-wicking properties.</p>
      `
    }
  }

  const post = blogPosts[slug]

  if (!post) {
    return (
      <>
        <style>{blogPostStyles}</style>
        <div className="post-root">
          <Header />
          <main className="post-main">
            <div className="post-container">
              <div className="post-not-found">
                <h1>Article Not Found</h1>
                <p>Sorry, we couldn't find the article you're looking for.</p>
                <Link href="/blog" className="post-back-btn">
                  <ArrowLeft size={16} />
                  <span>Back to Blog</span>
                </Link>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </>
    )
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: post.title, href: `/blog/${slug}` }
  ]

  return (
    <>
      <style>{blogPostStyles}</style>
      <div className="post-root">
        <Header />
        
        <main className="post-main">
          <div className="post-container">
            <Breadcrumb items={breadcrumbItems} />

            <Link href="/blog" className="post-back-link">
              <ArrowLeft size={16} />
              <span>Back to Blog</span>
            </Link>

            <article className="post-article">
              {/* Hero Image */}
              <div className="post-hero-img">
                <img src={post.image} alt={post.title} />
                <div className="post-hero-overlay" />
              </div>

              {/* Meta */}
              <div className="post-meta">
                <div className="post-meta-item">
                  <Calendar size={14} />
                  <time>{post.date}</time>
                </div>
                <div className="post-meta-item">
                  <Tag size={14} />
                  <span className="post-category">{post.category}</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="post-title">{post.title}</h1>

              {/* Content */}
              <div 
                className="post-content"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* CTA */}
              <div className="post-cta">
                <div className="post-cta-gem"></div>
                <h3 className="post-cta-title">Love What You See?</h3>
                <p className="post-cta-text">
                  Explore our full collection and find your perfect pieces
                </p>
                <Link href="/products" className="post-cta-btn">
                  <span className="post-cta-btn-inner">
                    <span>Shop Now</span>
                    <span className="post-cta-arrow"></span>
                  </span>
                  <span className="post-cta-shimmer" />
                </Link>
              </div>
            </article>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  )
}

const blogPostStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Josefin+Sans:wght@200;300;400;500&display=swap');

  :root {
    --post-pink:    #FF0066;
    --post-magenta: #CC0066;
    --post-deep:    #5a1e5c;
    --post-gold:    #E8C87A;
    --post-gold-lt: #F5DFA0;
  }

  .post-root { display: flex; flex-direction: column; min-height: 100vh; background: #fff; }
  .post-main { flex: 1; padding: 32px 0 72px; background: #fdfdfd; }
  .post-container { max-width: 800px; margin: 0 auto; padding: 0 24px; }

  /* Back Link */
  .post-back-link {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'Josefin Sans', sans-serif; font-weight: 500;
    font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--post-magenta); text-decoration: none;
    margin: 24px 0; transition: gap 0.3s ease;
  }
  .post-back-link:hover { gap: 12px; }

  /* Article */
  .post-article {
    background: white; border: 1px solid rgba(232,200,122,0.18);
    border-radius: 14px; overflow: hidden;
    box-shadow: 0 4px 24px rgba(153,0,68,0.07);
  }

  /* Hero Image */
  .post-hero-img {
    position: relative; height: 400px; overflow: hidden;
    background: linear-gradient(135deg, #fff0f6, #fce4f0);
  }
  .post-hero-img img {
    width: 100%; height: 100%; object-fit: cover;
  }
  .post-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 60%, rgba(26,0,16,0.15) 100%);
  }

  /* Meta */
  .post-meta {
    display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
    padding: 20px 32px; border-bottom: 1px solid rgba(232,200,122,0.15);
  }
  .post-meta-item {
    display: flex; align-items: center; gap: 8px;
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 13px; color: #1A0010;
  }
  .post-category {
    padding: 4px 12px; border-radius: 2px;
    background: rgba(255,0,102,0.08); color: var(--post-magenta);
    font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;
  }

  /* Title */
  .post-title {
    font-family: 'Cormorant Garamond', serif; font-weight: 700;
    font-size: clamp(2rem, 4vw, 3rem); color: #1a0010;
    margin: 0; padding: 24px 32px 32px; line-height: 1.2;
  }

  /* Content */
  .post-content {
    padding: 0 32px 40px;
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 16px; line-height: 1.8; letter-spacing: 0.02em; color: #1A0010;
  }
  .post-content h2 {
    font-family: 'Cormorant Garamond', serif; font-weight: 700;
    font-size: 28px; color: #1a0010; margin: 32px 0 16px; line-height: 1.3;
  }
  .post-content h3 {
    font-family: 'Cormorant Garamond', serif; font-weight: 600;
    font-size: 22px; color: var(--post-magenta); margin: 24px 0 12px; line-height: 1.3;
  }
  .post-content p {
    margin: 0 0 16px;
  }
  .post-content ul {
    margin: 16px 0; padding-left: 24px;
  }
  .post-content li {
    margin-bottom: 8px;
  }
  .post-content strong {
    font-weight: 500; color: var(--post-magenta);
  }

  /* CTA */
  .post-cta {
    background: linear-gradient(135deg, #1a0010, #2d0020);
    border-top: 1px solid rgba(232,200,122,0.2);
    padding: 40px 32px; text-align: center;
  }
  .post-cta-gem {
    font-size: 24px; color: var(--post-gold); opacity: 0.7; margin-bottom: 12px;
  }
  .post-cta-title {
    font-family: 'Cormorant Garamond', serif; font-weight: 700;
    font-size: clamp(1.6rem, 3vw, 2.2rem); color: white;
    margin: 0 0 10px; line-height: 1.1;
  }
  .post-cta-text {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 15px; letter-spacing: 0.08em; color: rgba(255,255,255,0.65);
    margin: 0 0 24px;
  }
  .post-cta-btn {
    position: relative; overflow: hidden;
    background: none; border: none; padding: 0; cursor: pointer;
    display: inline-block; text-decoration: none;
  }
  .post-cta-btn-inner {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 14px 40px;
    background: linear-gradient(135deg, var(--post-magenta), var(--post-pink));
    border: 1px solid rgba(232,200,122,0.3);
    border-radius: 2px;
    font-family: 'Josefin Sans', sans-serif; font-weight: 500;
    font-size: 13px; letter-spacing: 0.28em; text-transform: uppercase;
    color: white; transition: all 0.35s ease;
    position: relative; z-index: 1;
  }
  .post-cta-btn:hover .post-cta-btn-inner {
    border-color: var(--post-gold);
    box-shadow: 0 0 28px rgba(255,0,102,0.4), 0 6px 20px rgba(0,0,0,0.2);
    transform: translateY(-2px);
  }
  .post-cta-arrow {
    color: var(--post-gold-lt); font-size: 16px; transition: transform 0.3s;
  }
  .post-cta-btn:hover .post-cta-arrow { transform: translateX(4px); }
  .post-cta-shimmer {
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
    transform: skewX(-20deg); transition: left 0.55s ease;
  }
  .post-cta-btn:hover .post-cta-shimmer { left: 150%; }

  /* Not Found */
  .post-not-found {
    text-align: center; padding: 80px 24px;
  }
  .post-not-found h1 {
    font-family: 'Cormorant Garamond', serif; font-weight: 700;
    font-size: 36px; color: #1a0010; margin: 0 0 16px;
  }
  .post-not-found p {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 16px; color: #666; margin: 0 0 32px;
  }
  .post-back-btn {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 12px 32px;
    background: linear-gradient(135deg, var(--post-magenta), var(--post-pink));
    border: 1px solid rgba(232,200,122,0.3);
    border-radius: 2px;
    font-family: 'Josefin Sans', sans-serif; font-weight: 500;
    font-size: 13px; letter-spacing: 0.28em; text-transform: uppercase;
    color: white; text-decoration: none;
    transition: all 0.35s ease;
  }
  .post-back-btn:hover {
    border-color: var(--post-gold);
    box-shadow: 0 0 28px rgba(255,0,102,0.4);
    transform: translateY(-2px);
  }

  @media (max-width: 640px) {
    .post-hero-img { height: 250px; }
    .post-meta { padding: 16px 20px; }
    .post-title { padding: 20px 20px 24px; }
    .post-content { padding: 0 20px 32px; font-size: 15px; }
    .post-cta { padding: 32px 20px; }
  }
`
