'use client'

import Link from 'next/link'
import { Calendar, ArrowRight } from 'lucide-react'
import Breadcrumb from '@/components/breadcrumb'
import Header from '@/components/header'
import Footer from '@/components/footer'

export default function BlogPage() {
  // Fashion-focused content for JAVIC COLLECTION
  const featuredContent = [
    {
      id: 1,
      title: "Bold & Vibrant: Strappy Bikini Sets",
      excerpt: "Make a statement with our eye-catching neon and red strappy bikini collection.",
      category: "Swimwear",
      image: "/pppp.jpeg",
      date: "Feb 25, 2025",
      slug: "strappy-bikini-collection"
    },
    {
      id: 2,
      title: "Elegant Black Lace Lingerie",
      excerpt: "Discover the timeless beauty of delicate black lace intimate apparel.",
      category: "Lingerie",
      image: "/black_lingeries.jpeg",
      date: "Feb 22, 2025",
      slug: "black-lace-lingerie"
    },
    {
      id: 3,
      title: "Cozy Sleepwear: Hearts & Comfort",
      excerpt: "Perfect loungewear sets featuring adorable heart prints for ultimate relaxation.",
      category: "Sleepwear",
      image: "/innerwear.jpeg",
      date: "Feb 20, 2025",
      slug: "heart-print-sleepwear"
    },
    {
      id: 4,
      title: "Active & Stylish Sportswear",
      excerpt: "Performance meets style in our comfortable and supportive activewear collection.",
      category: "Sportswear",
      image: "/sportwear.jpeg",
      date: "Feb 18, 2025",
      slug: "stylish-sportswear"
    },
    {
      id: 5,
      title: "Finding Your Perfect Fit",
      excerpt: "A comprehensive guide to measuring and finding the right size for ultimate comfort.",
      category: "Fitting Guide",
      image: "/black_lingeries.jpeg",
      date: "Feb 15, 2025",
      slug: "perfect-fit-guide"
    },
    {
      id: 6,
      title: "Summer Collection: Light & Breathable",
      excerpt: "Discover our lightweight, breathable fabrics perfect for Kenya's warm climate.",
      category: "Seasonal",
      image: "/innerwear.jpeg",
      date: "Feb 12, 2025",
      slug: "summer-collection"
    }
  ]

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' }
  ]

  return (
    <>
      <style>{blogStyles}</style>
      <div className="blog-root">
        <Header />
        
        {/* Hero Section */}
        <div className="blog-hero">
          <div className="blog-hero-orb left" aria-hidden="true" />
          <div className="blog-hero-orb right" aria-hidden="true" />
          <div className="blog-hero-inner">
            <div className="blog-eyebrow">
              <span className="blog-eyebrow-line" />
              <span className="blog-eyebrow-text">Fashion & Style</span>
              <span className="blog-eyebrow-line" />
            </div>
            <h1 className="blog-hero-title">JAVIC <em>Blog</em></h1>
            <div className="blog-divider">
              <span className="blog-div-line" />
              <span className="blog-div-gem"></span>
              <span className="blog-div-line" />
            </div>
            <p className="blog-hero-sub">
              Your guide to intimate apparel, sleepwear, and fashion essentials
            </p>
          </div>
        </div>

        {/* Blog Posts */}
        <main className="blog-main">
          <div className="blog-container">
            <Breadcrumb items={breadcrumbItems} />
            
            {/* Featured Content */}
            <h2 className="blog-section-title">Our Blog</h2>
            <div className="blog-grid">
              {featuredContent.map((post, index) => (
                <article 
                  key={post.id} 
                  className="blog-card"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <div className="blog-card-img-wrap">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="blog-card-img"
                    />
                    <div className="blog-card-overlay" />
                    <div className="blog-corner tl" />
                    <div className="blog-corner br" />
                  </div>
                  
                  <div className="blog-card-body">
                    <div className="blog-card-meta">
                      <Calendar size={12} className="blog-card-icon" />
                      <time className="blog-card-date">{post.date}</time>
                      <span className="blog-card-category">{post.category}</span>
                    </div>

                    <h3 className="blog-card-title">{post.title}</h3>

                    <p className="blog-card-excerpt">{post.excerpt}</p>

                    <Link href={`/blog/${post.slug}`} className="blog-card-link">
                      <span>Read Article</span>
                      <ArrowRight size={14} className="blog-card-arrow" />
                    </Link>
                  </div>
                  
                  <div className="blog-card-bar" />
                </article>
              ))}
            </div>

            {/* Newsletter */}
            {/* <div className="blog-newsletter">
              <h3 className="blog-newsletter-title">Stay in Style</h3>
              <p className="blog-newsletter-sub">
                Get fashion tips, exclusive offers, and style inspiration delivered to your inbox
              </p>
              <div className="blog-newsletter-form">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="blog-newsletter-input"
                />
                <button className="blog-newsletter-btn">
                  <span className="blog-newsletter-btn-inner">
                    <span>Subscribe</span>
                    <span className="blog-newsletter-arrow"></span>
                  </span>
                  <span className="blog-newsletter-shimmer" />
                </button>
              </div>
            </div> */}
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  )
}


const blogStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Josefin+Sans:wght@200;300;400;500&display=swap');

  :root {
    --blog-pink:    #FF0066;
    --blog-magenta: #CC0066;
    --blog-deep:    #5a1e5c;
    --blog-gold:    #E8C87A;
    --blog-gold-lt: #F5DFA0;
  }

  .blog-root { display: flex; flex-direction: column; min-height: 100vh; background: #fff; }

  /* ── HERO ── */
  .blog-hero {
    position: relative;
    background: linear-gradient(160deg, #1a0010 0%, #2d0020 50%, #1a0010 100%);
    padding: 64px 24px 56px;
    text-align: center;
    overflow: hidden;
  }
  .blog-hero-orb {
    position: absolute; width: 360px; height: 360px;
    border-radius: 50%; pointer-events: none; opacity: 0.12;
  }
  .blog-hero-orb.left  { top: -100px; left: -80px;  background: radial-gradient(circle, var(--blog-pink),    transparent 70%); }
  .blog-hero-orb.right { bottom: -80px; right: -80px; background: radial-gradient(circle, var(--blog-magenta), transparent 70%); }
  .blog-hero-inner { position: relative; z-index: 1; }

  .blog-eyebrow {
    display: inline-flex; align-items: center; gap: 10px; margin-bottom: 12px;
  }
  .blog-eyebrow-line { display: block; width: 28px; height: 1px; background: var(--blog-gold); opacity: 0.7; }
  .blog-eyebrow-text {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 12px; letter-spacing: 0.38em; text-transform: uppercase; color: var(--blog-gold);
  }
  .blog-hero-title {
    font-family: 'Cormorant Garamond', serif; font-weight: 700;
    font-size: clamp(2.4rem, 5vw, 4rem); color: white; margin: 0 0 14px; line-height: 1.05;
  }
  .blog-hero-title em { font-style: italic; color: var(--blog-gold-lt); }
  .blog-divider { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 14px; }
  .blog-div-line { display: block; width: 52px; height: 1px; background: linear-gradient(90deg, transparent, var(--blog-gold)); }
  .blog-div-line:last-child { background: linear-gradient(270deg, transparent, var(--blog-gold)); }
  .blog-div-gem { font-size: 9px; color: var(--blog-gold); }
  .blog-hero-sub {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 15px; letter-spacing: 0.1em; color: rgba(255,255,255,0.75);
  }

  /* ── MAIN ── */
  .blog-main { flex: 1; padding: 32px 0 72px; background: #fdfdfd; }
  .blog-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

  .blog-section-title {
    font-family: 'Cormorant Garamond', serif; font-weight: 700;
    font-size: clamp(1.8rem, 3.5vw, 2.6rem); color: #1a0010;
    text-align: center; margin: 32px 0 36px; line-height: 1.1;
  }

  /* ── GRID ── */
  .blog-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 20px;
    margin-bottom: 48px;
  }
  @media (min-width: 640px)  { .blog-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .blog-grid { grid-template-columns: repeat(3, 1fr); } }

  /* ── CARD ── */
  .blog-card {
    display: block; text-decoration: none;
    background: white; border: 1px solid rgba(232,200,122,0.18);
    border-radius: 12px; overflow: hidden;
    transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s ease, border-color 0.3s;
    position: relative;
    animation: blogFadeUp 0.5s ease backwards;
  }
  @keyframes blogFadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .blog-card:hover {
    transform: translateY(-6px);
    border-color: rgba(232,200,122,0.5);
    box-shadow: 0 0 0 1px rgba(232,200,122,0.15), 0 14px 44px rgba(153,0,68,0.13), 0 4px 12px rgba(0,0,0,0.06);
  }

  /* Image */
  .blog-card-img-wrap {
    position: relative; height: 200px; overflow: hidden;
    background: linear-gradient(135deg, #fff0f6, #fce4f0);
  }
  .blog-card-img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
  }
  .blog-card:hover .blog-card-img { transform: scale(1.07); }

  .blog-card-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 40%, rgba(26,0,16,0.22) 100%);
    opacity: 0; transition: opacity 0.35s ease;
  }
  .blog-card:hover .blog-card-overlay { opacity: 1; }

  /* Gold corners */
  .blog-corner {
    position: absolute; width: 14px; height: 14px;
    opacity: 0; transition: opacity 0.3s; pointer-events: none;
  }
  .blog-card:hover .blog-corner { opacity: 1; }
  .blog-corner.tl { top: 10px; left: 10px; border-top: 1.5px solid var(--blog-gold); border-left: 1.5px solid var(--blog-gold); }
  .blog-corner.br { bottom: 10px; right: 10px; border-bottom: 1.5px solid var(--blog-gold); border-right: 1.5px solid var(--blog-gold); }

  /* Body */
  .blog-card-body { padding: 18px 20px 16px; }
  
  .blog-card-meta {
    display: flex; align-items: center; gap: 8px;
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 11px; color: #1A0010; margin-bottom: 10px;
  }
  .blog-card-icon { flex-shrink: 0; }
  .blog-card-date { flex-shrink: 0; }
  .blog-card-category {
    margin-left: auto; padding: 4px 10px; border-radius: 2px;
    background: rgba(255,0,102,0.08); color: var(--blog-magenta);
    font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
  }

  .blog-card-title {
    font-family: 'Cormorant Garamond', serif; font-weight: 700;
    font-size: 20px; color: #1a0010; margin: 0 0 10px; line-height: 1.25;
    transition: color 0.2s;
  }
  .blog-card:hover .blog-card-title { color: var(--blog-magenta); }

  .blog-card-excerpt {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 14px; letter-spacing: 0.04em; line-height: 1.7;
    color: #1A0010; margin: 0 0 14px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }

  .blog-card-link {
    display: inline-flex; align-items: center; gap: 7px;
    font-family: 'Josefin Sans', sans-serif; font-weight: 500;
    font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--blog-magenta); text-decoration: none;
    transition: gap 0.3s ease;
  }
  .blog-card:hover .blog-card-link { gap: 10px; }
  .blog-card-arrow { color: var(--blog-gold); transition: transform 0.3s; }
  .blog-card:hover .blog-card-arrow { transform: translateX(3px); }

  /* Bottom bar */
  .blog-card-bar {
    height: 2px;
    background: linear-gradient(90deg, var(--blog-gold), var(--blog-pink));
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
  }
  .blog-card:hover .blog-card-bar { transform: scaleX(1); }

  /* ── NEWSLETTER ── */
  .blog-newsletter {
    background: linear-gradient(135deg, #1a0010, #2d0020);
    border: 1px solid rgba(232,200,122,0.2);
    border-radius: 14px; padding: 40px 24px;
    text-align: center;
  }
  .blog-newsletter-gem {
    font-size: 24px; color: var(--blog-gold); opacity: 0.7; margin-bottom: 12px;
  }
  .blog-newsletter-title {
    font-family: 'Cormorant Garamond', serif; font-weight: 700;
    font-size: clamp(1.8rem, 3.5vw, 2.4rem); color: white;
    margin: 0 0 10px; line-height: 1.1;
  }
  .blog-newsletter-sub {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 15px; letter-spacing: 0.08em; color: rgba(255,255,255,0.65);
    margin: 0 0 24px; max-width: 500px; margin-left: auto; margin-right: auto;
  }
  .blog-newsletter-form {
    display: flex; gap: 12px; max-width: 480px; margin: 0 auto;
    flex-wrap: wrap; justify-content: center;
  }
  @media (max-width: 640px) {
    .blog-newsletter-form { flex-direction: column; }
  }
  .blog-newsletter-input {
    flex: 1; min-width: 240px;
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 15px; letter-spacing: 0.03em;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(232,200,122,0.3);
    border-radius: 3px; padding: 12px 16px; color: white;
    outline: none; transition: all 0.25s ease;
  }
  .blog-newsletter-input::placeholder { color: rgba(255,255,255,0.4); }
  .blog-newsletter-input:focus {
    border-color: var(--blog-gold);
    background: rgba(255,255,255,0.12);
    box-shadow: 0 0 0 3px rgba(232,200,122,0.1);
  }

  .blog-newsletter-btn {
    position: relative; overflow: hidden;
    background: none; border: none; padding: 0; cursor: pointer;
  }
  .blog-newsletter-btn-inner {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 12px 32px;
    background: linear-gradient(135deg, var(--blog-magenta), var(--blog-pink));
    border: 1px solid rgba(232,200,122,0.3);
    border-radius: 2px;
    font-family: 'Josefin Sans', sans-serif; font-weight: 500;
    font-size: 13px; letter-spacing: 0.28em; text-transform: uppercase;
    color: white; transition: all 0.35s ease;
    position: relative; z-index: 1;
  }
  .blog-newsletter-btn:hover .blog-newsletter-btn-inner {
    border-color: var(--blog-gold);
    box-shadow: 0 0 28px rgba(255,0,102,0.4), 0 6px 20px rgba(0,0,0,0.2);
    transform: translateY(-2px);
  }
  .blog-newsletter-arrow {
    color: var(--blog-gold-lt); font-size: 16px; transition: transform 0.3s;
  }
  .blog-newsletter-btn:hover .blog-newsletter-arrow { transform: translateX(4px); }
  .blog-newsletter-shimmer {
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
    transform: skewX(-20deg); transition: left 0.55s ease;
  }
  .blog-newsletter-btn:hover .blog-newsletter-shimmer { left: 150%; }
`
