'use client'

import { useState, useEffect } from 'react'
import { Zap, Clock, Flame, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { IProduct } from '@/models/Product'
import { getProductDisplayImage, getProductDisplayPrice } from '@/lib/product-utils'

interface FeaturedDeal {
  id: number
  name: string
  originalPrice: number
  salePrice: number
  discount: number
  image: string
  rating: number
  reviews: number
  inStock: boolean
  category: string
  slug: string
}

export default function FlashDealsSection() {
  const [timeLeft, setTimeLeft] = useState(3600)
  const [deals, setDeals] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)

  const featuredDeals: FeaturedDeal[] = [
    {
      id: 1,
      name: "Samsung 55\" 4K Smart TV",
      originalPrice: 89999,
      salePrice: 67499,
      discount: 25,
      image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600",
      rating: 4.8,
      reviews: 234,
      inStock: true,
      category: "Entertainment",
      slug: "samsung-55-4k-smart-tv"
    },
    {
      id: 2,
      name: "LG Inverter Refrigerator 345L",
      originalPrice: 72999,
      salePrice: 54749,
      discount: 25,
      image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600",
      rating: 4.7,
      reviews: 189,
      inStock: true,
      category: "Home Appliances",
      slug: "lg-inverter-refrigerator-345l"
    },
    {
      id: 3,
      name: "iPhone 15 Pro 256GB",
      originalPrice: 149999,
      salePrice: 134999,
      discount: 10,
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
      rating: 4.9,
      reviews: 456,
      inStock: true,
      category: "Mobile & Tablets",
      slug: "iphone-15-pro-256gb"
    },
    {
      id: 4,
      name: "Sony WH-1000XM5 Headphones",
      originalPrice: 34999,
      salePrice: 24499,
      discount: 30,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
      rating: 4.8,
      reviews: 312,
      inStock: true,
      category: "Audio & Headphones",
      slug: "sony-wh-1000xm5-headphones"
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 3600))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchFlashDeals()
  }, [])

  const fetchFlashDeals = async () => {
    try {
      const response = await fetch('/api/products?flashDeals=true&limit=4')
      if (response.ok) {
        const data = await response.json()
        setDeals(data.products)
      }
    } catch (error) {
      console.error('Error fetching flash deals:', error)
    } finally {
      setLoading(false)
    }
  }

  const hours = Math.floor(timeLeft / 3600)
  const minutes = Math.floor((timeLeft % 3600) / 60)
  const seconds = timeLeft % 60

  const displayDeals: (IProduct | FeaturedDeal)[] = deals.length > 0 ? deals : featuredDeals

  return (
    <>
      <style>{flashStyles}</style>
      <section className="jfd-section">

        {/* Background decorative elements */}
        <div className="jfd-bg-orb left" />
        <div className="jfd-bg-orb right" />

        <div className="jfd-inner">

          {/* ── HEADER ── */}
          <div className="jfd-header">
            <div className="jfd-header-left">
              {/* Eyebrow */}
              {/* <div className="jfd-eyebrow">
                <span className="jfd-eyebrow-gem">◆</span>
                <span className="jfd-eyebrow-text">Limited Time Offer</span>
                <span className="jfd-eyebrow-gem">◆</span>
              </div> */}

              <div className="jfd-title-row">
                <div className="jfd-flame-wrap">
                  <Flame className="jfd-flame-icon" />
                </div>
                <h2 className="jfd-title">Flash Deals</h2>
              </div>

              <div className="jfd-title-underline" />
            </div>

            {/* Timer */}
            {/* <div className="jfd-timer-wrap">
              <div className="jfd-timer-label">
                <Clock size={12} />
                <span>Ends in</span>
              </div>
              <div className="jfd-timer-blocks">
                <div className="jfd-time-block">
                  <span className="jfd-time-num">{String(hours).padStart(2, '0')}</span>
                  <span className="jfd-time-unit">HRS</span>
                </div>
                <span className="jfd-time-sep">:</span>
                <div className="jfd-time-block">
                  <span className="jfd-time-num">{String(minutes).padStart(2, '0')}</span>
                  <span className="jfd-time-unit">MIN</span>
                </div>
                <span className="jfd-time-sep">:</span>
                <div className="jfd-time-block">
                  <span className="jfd-time-num" key={seconds}>{String(seconds).padStart(2, '0')}</span>
                  <span className="jfd-time-unit">SEC</span>
                </div>
              </div>
            </div> */}
          </div>

          {/* ── DIVIDER ── */}
       

          {/* ── DEALS GRID ── */}
          <div className="jfd-grid">
            {loading
              ? Array(4).fill(0).map((_, i) => (
                  <div key={i} className="jfd-skeleton">
                    <div className="jfd-skeleton-img" />
                    <div className="jfd-skeleton-body">
                      <div className="jfd-skeleton-line wide" />
                      <div className="jfd-skeleton-line" />
                      <div className="jfd-skeleton-line short" />
                    </div>
                  </div>
                ))
              : displayDeals.slice(0, 4).map((deal, index) => {
                  const isDbProduct = '_id' in deal
                  const dealId = isDbProduct ? (deal as IProduct)._id : (deal as FeaturedDeal).id
                  const dealName = deal.name
                  const dealImage = isDbProduct ? getProductDisplayImage(deal as IProduct) : (deal as FeaturedDeal).image
                  const dealSlug = isDbProduct ? (deal as IProduct)._id : (deal as FeaturedDeal).slug

                  let dealPrice: number, dealOldPrice: number | undefined, dealDiscount: number
                  if (isDbProduct) {
                    const product = deal as IProduct
                    const { price, oldPrice } = getProductDisplayPrice(product)
                    dealPrice = price
                    dealOldPrice = oldPrice
                    dealDiscount = product.flashDealDiscount || 20
                  } else {
                    const featuredDeal = deal as FeaturedDeal
                    dealPrice = featuredDeal.salePrice
                    dealOldPrice = featuredDeal.originalPrice
                    dealDiscount = featuredDeal.discount
                  }

                  const savings = dealOldPrice ? dealOldPrice - dealPrice : 0

                  return (
                    <Link
                      key={dealId}
                      href={`/product/${dealSlug}`}
                      className="jfd-card"
                      style={{ animationDelay: `${index * 0.08}s` }}
                    >
                      {/* Image */}
                      <div className="jfd-card-img-wrap">
                        <img src={dealImage} alt={dealName} className="jfd-card-img" />

                        {/* Overlay */}
                        <div className="jfd-card-overlay" />

                        {/* Discount badge */}
                        <div className="jfd-badge">
                          <span className="jfd-badge-num">-{dealDiscount}%</span>
                          <span className="jfd-badge-label">OFF</span>
                        </div>

                        {/* Gold corners */}
                        <div className="jfd-corner tl" />
                        <div className="jfd-corner br" />

                        {/* Quick cart icon */}
                        <div className="jfd-quick-cart">
                          <ShoppingCart size={16} />
                        </div>
                      </div>

                      {/* Body */}
                      <div className="jfd-card-body">
                        <p className="jfd-card-cat">
                          {'category' in deal ? (deal as FeaturedDeal).category : ''}
                        </p>
                        <h3 className="jfd-card-name">{dealName}</h3>

                        <div className="jfd-price-row">
                          <span className="jfd-price-sale">KSH {dealPrice.toLocaleString()}</span>
                          {dealOldPrice && (
                            <span className="jfd-price-orig">KSH {dealOldPrice.toLocaleString()}</span>
                          )}
                        </div>

                        {savings > 0 && (
                          <p className="jfd-savings">You save KSH {savings.toLocaleString()}</p>
                        )}

                        {/* Progress bar — visual urgency */}
                        <div className="jfd-progress-wrap">
                          <div className="jfd-progress-track">
                            <div
                              className="jfd-progress-fill"
                              style={{ width: `${Math.max(15, 80 - index * 15)}%` }}
                            />
                          </div>
                          <span className="jfd-progress-label">
                            {Math.max(2, 12 - index * 3)} left
                          </span>
                        </div>
                      </div>

                      {/* Bottom bar */}
                      <div className="jfd-card-bar" />
                    </Link>
                  )
                })}
          </div>

          {/* ── CTA ── */}
          <div className="jfd-footer">
            <Link href="/products">
              <button className="jfd-cta-btn">
                <span className="jfd-cta-inner">
                  <span>View All Deals</span>
                  <span className="jfd-cta-arrow"></span>
                </span>
                <span className="jfd-cta-shimmer" />
              </button>
            </Link>
          </div>

        </div>
      </section>
    </>
  )
}

const flashStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Josefin+Sans:wght@200;300;400&display=swap');

  :root {
    --jfd-pink:    #FF0080;
    --jfd-magenta: #CC0066;
    --jfd-deep:    #990044;
    --jfd-gold:    #E8C87A;
    --jfd-gold-lt: #F5DFA0;
  }

  /* ── SECTION ── */
  .jfd-section {
    position: relative;
    padding: 64px 24px 72px;
    overflow: hidden;
    background: linear-gradient(160deg, #1a0010 0%, #2d0020 40%, #1a0010 100%);
  }

  /* Ambient orbs */
  .jfd-bg-orb {
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0.18;
  }
  .jfd-bg-orb.left {
    top: -100px; left: -100px;
    background: radial-gradient(circle, var(--jfd-pink), transparent 70%);
  }
  .jfd-bg-orb.right {
    bottom: -100px; right: -100px;
    background: radial-gradient(circle, var(--jfd-magenta), transparent 70%);
  }

  .jfd-inner {
    position: relative;
    max-width: 1200px;
    margin: 0 auto;
    z-index: 1;
  }

  /* ── HEADER ── */
  .jfd-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .jfd-header-left {}

  /* Eyebrow */
  .jfd-eyebrow {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .jfd-eyebrow-text {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 10px;
    letter-spacing: 0.38em;
    text-transform: uppercase;
    color: var(--jfd-gold);
  }
  .jfd-eyebrow-gem {
    font-size: 7px;
    color: var(--jfd-gold);
    opacity: 0.6;
  }

  /* Title */
  .jfd-title-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .jfd-flame-wrap {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--jfd-pink), var(--jfd-deep));
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 20px rgba(255,0,128,0.4);
    animation: jfdPulse 2s ease-in-out infinite;
  }
  @keyframes jfdPulse {
    0%, 100% { box-shadow: 0 0 20px rgba(255,0,128,0.4); }
    50% { box-shadow: 0 0 36px rgba(255,0,128,0.7); }
  }
  .jfd-flame-icon {
    width: 22px;
    height: 22px;
    color: white;
  }
  .jfd-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: clamp(2rem, 4vw, 3.2rem);
    color: white;
    letter-spacing: 0.02em;
    line-height: 1;
    margin: 0;
  }
  .jfd-title-underline {
    margin-top: 10px;
    height: 2px;
    width: 120px;
    background: linear-gradient(90deg, var(--jfd-gold), var(--jfd-pink), transparent);
    border-radius: 1px;
  }

  /* ── TIMER ── */
  .jfd-timer-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }
  .jfd-timer-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
  }
  .jfd-timer-blocks {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .jfd-time-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(232,200,122,0.25);
    border-radius: 6px;
    padding: 8px 14px;
    min-width: 54px;
  }
  .jfd-time-num {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 26px;
    color: white;
    line-height: 1;
    animation: jfdFlip 0.3s ease;
  }
  @keyframes jfdFlip {
    from { transform: translateY(-4px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .jfd-time-unit {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 8px;
    letter-spacing: 0.2em;
    color: var(--jfd-gold);
    margin-top: 2px;
  }
  .jfd-time-sep {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    color: var(--jfd-gold);
    line-height: 1;
    opacity: 0.7;
    margin-bottom: 14px;
  }

  /* ── DIVIDER ── */
  .jfd-divider {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 36px;
  }
  .jfd-divider-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(232,200,122,0.4), transparent);
  }
  .jfd-divider-line:last-child {
    background: linear-gradient(270deg, rgba(232,200,122,0.4), transparent);
  }
  .jfd-divider-diamond {
    color: var(--jfd-gold);
    font-size: 12px;
    opacity: 0.7;
  }

  /* ── GRID ── */
  .jfd-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 40px;
  }
  @media (min-width: 1024px) {
    .jfd-grid { grid-template-columns: repeat(4, 1fr); }
  }

  /* ── CARD ── */
  .jfd-card {
    display: block;
    text-decoration: none;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(232,200,122,0.15);
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s ease, border-color 0.3s ease;
    position: relative;
    animation: jfdFadeUp 0.5s ease backwards;
  }
  @keyframes jfdFadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .jfd-card:hover {
    transform: translateY(-6px);
    border-color: rgba(232,200,122,0.45);
    box-shadow:
      0 0 0 1px rgba(232,200,122,0.2),
      0 16px 48px rgba(0,0,0,0.4),
      0 0 30px rgba(255,0,128,0.12);
  }

  /* Image */
  .jfd-card-img-wrap {
    position: relative;
    height: 180px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(255,0,128,0.08), rgba(153,0,68,0.05));
  }
  .jfd-card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
  }
  .jfd-card:hover .jfd-card-img { transform: scale(1.07); }

  .jfd-card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 50%, rgba(26,0,16,0.6) 100%);
  }

  /* Discount badge */
  .jfd-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    background: linear-gradient(135deg, var(--jfd-magenta), var(--jfd-pink));
    border-radius: 4px 4px 4px 0;
    padding: 4px 9px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 4px 12px rgba(255,0,128,0.4);
  }
  .jfd-badge::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    border-left: 5px solid var(--jfd-deep);
    border-bottom: 5px solid transparent;
  }
  .jfd-badge-num {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 16px;
    color: white;
    line-height: 1;
  }
  .jfd-badge-label {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 7px;
    letter-spacing: 0.18em;
    color: rgba(255,255,255,0.8);
  }

  /* Gold corners */
  .jfd-corner {
    position: absolute;
    width: 14px;
    height: 14px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .jfd-card:hover .jfd-corner { opacity: 1; }
  .jfd-corner.tl { top: 8px; right: 8px; border-top: 1.5px solid var(--jfd-gold); border-right: 1.5px solid var(--jfd-gold); }
  .jfd-corner.br { bottom: 8px; right: 8px; border-bottom: 1.5px solid var(--jfd-gold); border-right: 1.5px solid var(--jfd-gold); }

  /* Quick cart */
  .jfd-quick-cart {
    position: absolute;
    bottom: 12px;
    right: 12px;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255,255,255,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transform: scale(0.8);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  .jfd-card:hover .jfd-quick-cart {
    opacity: 1;
    transform: scale(1);
  }

  /* Card body */
  .jfd-card-body {
    padding: 14px 16px 16px;
  }
  .jfd-card-cat {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 9.5px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--jfd-gold);
    margin: 0 0 6px;
    opacity: 0.8;
  }
  .jfd-card-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 600;
    font-size: 16px;
    color: white;
    line-height: 1.3;
    margin: 0 0 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.2s;
  }
  .jfd-card:hover .jfd-card-name { color: var(--jfd-gold-lt); }

  .jfd-price-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }
  .jfd-price-sale {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 20px;
    color: var(--jfd-pink);
    line-height: 1;
  }
  .jfd-price-orig {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 11px;
    text-decoration: line-through;
    color: rgba(255,255,255,0.35);
  }
  .jfd-savings {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 10px;
    letter-spacing: 0.06em;
    color: rgba(232,200,122,0.75);
    margin: 0 0 12px;
  }

  /* Progress bar */
  .jfd-progress-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .jfd-progress-track {
    flex: 1;
    height: 3px;
    background: rgba(255,255,255,0.1);
    border-radius: 2px;
    overflow: hidden;
  }
  .jfd-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--jfd-gold), var(--jfd-pink));
    border-radius: 2px;
    transition: width 0.8s ease;
  }
  .jfd-progress-label {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 9.5px;
    letter-spacing: 0.05em;
    color: rgba(255,255,255,0.4);
    white-space: nowrap;
  }

  /* Bottom bar */
  .jfd-card-bar {
    height: 2px;
    background: linear-gradient(90deg, var(--jfd-gold), var(--jfd-pink));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
  }
  .jfd-card:hover .jfd-card-bar { transform: scaleX(1); }

  /* ── SKELETON ── */
  .jfd-skeleton {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(232,200,122,0.1);
    background: rgba(255,255,255,0.03);
  }
  .jfd-skeleton-img {
    height: 180px;
    background: rgba(255,255,255,0.06);
    animation: jfdShimmer 1.4s ease-in-out infinite;
  }
  .jfd-skeleton-body { padding: 14px 16px; }
  .jfd-skeleton-line {
    height: 10px;
    border-radius: 5px;
    background: rgba(255,255,255,0.07);
    margin-bottom: 8px;
    animation: jfdShimmer 1.4s ease-in-out infinite;
    width: 50%;
  }
  .jfd-skeleton-line.wide { width: 80%; height: 14px; }
  .jfd-skeleton-line.short { width: 40%; }
  @keyframes jfdShimmer {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 0.9; }
  }

  /* ── CTA ── */
  .jfd-footer { text-align: center; }
  .jfd-cta-btn {
    position: relative;
    overflow: hidden;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }
  .jfd-cta-inner {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 15px 44px;
    border: 1px solid rgba(232,200,122,0.4);
    background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
    border-radius: 2px;
    transition: all 0.35s ease;
    position: relative;
    z-index: 1;
  }
  .jfd-cta-btn:hover .jfd-cta-inner {
    background: linear-gradient(135deg, var(--jfd-magenta), var(--jfd-pink));
    border-color: var(--jfd-gold);
    box-shadow: 0 0 40px rgba(255,0,128,0.35), 0 8px 32px rgba(0,0,0,0.3);
    transform: translateY(-2px);
  }
  .jfd-cta-inner span {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 12px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: white;
  }
  .jfd-cta-zap {
    color: var(--jfd-gold);
    flex-shrink: 0;
  }
  .jfd-cta-arrow {
    color: var(--jfd-gold-lt) !important;
    font-size: 16px;
    transition: transform 0.3s ease;
  }
  .jfd-cta-btn:hover .jfd-cta-arrow { transform: translateX(4px); }
  .jfd-cta-shimmer {
    position: absolute;
    top: 0; left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    transform: skewX(-20deg);
    transition: left 0.55s ease;
  }
  .jfd-cta-btn:hover .jfd-cta-shimmer { left: 150%; }
`