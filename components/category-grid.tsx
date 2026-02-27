'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Zap, Home, ChefHat, Tv, Smartphone, Monitor, Headphones, Wifi, Cable } from 'lucide-react'
import Link from 'next/link'
import { ICategory } from '@/models/Category'

const iconMap: { [key: string]: any } = {
  'Home': Home,
  'ChefHat': ChefHat,
  'Tv': Tv,
  'Smartphone': Smartphone,
  'Monitor': Monitor,
  'Headphones': Headphones,
  'Wifi': Wifi,
  'Cable': Cable,
  'Zap': Zap,
}

export default function CategoryGrid() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)
  const [categories, setCategories] = useState<ICategory[]>([])
  const [loading, setLoading] = useState(true)

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (categories.length > 0) {
      checkScrollButtons()
      const handleResize = () => checkScrollButtons()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [categories])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.children[0]?.clientWidth || 260
      scrollContainerRef.current.scrollBy({ left: -cardWidth * 2, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.children[0]?.clientWidth || 260
      scrollContainerRef.current.scrollBy({ left: cardWidth * 2, behavior: 'smooth' })
    }
  }

  return (
    <>
      <style>{catStyles}</style>
      <section className="jcat-section">

        {/* Section header */}
        <div className="jcat-header">
          <div className="jcat-header-badge">
            <span className="jcat-badge-line" />
            <span className="jcat-badge-text">Explore</span>
            <span className="jcat-badge-line" />
          </div>
          <h2 className="jcat-title">Shop by Category</h2>
          <div className="jcat-divider">
            <span className="jcat-divider-line" />
            <span className="jcat-divider-gem"></span>
            <span className="jcat-divider-line" />
          </div>
          <p className="jcat-subtitle">
            Discover our curated range of innerwear, sleepwear & intimate apparel
          </p>
        </div>

        {/* Scroll container */}
        <div className="jcat-scroll-wrap">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button onClick={scrollLeft} className="jcat-arrow left" aria-label="Scroll left">
              <ChevronLeft size={20} />
            </button>
          )}
          {/* Right Arrow */}
          {showRightArrow && (
            <button onClick={scrollRight} className="jcat-arrow right" aria-label="Scroll right">
              <ChevronRight size={20} />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={checkScrollButtons}
            className="jcat-scroll-track"
          >
            {loading
              ? Array(6).fill(0).map((_, i) => (
                  <div key={i} className="jcat-card-skeleton">
                    <div className="jcat-skeleton-img" />
                    <div className="jcat-skeleton-body">
                      <div className="jcat-skeleton-line wide" />
                      <div className="jcat-skeleton-line" />
                    </div>
                  </div>
                ))
              : categories.map((category, index) => {
                  const Icon = iconMap[category.icon] || Zap
                  return (
                    <Link
                      key={category._id}
                      href={`/category/${category.slug}`}
                      className="jcat-card"
                      style={{ animationDelay: `${index * 0.07}s` }}
                    >
                      {/* Image area */}
                      <div className="jcat-card-img-wrap">
                        <img
                          src={category.image || '/placeholder.svg'}
                          alt={category.name}
                          className="jcat-card-img"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                        {/* Fallback icon */}
                        <div className="jcat-card-icon-fallback">
                          <Icon size={28} />
                        </div>
                        {/* Hover overlay */}
                        <div className="jcat-card-overlay" />
                        {/* Gold corner accent */}
                        <div className="jcat-card-corner tl" />
                        <div className="jcat-card-corner br" />
                      </div>

                      {/* Info */}
                      <div className="jcat-card-body">
                        <h3 className="jcat-card-name">{category.name}</h3>
                        <p className="jcat-card-desc">{category.description}</p>
                        <div className="jcat-card-cta">
                          <span className="jcat-cta-text">Shop Now</span>
                          <span className="jcat-cta-arrow"></span>
                        </div>
                      </div>

                      {/* Bottom accent bar */}
                      <div className="jcat-card-bar" />
                    </Link>
                  )
                })}
          </div>
        </div>

        {/* View all */}
        <div className="jcat-footer">
          <Link href="/categories">
            <button className="jcat-view-all-btn">
              <span className="jcat-view-all-inner">
                <span>View All Categories</span>
                <span className="jcat-view-all-arrow"></span>
              </span>
              <span className="jcat-view-all-shimmer" />
            </button>
          </Link>
        </div>

      </section>
    </>
  )
}

const catStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Josefin+Sans:wght@200;300;400&display=swap');

  :root {
    --jc-pink: #FF0080;
    --jc-magenta: #CC0066;
    --jc-deep: #990044;
    --jc-gold: #E8C87A;
    --jc-gold-light: #F5DFA0;
  }

  /* ── SECTION ── */
  .jcat-section {
    padding: 56px 24px 64px;
    background: linear-gradient(180deg, #fdf5f9 0%, #fff8fb 60%, #ffffff 100%);
    position: relative;
    overflow: hidden;
  }
  .jcat-section::before {
    content: '';
    position: absolute;
    top: -80px;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 200px;
    background: radial-gradient(ellipse, rgba(255,0,128,0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  /* ── HEADER ── */
  .jcat-header {
    text-align: center;
    margin-bottom: 40px;
  }
  .jcat-header-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .jcat-badge-line {
    display: block;
    width: 36px;
    height: 1px;
    background: var(--jc-gold);
    opacity: 0.7;
  }
  .jcat-badge-text {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 10px;
    letter-spacing: 0.4em;
    text-transform: uppercase;
    color: var(--jc-magenta);
  }
  .jcat-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: clamp(2rem, 4vw, 3rem);
    color: #1a0010;
    line-height: 1.1;
    margin-bottom: 14px;
    letter-spacing: -0.01em;
  }
  .jcat-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 14px;
  }
  .jcat-divider-line {
    width: 60px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--jc-gold));
  }
  .jcat-divider-line:last-child {
    background: linear-gradient(270deg, transparent, var(--jc-gold));
  }
  .jcat-divider-gem {
    color: var(--jc-gold);
    font-size: 9px;
  }
  .jcat-subtitle {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 13.5px;
    letter-spacing: 0.08em;
    color: #888;
    max-width: 440px;
    margin: 0 auto;
  }

  /* ── SCROLL WRAPPER ── */
  .jcat-scroll-wrap {
    position: relative;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* ── ARROWS ── */
  .jcat-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: white;
    border: 1px solid rgba(232,200,122,0.4);
    box-shadow: 0 4px 16px rgba(153,0,68,0.12);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--jc-magenta);
    transition: all 0.25s ease;
  }
  .jcat-arrow:hover {
    background: var(--jc-magenta);
    color: white;
    border-color: var(--jc-magenta);
    box-shadow: 0 6px 24px rgba(204,0,102,0.3);
    transform: translateY(-50%) scale(1.06);
  }
  .jcat-arrow.left  { left: -20px; }
  .jcat-arrow.right { right: -20px; }

  /* ── TRACK ── */
  .jcat-scroll-track {
    display: flex;
    gap: 18px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    padding: 8px 4px 16px;
  }
  .jcat-scroll-track::-webkit-scrollbar { display: none; }

  /* ── CARD ── */
  .jcat-card {
    flex-shrink: 0;
    width: 240px;
    background: white;
    border-radius: 12px;
    border: 1px solid rgba(232,200,122,0.2);
    overflow: hidden;
    text-decoration: none;
    scroll-snap-align: start;
    transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s ease, border-color 0.3s ease;
    position: relative;
    animation: jcatFadeUp 0.5s ease backwards;
  }
  @keyframes jcatFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .jcat-card:hover {
    transform: translateY(-6px);
    box-shadow:
      0 0 0 1px rgba(232,200,122,0.4),
      0 12px 40px rgba(153,0,68,0.15),
      0 4px 12px rgba(0,0,0,0.06);
    border-color: rgba(232,200,122,0.5);
  }

  /* ── CARD IMAGE ── */
  .jcat-card-img-wrap {
    position: relative;
    height: 150px;
    overflow: hidden;
    background: linear-gradient(135deg, #ffe6f0, #fff0f6);
  }
  .jcat-card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
  }
  .jcat-card:hover .jcat-card-img {
    transform: scale(1.08);
  }
  .jcat-card-icon-fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(204,0,102,0.3);
    background: linear-gradient(135deg, rgba(255,0,128,0.08), rgba(153,0,68,0.05));
  }
  .jcat-card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      transparent 40%,
      rgba(153,0,68,0.18) 100%
    );
    opacity: 0;
    transition: opacity 0.35s ease;
  }
  .jcat-card:hover .jcat-card-overlay { opacity: 1; }

  /* Gold corner accents */
  .jcat-card-corner {
    position: absolute;
    width: 14px;
    height: 14px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .jcat-card:hover .jcat-card-corner { opacity: 1; }
  .jcat-card-corner.tl {
    top: 8px; left: 8px;
    border-top: 1.5px solid var(--jc-gold);
    border-left: 1.5px solid var(--jc-gold);
  }
  .jcat-card-corner.br {
    bottom: 8px; right: 8px;
    border-bottom: 1.5px solid var(--jc-gold);
    border-right: 1.5px solid var(--jc-gold);
  }

  /* ── CARD BODY ── */
  .jcat-card-body {
    padding: 14px 16px 16px;
  }
  .jcat-card-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 600;
    font-size: 17px;
    color: #1a0010;
    margin: 0 0 6px;
    letter-spacing: 0.01em;
    transition: color 0.2s ease;
  }
  .jcat-card:hover .jcat-card-name { color: var(--jc-magenta); }
  .jcat-card-desc {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 11.5px;
    color: #999;
    letter-spacing: 0.04em;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0 0 12px;
  }
  .jcat-card-cta {
    display: flex;
    align-items: center;
    gap: 6px;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  .jcat-card:hover .jcat-card-cta {
    opacity: 1;
    transform: translateY(0);
  }
  .jcat-cta-text {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 10.5px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--jc-magenta);
  }
  .jcat-cta-arrow {
    color: var(--jc-gold);
    font-size: 14px;
    transition: transform 0.3s ease;
  }
  .jcat-card:hover .jcat-cta-arrow { transform: translateX(3px); }

  /* ── CARD BOTTOM BAR ── */
  .jcat-card-bar {
    height: 2px;
    background: linear-gradient(90deg, var(--jc-magenta), var(--jc-pink));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
  }
  .jcat-card:hover .jcat-card-bar { transform: scaleX(1); }

  /* ── SKELETON ── */
  .jcat-card-skeleton {
    flex-shrink: 0;
    width: 240px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(232,200,122,0.15);
    background: white;
  }
  .jcat-skeleton-img {
    height: 150px;
    background: linear-gradient(135deg, #ffe6f0, #fff0f6);
    animation: jcatShimmer 1.4s ease-in-out infinite;
  }
  .jcat-skeleton-body { padding: 14px 16px; }
  .jcat-skeleton-line {
    height: 12px;
    border-radius: 6px;
    background: rgba(204,0,102,0.1);
    margin-bottom: 8px;
    animation: jcatShimmer 1.4s ease-in-out infinite;
    width: 55%;
  }
  .jcat-skeleton-line.wide { width: 75%; height: 16px; }
  @keyframes jcatShimmer {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  /* ── VIEW ALL ── */
  .jcat-footer {
    text-align: center;
    margin-top: 40px;
  }
  .jcat-view-all-btn {
    position: relative;
    overflow: hidden;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }
  .jcat-view-all-inner {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 14px 40px;
    border: 1px solid rgba(232,200,122,0.5);
    background: linear-gradient(135deg, var(--jc-magenta) 0%, var(--jc-pink) 50%, var(--jc-magenta) 100%);
    background-size: 200% 100%;
    border-radius: 2px;
    transition: all 0.4s ease;
    position: relative;
    z-index: 1;
  }
  .jcat-view-all-btn:hover .jcat-view-all-inner {
    background-position: 100% 0;
    border-color: var(--jc-gold);
    box-shadow: 0 0 30px rgba(255,0,128,0.4), 0 8px 24px rgba(0,0,0,0.12);
    transform: translateY(-2px);
  }
  .jcat-view-all-inner span:first-child {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 12px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: white;
  }
  .jcat-view-all-arrow {
    color: var(--jc-gold-light);
    font-size: 16px;
    transition: transform 0.3s ease;
  }
  .jcat-view-all-btn:hover .jcat-view-all-arrow { transform: translateX(4px); }
  .jcat-view-all-shimmer {
    position: absolute;
    top: 0; left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: skewX(-20deg);
    transition: left 0.55s ease;
  }
  .jcat-view-all-btn:hover .jcat-view-all-shimmer { left: 150%; }
`