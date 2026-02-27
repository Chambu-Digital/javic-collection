'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Star, ShieldCheck, Tag, HeartHandshake } from 'lucide-react'

interface ReviewStats {
  totalReviews: number
  averageRating: number
  ratingDistribution: { [key: number]: number }
  recentReviews: Array<{
    _id: string
    rating: number
    title: string
    comment: string
    createdAt: string
    productId: {
      _id: string
      name: string
      images: string[]
    }
    userId: {
      _id: string
      firstName: string
      lastName: string
    }
  }>
}

export default function ReviewStatsSection() {
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)

  const featuredTestimonials = [
    {
      id: 1,
      rating: 5,
      title: "Outstanding Quality & Comfort",
      comment: "I bought a silk nightwear set from JAVIC COLLECTION and the experience was fantastic. The team helped me choose the perfect size, and the delivery was prompt. The fabric quality is exceptional and feels luxurious against my skin!",
      customerName: "Sarah M.",
      productName: "Silk Nightwear Set",
      date: "2 weeks ago",
      verified: true,
      location: "Nairobi"
    },
    {
      id: 2,
      rating: 5,
      title: "Best Clothing Store for Inner Wear",
      comment: "JAVIC COLLECTION has the best quality inner wear and sleepwear. I've bought pajamas, undergarments, and nightwear from them. The fabrics are so comfortable and the fit is perfect. Their customer service is excellent!",
      customerName: "John K.",
      productName: "Cotton Pajama Set",
      date: "1 month ago",
      verified: true,
      location: "Mombasa"
    },
    {
      id: 3,
      rating: 5,
      title: "Reliable and Trustworthy",
      comment: "I was skeptical about buying lingerie online, but JAVIC COLLECTION exceeded my expectations. The sports bra I ordered arrived in perfect condition with beautiful packaging. Their support team is very responsive!",
      customerName: "Grace W.",
      productName: "Premium Sports Bra",
      date: "3 weeks ago",
      verified: true,
      location: "Kisumu"
    },
    {
      id: 4,
      rating: 5,
      title: "Professional Fitting Service",
      comment: "Not only do they sell quality clothing, but their fitting consultation service is top-notch. The staff were professional, helpful, and explained sizing clearly. My new sleepwear fits perfectly!",
      customerName: "David O.",
      productName: "Silk Nightgown Set",
      date: "1 week ago",
      verified: true,
      location: "Eldoret"
    },
    {
      id: 5,
      rating: 5,
      title: "Great Value for Money",
      comment: "JAVIC COLLECTION offers competitive prices without compromising on quality. I compared prices from multiple stores, and they had the best deal. Plus, their products are authentic and the fit is perfect.",
      customerName: "Mary N.",
      productName: "Cotton Sleepwear Set",
      date: "2 months ago",
      verified: true,
      location: "Nakuru"
    },
    {
      id: 6,
      rating: 5,
      title: "Excellent Customer Experience",
      comment: "From browsing their website to receiving my order, everything was smooth. The product descriptions are accurate, and the delivery was faster than expected. I'll definitely shop here again!",
      customerName: "Peter M.",
      productName: "Comfort Sleepwear",
      date: "3 days ago",
      verified: true,
      location: "Thika"
    }
  ]

  useEffect(() => {
    fetchStats()
  }, [])

  // Auto-rotate testimonials
  useEffect(() => {
    const t = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % featuredTestimonials.length)
    }, 4500)
    return () => clearInterval(t)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/reviews/public-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching review stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${sizeClasses[size]} ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : i < rating
            ? 'fill-yellow-200 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ))
  }

  const displayReviews = (stats?.recentReviews?.length || 0) > 0
    ? (stats?.recentReviews || [])
    : featuredTestimonials
  const totalReviews   = stats?.totalReviews  || 2847
  const averageRating  = stats?.averageRating || 4.8
  const happyCustomers = stats ? Math.floor(stats.totalReviews * 0.95) : 2705

  const trustPillars = [
    {
      icon: ShieldCheck,
      num: '01',
      title: 'Genuine Products',
      desc: '100% authentic premium fabrics sourced directly, with full quality guarantees on every piece.',
    },
    {
      icon: Tag,
      num: '02',
      title: 'Best Prices',
      desc: 'Competitive pricing with regular deals, seasonal discounts, and loyalty rewards for our customers.',
    },
    {
      icon: HeartHandshake,
      num: '03',
      title: 'Excellent Service',
      desc: 'Dedicated support from the moment you browse to long after your order arrives at your door.',
    },
  ]

  if (loading) {
    return (
      <>
        <style>{reviewStyles}</style>
        <section className="jrs-section">
          <div className="jrs-inner">
            <div className="jrs-skeleton-header">
              <div className="jrs-sk-line wide" />
              <div className="jrs-sk-line mid" />
            </div>
            <div className="jrs-trust-grid">
              {[1,2,3].map(i => (
                <div key={i} className="jrs-trust-skeleton">
                  <div className="jrs-sk-circle" />
                  <div className="jrs-sk-line wide" style={{marginTop:16}} />
                  <div className="jrs-sk-line" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <style>{reviewStyles}</style>
      <section className="jrs-section">

        {/* ambient glow */}
        <div className="jrs-glow left"  aria-hidden="true" />
        <div className="jrs-glow right" aria-hidden="true" />

        <div className="jrs-inner">

      

      

         

          {/* ── TRUST PILLARS ── */}
          <div className="jrs-trust-section">
            <div className="jrs-trust-header">
              <div className="jrs-eyebrow">
                <span className="jrs-eyebrow-line" />
                <span className="jrs-eyebrow-text">Our Promise</span>
                <span className="jrs-eyebrow-line" />
              </div>
              <h2 className="jrs-title">Why Customers Choose Us</h2>
              <div className="jrs-divider">
                <span className="jrs-divider-line" />
                <span className="jrs-divider-gem"></span>
                <span className="jrs-divider-line right" />
              </div>
            </div>

            <div className="jrs-trust-grid">
              {trustPillars.map((p, i) => {
                const Icon = p.icon
                return (
                  <div key={i} className="jrs-trust-card" style={{ animationDelay: `${i * 0.12}s` }}>
                    {/* Number watermark */}
                    <span className="jrs-trust-num">{p.num}</span>

                  
                    <h4 className="jrs-trust-title">{p.title}</h4>
                    <p className="jrs-trust-desc">{p.desc}</p>
                    <div className="jrs-trust-card-bar" />
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </section>
    </>
  )
}

const reviewStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Josefin+Sans:wght@200;300;400&display=swap');

  :root {
    --jrs-pink:    #FF0080;
    --jrs-magenta: #CC0066;
    --jrs-deep:    #990044;
    --jrs-gold:    #E8C87A;
    --jrs-gold-lt: #F5DFA0;
  }

  /* ── SECTION ── */
  .jrs-section {
    position: relative;
    padding: 72px 24px 80px;
    background: linear-gradient(180deg, #fff8fb 0%, #ffffff 50%, #fdf5f9 100%);
    overflow: hidden;
  }
  .jrs-glow {
    position: absolute;
    width: 500px; height: 500px;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0.07;
  }
  .jrs-glow.left  { top: -100px; left: -150px; background: radial-gradient(circle, var(--jrs-pink), transparent 70%); }
  .jrs-glow.right { bottom: -100px; right: -150px; background: radial-gradient(circle, var(--jrs-magenta), transparent 70%); }

  .jrs-inner {
    position: relative;
    max-width: 1200px;
    margin: 0 auto;
    z-index: 1;
  }

  /* ── STAT BAR ── */
  .jrs-stat-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0;
    background: linear-gradient(135deg, var(--jrs-deep) 0%, var(--jrs-magenta) 50%, var(--jrs-deep) 100%);
    border-radius: 12px;
    padding: 28px 32px;
    margin-bottom: 64px;
    border: 1px solid rgba(232,200,122,0.25);
    box-shadow: 0 8px 40px rgba(153,0,68,0.2);
  }
  .jrs-stat-item {
    flex: 1;
    min-width: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .jrs-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 36px;
    color: white;
    line-height: 1;
  }
  .jrs-stat-stars { display: flex; gap: 2px; }
  .jrs-stat-label {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 9.5px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.6);
    text-align: center;
  }
  .jrs-stat-sep {
    font-size: 9px;
    color: var(--jrs-gold);
    opacity: 0.5;
    padding: 0 16px;
  }
  @media (max-width: 640px) {
    .jrs-stat-sep { display: none; }
    .jrs-stat-item { min-width: 45%; margin-bottom: 16px; }
  }

  /* ── SECTION HEADERS (shared) ── */
  .jrs-section-header,
  .jrs-trust-header {
    text-align: center;
    margin-bottom: 40px;
  }
  .jrs-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  .jrs-eyebrow-line {
    display: block;
    width: 32px;
    height: 1px;
    background: var(--jrs-gold);
    opacity: 0.7;
  }
  .jrs-eyebrow-text {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 12px;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: var(--jrs-magenta);
  }
  .jrs-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: clamp(2.1rem, 3.5vw, 3rem);
    color: #1A0010;
    margin: 0 0 12px;
    line-height: 1.1;
  }
  .jrs-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .jrs-divider-line {
    display: block;
    width: 56px;
    height: 2px;
    background: linear-gradient(90deg, var(--jrs-magenta), var(--jrs-gold));
    border-radius: 1px;
  }
  .jrs-divider-line.right {
    background: linear-gradient(270deg, transparent, var(--jrs-gold));
    width: 28px;
    opacity: 0.4;
  }
  .jrs-divider-gem { font-size: 9px; color: var(--jrs-gold); }

  /* ── CAROUSEL ── */
  .jrs-carousel {
    margin-bottom: 72px;
  }

  /* Featured card */
  .jrs-featured-card {
    background: white;
    border: 1px solid rgba(232,200,122,0.25);
    border-radius: 16px;
    padding: 40px 48px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 40px rgba(153,0,68,0.08), 0 2px 8px rgba(0,0,0,0.04);
    animation: jrsFadeIn 0.5s ease forwards;
    margin-bottom: 28px;
  }
  @keyframes jrsFadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .jrs-featured-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--jrs-gold), var(--jrs-magenta), var(--jrs-pink));
  }
  @media (max-width: 640px) {
    .jrs-featured-card { padding: 28px 24px; }
  }

  .jrs-featured-quote {
    position: absolute;
    top: 20px;
    right: 40px;
    font-family: 'Cormorant Garamond', serif;
    font-size: 120px;
    color: rgba(204,0,102,0.06);
    line-height: 1;
    pointer-events: none;
    user-select: none;
  }

  .jrs-featured-stars {
    display: flex;
    gap: 3px;
    margin-bottom: 14px;
  }
  .jrs-featured-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: clamp(1.2rem, 2.5vw, 1.7rem);
    color: #1a0010;
    margin: 0 0 14px;
    font-style: italic;
  }
  .jrs-featured-body {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 13.5px;
    line-height: 1.75;
    color: #555;
    letter-spacing: 0.02em;
    margin: 0 0 28px;
    max-width: 720px;
  }
  .jrs-featured-meta {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .jrs-featured-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--jrs-magenta), var(--jrs-pink));
    color: white;
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(204,0,102,0.25);
  }
  .jrs-featured-name {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 13px;
    letter-spacing: 0.1em;
    color: #1a0010;
    margin: 0 0 3px;
  }
  .jrs-featured-detail {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 10.5px;
    letter-spacing: 0.06em;
    color: #aaa;
    margin: 0;
  }
  .jrs-featured-prod { color: var(--jrs-magenta); }
  .jrs-featured-date { color: #ccc; }
  .jrs-verified-badge {
    margin-left: auto;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 9.5px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #3a7d44;
    background: rgba(58,125,68,0.08);
    border: 1px solid rgba(58,125,68,0.2);
    border-radius: 20px;
    padding: 4px 12px;
  }

  /* Thumbnails */
  .jrs-thumbs {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .jrs-thumb {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    background: none;
    border: 1px solid rgba(232,200,122,0.25);
    border-radius: 8px;
    padding: 8px 14px;
    cursor: pointer;
    transition: all 0.25s ease;
  }
  .jrs-thumb:hover, .jrs-thumb.active {
    border-color: var(--jrs-magenta);
    background: rgba(204,0,102,0.04);
  }
  .jrs-thumb.active .jrs-thumb-avatar {
    background: linear-gradient(135deg, var(--jrs-magenta), var(--jrs-pink));
  }
  .jrs-thumb-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #eee;
    color: white;
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.25s;
  }
  .jrs-thumb.active .jrs-thumb-avatar { background: linear-gradient(135deg, var(--jrs-magenta), var(--jrs-pink)); }
  .jrs-thumb-name {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 9.5px;
    letter-spacing: 0.1em;
    color: #888;
  }
  .jrs-thumb.active .jrs-thumb-name { color: var(--jrs-magenta); }

  /* Dots */
  .jrs-carousel-dots {
    display: flex;
    justify-content: center;
    gap: 6px;
  }
  .jrs-carousel-dot {
    height: 3px;
    border-radius: 2px;
    border: none;
    cursor: pointer;
    transition: all 0.35s ease;
    background: rgba(204,0,102,0.15);
    width: 16px;
    padding: 0;
  }
  .jrs-carousel-dot.active {
    width: 36px;
    background: var(--jrs-magenta);
    box-shadow: 0 0 8px rgba(204,0,102,0.4);
  }

  /* ── TRUST SECTION ── */
  .jrs-trust-section {
    background: linear-gradient(135deg, #1a0010 0%, #2d0020 50%, #1a0010 100%);
    border-radius: 20px;
    padding: 56px 40px 48px;
    border: 1px solid rgba(232,200,122,0.15);
    box-shadow: 0 20px 60px rgba(153,0,68,0.2);
    position: relative;
    overflow: hidden;
  }
  .jrs-trust-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 0%, rgba(255,0,128,0.08) 0%, transparent 60%);
    pointer-events: none;
  }
  @media (max-width: 640px) {
    .jrs-trust-section { padding: 40px 24px 36px; }
  }
  .jrs-trust-header .jrs-eyebrow-text { color: var(--jrs-gold-lt); }
  .jrs-trust-header .jrs-title { color: white; }
  .jrs-trust-header .jrs-divider-line { background: linear-gradient(90deg, var(--jrs-gold), rgba(255,255,255,0.2)); }

  .jrs-trust-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 20px;
    position: relative;
    z-index: 1;
  }
  @media (min-width: 768px) {
    .jrs-trust-grid { grid-template-columns: repeat(3, 1fr); }
  }

  .jrs-trust-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(232,200,122,0.15);
    border-radius: 12px;
    padding: 32px 28px 28px;
    text-align: center;
    position: relative;
    overflow: hidden;
    transition: transform 0.35s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    animation: jrsFadeUp 0.55s ease backwards;
  }
  @keyframes jrsFadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .jrs-trust-card:hover {
    transform: translateY(-5px);
    border-color: rgba(232,200,122,0.45);
    box-shadow: 0 12px 40px rgba(0,0,0,0.3), 0 0 20px rgba(255,0,128,0.08);
  }

  .jrs-trust-num {
    position: absolute;
    top: 12px;
    right: 16px;
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 56px;
    color: rgba(232,200,122,0.07);
    line-height: 1;
    user-select: none;
  }

  .jrs-trust-icon-ring {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--jrs-magenta), var(--jrs-pink));
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;
    color: white;
    box-shadow: 0 6px 20px rgba(255,0,128,0.35);
    transition: box-shadow 0.3s ease;
  }
  .jrs-trust-card:hover .jrs-trust-icon-ring {
    box-shadow: 0 8px 30px rgba(255,0,128,0.55);
  }
  .jrs-trust-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 22px;
    color: white;
    margin: 0 0 12px;
    letter-spacing: 0.01em;
  }
  .jrs-trust-desc {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 1.7;
    letter-spacing: 0.03em;
    color: rgba(255,255,255,0.75);
    margin: 0;
  }
  .jrs-trust-card-bar {
    height: 2px;
    background: linear-gradient(90deg, var(--jrs-gold), var(--jrs-pink));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
    margin-top: 20px;
    border-radius: 1px;
  }
  .jrs-trust-card:hover .jrs-trust-card-bar { transform: scaleX(1); }

  /* ── LOADING SKELETONS ── */
  .jrs-skeleton-header {
    text-align: center;
    margin-bottom: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .jrs-sk-line {
    height: 12px;
    border-radius: 6px;
    background: rgba(204,0,102,0.08);
    animation: jrsShimmer 1.4s ease-in-out infinite;
  }
  .jrs-sk-line.wide { width: 280px; height: 16px; }
  .jrs-sk-line.mid  { width: 200px; }
  .jrs-sk-circle {
    width: 60px; height: 60px;
    border-radius: 50%;
    background: rgba(204,0,102,0.08);
    animation: jrsShimmer 1.4s ease-in-out infinite;
    margin: 0 auto 12px;
  }
  .jrs-trust-skeleton {
    background: rgba(204,0,102,0.03);
    border: 1px solid rgba(232,200,122,0.12);
    border-radius: 12px;
    padding: 32px 24px;
    text-align: center;
  }
  @keyframes jrsShimmer {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 1; }
  }
`