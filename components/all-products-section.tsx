'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ActiveRatingDisplay from '@/components/active-rating-display'
import { IProduct } from '@/models/Product'
import { getProductDisplayImage, getProductDisplayPrice } from '@/lib/product-utils'

export default function AllProductsSection() {
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const currentPage = loadMore ? page : 1
      const response = await fetch(`/api/products?catalog=true&page=${currentPage}&limit=8`)

      if (response.ok) {
        const data = await response.json()

        if (loadMore) {
          setProducts(prev => [...prev, ...data.products])
        } else {
          setProducts(data.products)
        }

        setHasMore(data.products.length === 8)
        if (loadMore) {
          setPage(prev => prev + 1)
        } else {
          setPage(2)
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    fetchProducts(true)
  }

  return (
    <>
      <style>{apStyles}</style>
      <section className="jap-section">

        {/* Subtle background pattern */}
        <div className="jap-bg-pattern" aria-hidden="true" />

        <div className="jap-inner">

          {/* ── HEADER ── */}
          <div className="jap-header">
            <div className="jap-header-left">
              
              <h2 className="jap-title">Our Products</h2>
              <div className="jap-title-divider">
                <span className="jap-divider-seg" />
                <span className="jap-divider-gem"></span>
                <span className="jap-divider-seg right" />
              </div>
            </div>

            <Link href="/products" className="jap-view-all-link">
              <button className="jap-view-all-btn">
                <span className="jap-view-all-inner">
                  <span>View All </span>
                  <span className="jap-view-all-arrow"></span>
                </span>
                <span className="jap-view-all-shimmer" />
              </button>
            </Link>
          </div>

          {/* ── GRID ── */}
          <div className="jap-grid">
            {loading
              ? Array(8).fill(0).map((_, i) => (
                  <div key={i} className="jap-skeleton">
                    <div className="jap-skeleton-img" />
                    <div className="jap-skeleton-body">
                      <div className="jap-skeleton-line short" />
                      <div className="jap-skeleton-line wide" />
                      <div className="jap-skeleton-line mid" />
                      <div className="jap-skeleton-line price" />
                    </div>
                  </div>
                ))
              : products.map((product, index) => {
                  const displayImage = getProductDisplayImage(product)
                  const { price, oldPrice } = getProductDisplayPrice(product)
                  const hasDiscount = !!oldPrice
                  const discountPct = hasDiscount
                    ? Math.round((1 - price / oldPrice!) * 100)
                    : 0

                  return (
                    <div
                      key={product._id}
                      className="jap-card"
                      style={{ animationDelay: `${(index % 8) * 0.06}s` }}
                    >
                      {/* Image */}
                      <Link href={`/product/${product._id}`} className="jap-card-img-link">
                        <div className="jap-card-img-wrap">
                          <img
                            src={displayImage}
                            alt={product.name}
                            className="jap-card-img"
                          />
                          <div className="jap-card-img-overlay" />

                          {/* Discount badge */}
                          {hasDiscount && (
                            <div className="jap-disc-badge">-{discountPct}%</div>
                          )}

                          {/* Gold corners */}
                          <div className="jap-img-corner tl" />
                          <div className="jap-img-corner br" />

                          {/* Quick view hint */}
                          <div className="jap-quick-view">View</div>
                        </div>
                      </Link>

                      {/* Body */}
                      <div className="jap-card-body">
                        <span className="jap-card-cat">{product.category}</span>

                        <Link href={`/product/${product._id}`}>
                          <h3 className="jap-card-name">{product.name}</h3>
                        </Link>

                        <div className="jap-card-rating">
                          <ActiveRatingDisplay
                            productId={product._id || ''}
                            initialRating={product.rating}
                            initialReviews={product.reviews}
                            size="sm"
                          />
                        </div>

                        <div className="jap-price-row">
                          <span className="jap-price-current">KSH {price.toLocaleString()}</span>
                          {oldPrice && (
                            <span className="jap-price-old">KSH {oldPrice.toLocaleString()}</span>
                          )}
                        </div>
                      </div>

                      {/* Bottom bar */}
                      <div className="jap-card-bar" />
                    </div>
                  )
                })}
          </div>

          {/* ── LOAD MORE ── */}
          {hasMore && !loading && (
            <div className="jap-load-more-wrap">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="jap-load-more-btn"
              >
                <span className="jap-load-more-inner">
                  {loadingMore
                    ? <><span className="jap-spinner" /> Loading…</>
                    : <><span>Load More</span><span className="jap-load-arrow">↓</span></>
                  }
                </span>
                <span className="jap-load-shimmer" />
              </button>
            </div>
          )}

        </div>
      </section>
    </>
  )
}

const apStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Josefin+Sans:wght@200;300;400&display=swap');

  :root {
    --jap-pink:    #FF0080;
    --jap-magenta: #CC0066;
    --jap-deep:    #990044;
    --jap-gold:    #E8C87A;
    --jap-gold-lt: #F5DFA0;
  }

  /* ── SECTION ── */
  .jap-section {
    position: relative;
    padding: 64px 24px 80px;
    background: #ffffff;
    overflow: hidden;
  }

  /* Subtle dot pattern */
  .jap-bg-pattern {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(204,0,102,0.055) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
  }

  .jap-inner {
    position: relative;
    max-width: 1200px;
    margin: 0 auto;
    z-index: 1;
  }

  /* ── HEADER ── */
  .jap-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 40px;
    flex-wrap: wrap;
  }

  .jap-eyebrow {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  .jap-eyebrow-line {
    display: block;
    width: 32px;
    height: 1px;
    background: var(--jap-gold);
    opacity: 0.7;
  }
  .jap-eyebrow-text {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 10px;
    letter-spacing: 0.38em;
    text-transform: uppercase;
    color: var(--jap-magenta);
  }

  .jap-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: clamp(2rem, 4vw, 3rem);
    color: #1a0010;
    margin: 0 0 10px;
    line-height: 1.05;
    letter-spacing: -0.01em;
  }

  .jap-title-divider {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .jap-divider-seg {
    display: block;
    width: 48px;
    height: 2px;
    background: linear-gradient(90deg, var(--jap-magenta), var(--jap-gold));
    border-radius: 1px;
  }
  .jap-divider-seg.right {
    background: linear-gradient(270deg, transparent, var(--jap-gold));
    width: 24px;
    opacity: 0.4;
  }
  .jap-divider-gem {
    font-size: 8px;
    color: var(--jap-gold);
  }

  /* View All button */
  .jap-view-all-link { text-decoration: none; }
  .jap-view-all-btn {
    position: relative;
    overflow: hidden;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }
  .jap-view-all-inner {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 12px 32px;
    border: 1px solid rgba(232,200,122,0.5);
    background: linear-gradient(135deg, var(--jap-magenta), var(--jap-pink));
    background-size: 200% 100%;
    border-radius: 2px;
    transition: all 0.4s ease;
    position: relative;
    z-index: 1;
  }
  .jap-view-all-btn:hover .jap-view-all-inner {
    background-position: 100% 0;
    border-color: var(--jap-gold);
    box-shadow: 0 0 28px rgba(255,0,128,0.35), 0 6px 20px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
  .jap-view-all-inner span:first-child {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 11px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: white;
  }
  .jap-view-all-arrow {
    color: var(--jap-gold-lt);
    font-size: 15px;
    transition: transform 0.3s ease;
  }
  .jap-view-all-btn:hover .jap-view-all-arrow { transform: translateX(4px); }
  .jap-view-all-shimmer {
    position: absolute;
    top: 0; left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: skewX(-20deg);
    transition: left 0.55s ease;
  }
  .jap-view-all-btn:hover .jap-view-all-shimmer { left: 150%; }

  /* ── GRID ── */
  .jap-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  @media (min-width: 768px) {
    .jap-grid { grid-template-columns: repeat(4, 1fr); }
  }

  /* ── CARD ── */
  .jap-card {
    background: white;
    border-radius: 10px;
    border: 1px solid rgba(232,200,122,0.18);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s ease, border-color 0.3s;
    animation: japFadeUp 0.5s ease backwards;
    position: relative;
  }
  @keyframes japFadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .jap-card:hover {
    transform: translateY(-5px);
    border-color: rgba(232,200,122,0.5);
    box-shadow:
      0 0 0 1px rgba(232,200,122,0.15),
      0 12px 40px rgba(153,0,68,0.12),
      0 4px 12px rgba(0,0,0,0.06);
  }

  /* Image */
  .jap-card-img-link { display: block; text-decoration: none; }
  .jap-card-img-wrap {
    position: relative;
    height: 220px;
    overflow: hidden;
    background: linear-gradient(135deg, #fff0f6, #fce4f0);
  }
  @media (min-width: 768px) {
    .jap-card-img-wrap { height: 240px; }
  }
  .jap-card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
  }
  .jap-card:hover .jap-card-img { transform: scale(1.07); }

  .jap-card-img-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 55%, rgba(26,0,16,0.15) 100%);
    opacity: 0;
    transition: opacity 0.35s ease;
  }
  .jap-card:hover .jap-card-img-overlay { opacity: 1; }

  /* Discount badge */
  .jap-disc-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: linear-gradient(135deg, var(--jap-magenta), var(--jap-pink));
    color: white;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 10px;
    letter-spacing: 0.1em;
    padding: 4px 8px;
    border-radius: 2px;
    box-shadow: 0 3px 10px rgba(255,0,128,0.35);
  }

  /* Gold corners */
  .jap-img-corner {
    position: absolute;
    width: 13px;
    height: 13px;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  .jap-card:hover .jap-img-corner { opacity: 1; }
  .jap-img-corner.tl { top: 8px; right: 8px; border-top: 1.5px solid var(--jap-gold); border-right: 1.5px solid var(--jap-gold); }
  .jap-img-corner.br { bottom: 8px; left: 8px; border-bottom: 1.5px solid var(--jap-gold); border-left: 1.5px solid var(--jap-gold); }

  /* Quick view */
  .jap-quick-view {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%) translateY(6px);
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(232,200,122,0.4);
    color: var(--jap-magenta);
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 9.5px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    padding: 5px 16px;
    border-radius: 2px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  .jap-card:hover .jap-quick-view {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  /* Body */
  .jap-card-body {
    padding: 14px 14px 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .jap-card-cat {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 9.5px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #bbb;
    margin-bottom: 6px;
    display: block;
  }
  .jap-card-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 600;
    font-size: 16px;
    color: #1a0010;
    line-height: 1.3;
    margin: 0 0 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-decoration: none;
    transition: color 0.2s ease;
    cursor: pointer;
  }
  .jap-card-name:hover { color: var(--jap-magenta); }

  .jap-card-rating {
    margin-bottom: 10px;
  }

  .jap-price-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: auto;
  }
  .jap-price-current {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 19px;
    color: var(--jap-magenta);
    line-height: 1;
  }
  .jap-price-old {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 11px;
    text-decoration: line-through;
    color: #ccc;
  }

  /* Bottom bar */
  .jap-card-bar {
    height: 2px;
    background: linear-gradient(90deg, var(--jap-gold), var(--jap-pink));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
    flex-shrink: 0;
  }
  .jap-card:hover .jap-card-bar { transform: scaleX(1); }

  /* ── SKELETON ── */
  .jap-skeleton {
    border-radius: 10px;
    border: 1px solid rgba(232,200,122,0.12);
    overflow: hidden;
    background: white;
  }
  .jap-skeleton-img {
    height: 220px;
    background: linear-gradient(135deg, #ffe6f0, #fff0f6);
    animation: japShimmer 1.4s ease-in-out infinite;
  }
  .jap-skeleton-body { padding: 14px; }
  .jap-skeleton-line {
    height: 10px;
    border-radius: 5px;
    background: rgba(204,0,102,0.08);
    margin-bottom: 9px;
    animation: japShimmer 1.4s ease-in-out infinite;
  }
  .jap-skeleton-line.short  { width: 38%; }
  .jap-skeleton-line.wide   { width: 85%; height: 14px; }
  .jap-skeleton-line.mid    { width: 55%; }
  .jap-skeleton-line.price  { width: 48%; height: 16px; }
  @keyframes japShimmer {
    0%, 100% { opacity: 0.45; }
    50%       { opacity: 1; }
  }

  /* ── LOAD MORE ── */
  .jap-load-more-wrap {
    text-align: center;
    margin-top: 48px;
  }
  .jap-load-more-btn {
    position: relative;
    overflow: hidden;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }
  .jap-load-more-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .jap-load-more-inner {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 48px;
    border: 1px solid rgba(232,200,122,0.45);
    background: white;
    border-radius: 2px;
    transition: all 0.35s ease;
    position: relative;
    z-index: 1;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 11px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--jap-magenta);
  }
  .jap-load-more-btn:not(:disabled):hover .jap-load-more-inner {
    background: linear-gradient(135deg, var(--jap-magenta), var(--jap-pink));
    border-color: var(--jap-gold);
    color: white;
    box-shadow: 0 0 28px rgba(255,0,128,0.25), 0 6px 20px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }
  .jap-load-arrow {
    font-size: 16px;
    transition: transform 0.3s ease;
  }
  .jap-load-more-btn:not(:disabled):hover .jap-load-arrow { transform: translateY(3px); }
  .jap-load-shimmer {
    position: absolute;
    top: 0; left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: skewX(-20deg);
    transition: left 0.55s ease;
  }
  .jap-load-more-btn:not(:disabled):hover .jap-load-shimmer { left: 150%; }

  .jap-spinner {
    display: inline-block;
    width: 13px;
    height: 13px;
    border: 2px solid rgba(204,0,102,0.2);
    border-top-color: var(--jap-magenta);
    border-radius: 50%;
    animation: japSpin 0.7s linear infinite;
  }
  @keyframes japSpin { to { transform: rotate(360deg); } }
`