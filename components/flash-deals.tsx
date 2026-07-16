'use client'

import { useState, useEffect } from 'react'
import { Flame, Star, Award, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { IProduct } from '@/models/Product'
import { getProductDisplayImage, getProductDisplayPrice } from '@/lib/product-utils'

// ─── Types ───────────────────────────────────────────────────────────────────

type SectionMode = 'flash' | 'bestseller' | 'featured' | 'mixed'

interface EnrichedProduct extends IProduct {
  _sectionMode: SectionMode
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchByFilter(param: string, limit = 8): Promise<IProduct[]> {
  try {
    const res = await fetch(`/api/products?${param}=true&limit=${limit}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.products || []
  } catch {
    return []
  }
}

function tag(products: IProduct[], mode: SectionMode): EnrichedProduct[] {
  return products.map(p => ({ ...p, _sectionMode: mode }))
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FlashDealsSection() {
  const [products, setProducts]   = useState<EnrichedProduct[]>([])
  const [mode, setMode]           = useState<SectionMode>('flash')
  const [loading, setLoading]     = useState(true)
  // Track which other collections exist so we can show section pills
  const [hasFeatured, setHasFeatured]     = useState(false)
  const [hasBestseller, setHasBestseller] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)

      // Fetch all three in parallel — flash deal wins; others fill in
      const [flash, bestseller, featured] = await Promise.all([
        fetchByFilter('flashDeals', 8),
        fetchByFilter('bestseller', 8),
        fetchByFilter('featured', 8),
      ])

      // Always track what else is available for section pills
      setHasBestseller(bestseller.length > 0)
      setHasFeatured(featured.length > 0)

      if (flash.length > 0) {
        setProducts(tag(flash, 'flash'))
        setMode('flash')
      } else if (bestseller.length > 0 && featured.length > 0) {
        // Mix — mark each so we can show the right pill
        const mixed = [
          ...tag(bestseller, 'bestseller'),
          ...tag(featured, 'featured'),
        ]
        // De-duplicate by _id
        const seen = new Set<string>()
        const deduped = mixed.filter(p => {
          const id = String(p._id)
          if (seen.has(id)) return false
          seen.add(id)
          return true
        })
        setProducts(deduped.slice(0, 8))
        setMode('mixed')
      } else if (bestseller.length > 0) {
        setProducts(tag(bestseller, 'bestseller'))
        setMode('bestseller')
      } else if (featured.length > 0) {
        setProducts(tag(featured, 'featured'))
        setMode('featured')
      } else {
        setProducts([])
      }

      setLoading(false)
    })()
  }, [])

  if (!loading && products.length === 0) return null

  const sectionTitle = {
    flash:      'Flash Deals',
    bestseller: 'Best Sellers',
    featured:   'Featured',
    mixed:      'Top Picks',
  }[mode]

  const ctaHref = {
    flash:      '/products?filter=flashDeals',
    bestseller: '/products?filter=bestseller',
    featured:   '/products?filter=featured',
    mixed:      '/products',
  }[mode]

  const ctaLabel = {
    flash:      'View All Deals',
    bestseller: 'View All Best Sellers',
    featured:   'View All Featured',
    mixed:      'View All Products',
  }[mode]

  const SectionIcon = mode === 'flash' ? Flame : mode === 'bestseller' ? Award : Star

  return (
    <>
      <style>{flashStyles}</style>
      <section className="jfd-section">
        <div className="jfd-bg-orb left" />
        <div className="jfd-bg-orb right" />

        <div className="jfd-inner">

          {/* ── HEADER ── */}
          <div className="jfd-header">
            <div className="jfd-header-left">
              <div className="jfd-title-row">
                <div className={`jfd-flame-wrap ${mode !== 'flash' ? 'alt' : ''}`}>
                  <SectionIcon className="jfd-flame-icon" />
                </div>
                <h2 className="jfd-title">{sectionTitle}</h2>
              </div>
              <div className="jfd-title-underline" />
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div className="jfd-divider">
            <div className="jfd-divider-line" />
            <span className="jfd-divider-gem">◆</span>
            <div className="jfd-divider-line" />
          </div>

          {/* ── GRID ── */}
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
              : products.slice(0, 4).map((product, index) => {
                  const { price, oldPrice } = getProductDisplayPrice(product)
                  const savings   = oldPrice ? oldPrice - price : 0
                  const discount  = product.flashDealDiscount || (oldPrice ? Math.round((savings / oldPrice) * 100) : 0)
                  const isFlash   = product._sectionMode === 'flash'

                  // Pill config for non-flash products
                  const pill = product._sectionMode === 'bestseller'
                    ? { label: 'Best Seller', href: '/products?filter=bestseller', cls: 'bestseller' }
                    : product._sectionMode === 'featured'
                    ? { label: 'Featured', href: '/products?filter=featured', cls: 'featured' }
                    : null

                  return (
                    <div key={String(product._id)} className="jfd-card-wrap" style={{ animationDelay: `${index * 0.08}s` }}>
                      <Link href={`/product/${product.slug}`} className="jfd-card">

                        {/* Image */}
                        <div className="jfd-card-img-wrap">
                          <img
                            src={getProductDisplayImage(product)}
                            alt={product.name}
                            className="jfd-card-img"
                          />
                          <div className="jfd-card-overlay" />

                          {/* Badge — discount % for flash, label for others */}
                          {isFlash && discount > 0 && (
                            <div className="jfd-badge">
                              <span className="jfd-badge-num">-{discount}%</span>
                              <span className="jfd-badge-label">OFF</span>
                            </div>
                          )}

                          <div className="jfd-corner tl" />
                          <div className="jfd-corner br" />

                          <div className="jfd-quick-cart">
                            <ShoppingCart size={16} />
                          </div>
                        </div>

                        {/* Body */}
                        <div className="jfd-card-body">
                          <p className="jfd-card-cat">{product.category}</p>
                          <h3 className="jfd-card-name">{product.name}</h3>

                          <div className="jfd-price-row">
                            <span className="jfd-price-sale">KSH {price.toLocaleString()}</span>
                            {oldPrice != null && oldPrice > 0 && (
                              <span className="jfd-price-orig">KSH {oldPrice.toLocaleString()}</span>
                            )}
                          </div>

                          {isFlash && savings > 0 && (
                            <p className="jfd-savings">You save KSH {savings.toLocaleString()}</p>
                          )}

                          {isFlash && (
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
                          )}
                        </div>

                        <div className="jfd-card-bar" />
                      </Link>

                      {/* Pill filter button — only for non-flash cards */}
                      {pill && (
                        <Link href={pill.href} className={`jfd-pill ${pill.cls}`}>
                          {pill.label} →
                        </Link>
                      )}
                    </div>
                  )
                })}
          </div>

          {/* ── SECTION PILLS — shown when flash is active but other collections also exist ── */}
          {mode === 'flash' && (hasFeatured || hasBestseller) && (
            <div className="jfd-section-pills">
              <span className="jfd-section-pills-label">Also browse:</span>
              {hasFeatured && (
                <Link href="/products?filter=featured" className="jfd-pill featured">
                  ⭐ Featured
                </Link>
              )}
              {hasBestseller && (
                <Link href="/products?filter=bestseller" className="jfd-pill bestseller">
                  🏆 Best Sellers
                </Link>
              )}
            </div>
          )}

          {/* ── CTA ── */}
          <div className="jfd-footer">
            <Link href={ctaHref}>
              <button className="jfd-cta-btn">
                <span className="jfd-cta-inner">
                  <span>{ctaLabel}</span>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const flashStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Josefin+Sans:wght@200;300;400&display=swap');

  :root {
    --jfd-pink:    #FF0080;
    --jfd-magenta: #CC0066;
    --jfd-deep:    #990044;
    --jfd-gold:    #E8C87A;
    --jfd-gold-lt: #F5DFA0;
  }

  .jfd-section {
    position: relative;
    padding: 64px 24px 72px;
    overflow: hidden;
    background: linear-gradient(160deg, #1a0010 0%, #2d0020 40%, #1a0010 100%);
  }
  .jfd-bg-orb {
    position: absolute; width: 400px; height: 400px;
    border-radius: 50%; pointer-events: none; opacity: 0.18;
  }
  .jfd-bg-orb.left  { top: -100px; left: -100px;   background: radial-gradient(circle, var(--jfd-pink),    transparent 70%); }
  .jfd-bg-orb.right { bottom: -100px; right: -100px; background: radial-gradient(circle, var(--jfd-magenta), transparent 70%); }
  .jfd-inner { position: relative; max-width: 1200px; margin: 0 auto; z-index: 1; }

  /* Header */
  .jfd-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 24px; flex-wrap: wrap; }
  .jfd-title-row { display: flex; align-items: center; gap: 14px; }
  .jfd-flame-wrap {
    width: 44px; height: 44px; border-radius: 50%;
    background: linear-gradient(135deg, var(--jfd-pink), var(--jfd-deep));
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 20px rgba(255,0,128,0.4);
    animation: jfdPulse 2s ease-in-out infinite;
  }
  .jfd-flame-wrap.alt {
    background: linear-gradient(135deg, var(--jfd-gold), var(--jfd-magenta));
    box-shadow: 0 0 20px rgba(232,200,122,0.4);
  }
  @keyframes jfdPulse {
    0%, 100% { box-shadow: 0 0 20px rgba(255,0,128,0.4); }
    50%       { box-shadow: 0 0 36px rgba(255,0,128,0.7); }
  }
  .jfd-flame-icon { width: 22px; height: 22px; color: white; }
  .jfd-title {
    font-family: 'Cormorant Garamond', serif; font-weight: 700;
    font-size: clamp(2.25rem, 4vw, 3.5rem); color: white;
    letter-spacing: 0.02em; line-height: 1; margin: 0;
  }
  .jfd-title-underline {
    margin-top: 10px; height: 2px; width: 120px;
    background: linear-gradient(90deg, var(--jfd-gold), var(--jfd-pink), transparent);
    border-radius: 1px;
  }

  /* Divider */
  .jfd-divider { display: flex; align-items: center; gap: 14px; margin-bottom: 36px; }
  .jfd-divider-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(232,200,122,0.3), transparent); }
  .jfd-divider-gem { font-size: 8px; color: var(--jfd-gold); opacity: 0.6; }

  /* Grid */
  .jfd-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  @media (min-width: 768px) { .jfd-grid { grid-template-columns: repeat(4, 1fr); gap: 20px; } }

  /* Card wrapper — holds the card + optional pill */
  .jfd-card-wrap {
    display: flex; flex-direction: column; gap: 8px;
    animation: jfdFadeUp 0.5s ease backwards;
  }
  @keyframes jfdFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Card */
  .jfd-card {
    display: flex; flex-direction: column;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(232,200,122,0.15);
    border-radius: 12px; overflow: hidden;
    text-decoration: none;
    transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    flex: 1;
  }
  .jfd-card:hover {
    transform: translateY(-6px);
    border-color: rgba(232,200,122,0.45);
    box-shadow: 0 16px 48px rgba(0,0,0,0.35), 0 0 0 1px rgba(232,200,122,0.2);
  }

  /* Image */
  .jfd-card-img-wrap { position: relative; aspect-ratio: 1; overflow: hidden; background: #0d0008; }
  .jfd-card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; display: block; }
  .jfd-card:hover .jfd-card-img { transform: scale(1.06); }
  .jfd-card-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.55) 100%);
  }

  /* Discount badge */
  .jfd-badge {
    position: absolute; top: 10px; left: 10px;
    background: linear-gradient(135deg, var(--jfd-pink), var(--jfd-magenta));
    border-radius: 6px; padding: 5px 8px;
    display: flex; flex-direction: column; align-items: center;
    box-shadow: 0 3px 10px rgba(255,0,128,0.5);
    line-height: 1;
  }
  .jfd-badge-num { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 15px; color: white; }
  .jfd-badge-label { font-family: 'Josefin Sans', sans-serif; font-weight: 300; font-size: 8px; letter-spacing: 0.2em; color: rgba(255,255,255,0.85); }

  /* Gold corners */
  .jfd-corner {
    position: absolute; width: 14px; height: 14px;
    border-color: rgba(232,200,122,0.6); border-style: solid;
  }
  .jfd-corner.tl { top: 8px; left: 8px; border-width: 1.5px 0 0 1.5px; }
  .jfd-corner.br { bottom: 8px; right: 8px; border-width: 0 1.5px 1.5px 0; }

  /* Quick cart */
  .jfd-quick-cart {
    position: absolute; bottom: 10px; right: 10px;
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(255,255,255,0.15); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    color: white; opacity: 0;
    transition: opacity 0.2s ease;
  }
  .jfd-card:hover .jfd-quick-cart { opacity: 1; }

  /* Card body */
  .jfd-card-body { padding: 14px 14px 10px; flex: 1; display: flex; flex-direction: column; gap: 6px; }
  .jfd-card-cat {
    font-family: 'Josefin Sans', sans-serif; font-weight: 300;
    font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--jfd-gold); margin: 0;
  }
  .jfd-card-name {
    font-family: 'Cormorant Garamond', serif; font-weight: 600;
    font-size: clamp(14px, 2vw, 17px); color: white;
    margin: 0; line-height: 1.25;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .jfd-price-row { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .jfd-price-sale {
    font-family: 'Cormorant Garamond', serif; font-weight: 700;
    font-size: clamp(16px, 2.5vw, 20px); color: var(--jfd-gold-lt);
  }
  .jfd-price-orig {
    font-family: 'Josefin Sans', sans-serif; font-weight: 300;
    font-size: 11px; color: rgba(255,255,255,0.35); text-decoration: line-through;
  }
  .jfd-savings {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 11px; color: #7fffb0; letter-spacing: 0.06em; margin: 0;
  }

  /* Progress bar */
  .jfd-progress-wrap { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
  .jfd-progress-track {
    flex: 1; height: 3px; border-radius: 2px;
    background: rgba(255,255,255,0.12); overflow: hidden;
  }
  .jfd-progress-fill {
    height: 100%; border-radius: 2px;
    background: linear-gradient(90deg, var(--jfd-gold), var(--jfd-pink));
    transition: width 0.6s ease;
  }
  .jfd-progress-label {
    font-family: 'Josefin Sans', sans-serif; font-weight: 300;
    font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase;
    color: rgba(255,255,255,0.4); white-space: nowrap;
  }

  /* Bottom bar */
  .jfd-card-bar {
    height: 2px;
    background: linear-gradient(90deg, var(--jfd-gold), var(--jfd-pink), transparent);
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.4s ease;
  }
  .jfd-card:hover .jfd-card-bar { transform: scaleX(1); }

  /* Section-level pills (shown below grid when flash is active + other collections exist) */
  .jfd-section-pills {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 28px;
    padding-top: 20px;
    border-top: 1px solid rgba(232,200,122,0.12);
  }
  .jfd-section-pills-label {
    font-family: 'Josefin Sans', sans-serif; font-weight: 300;
    font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(255,255,255,0.4);
  }

  /* Pill filter buttons */
  .jfd-pill {
    display: inline-flex;
    align-self: flex-start;
    align-items: center;
    padding: 5px 14px;
    border-radius: 999px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-decoration: none;
    transition: all 0.2s ease;
    border: 1px solid;
  }
  .jfd-pill.bestseller {
    color: var(--jfd-gold);
    border-color: rgba(232,200,122,0.4);
    background: rgba(232,200,122,0.08);
  }
  .jfd-pill.bestseller:hover {
    background: rgba(232,200,122,0.2);
    border-color: var(--jfd-gold);
    color: var(--jfd-gold-lt);
  }
  .jfd-pill.featured {
    color: var(--jfd-pink);
    border-color: rgba(255,0,128,0.35);
    background: rgba(255,0,128,0.08);
  }
  .jfd-pill.featured:hover {
    background: rgba(255,0,128,0.18);
    border-color: var(--jfd-pink);
    color: white;
  }

  /* Skeleton */
  .jfd-skeleton { border-radius: 12px; overflow: hidden; background: rgba(255,255,255,0.04); border: 1px solid rgba(232,200,122,0.1); animation: jfdShimmer 1.4s ease-in-out infinite; }
  @keyframes jfdShimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
  .jfd-skeleton-img { aspect-ratio: 1; background: rgba(255,255,255,0.07); }
  .jfd-skeleton-body { padding: 14px; display: flex; flex-direction: column; gap: 8px; }
  .jfd-skeleton-line { height: 10px; border-radius: 4px; background: rgba(255,255,255,0.07); }
  .jfd-skeleton-line.wide { width: 80%; }
  .jfd-skeleton-line.short { width: 45%; }

  /* CTA footer */
  .jfd-footer { display: flex; justify-content: center; margin-top: 40px; }
  .jfd-cta-btn {
    position: relative; overflow: hidden; background: none; border: none; padding: 0; cursor: pointer;
  }
  .jfd-cta-inner {
    display: inline-flex; align-items: center; gap: 12px;
    padding: 14px 40px; border-radius: 2px;
    background: linear-gradient(135deg, var(--jfd-magenta), var(--jfd-pink));
    border: 1px solid rgba(232,200,122,0.3);
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 13px; letter-spacing: 0.28em; text-transform: uppercase;
    color: white; position: relative; z-index: 1;
    transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
  }
  .jfd-cta-btn:hover .jfd-cta-inner {
    border-color: var(--jfd-gold);
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(255,0,128,0.4);
  }
  .jfd-cta-arrow { color: var(--jfd-gold-lt); font-size: 16px; transition: transform 0.3s; }
  .jfd-cta-btn:hover .jfd-cta-arrow { transform: translateX(5px); }
  .jfd-cta-shimmer {
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
    transform: skewX(-20deg); transition: left 0.55s ease;
  }
  .jfd-cta-btn:hover .jfd-cta-shimmer { left: 150%; }
`
