'use client'

import { useState, useEffect } from 'react'
import { Star, Search, Filter, Grid, List, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { IProduct } from '@/models/Product'
import { getProductDisplayImage, getProductDisplayPrice } from '@/lib/product-utils'
import ProductSort from '@/components/product-sort'
import ViewToggle from '@/components/view-toggle'
import Breadcrumb from '@/components/breadcrumb'
import Header from '@/components/header'
import Footer from '@/components/footer'
import ActiveRatingDisplay from '@/components/active-rating-display'

export default function ProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([])
  const [dealProducts, setDealProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high' | 'rating' | 'newest'>('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [showDeals, setShowDeals] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchDealProducts()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const categories = await response.json()
        setAvailableCategories(categories.map((cat: any) => cat.name))
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchDealProducts = async () => {
    try {
      const response = await fetch('/api/products?flashDeals=true&limit=4')
      if (response.ok) {
        const data = await response.json()
        setDealProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching deal products:', error)
    }
  }

  const fetchProducts = async (loadMore = false) => {
    try {
      loadMore ? setLoadingMore(true) : setLoading(true)
      const currentPage = loadMore ? page : 1
      const response = await fetch(`/api/products?catalog=true&page=${currentPage}&limit=12`)
      if (response.ok) {
        const data = await response.json()
        if (loadMore) {
          setProducts(prev => [...prev, ...data.products])
        } else {
          setProducts(data.products)
        }
        setHasMore(data.products.length === 12)
        loadMore ? setPage(prev => prev + 1) : setPage(2)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => fetchProducts(true)

  const filteredProducts = products.filter(product => {
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !product.category.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) return false
    return true
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const { price: pA } = getProductDisplayPrice(a)
    const { price: pB } = getProductDisplayPrice(b)
    switch (sortBy) {
      case 'price-low':  return pA - pB
      case 'price-high': return pB - pA
      case 'rating':     return b.rating - a.rating
      case 'newest':     return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      default:           return a.name.localeCompare(b.name)
    }
  })

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'All Products', href: '/products' }
  ]

  return (
    <>
      <style>{pageStyles}</style>
      <div className="pp-root">
        <Header />

        {/* ── HERO BANNER ── */}
        <div className="pp-hero">
          <div className="pp-hero-orb left"  aria-hidden="true" />
          <div className="pp-hero-orb right" aria-hidden="true" />
          <div className="pp-hero-inner">
            <div className="pp-hero-eyebrow">
              <span className="pp-hero-eyebrow-line" />
              <span className="pp-hero-eyebrow-text">Javic Collection</span>
              <span className="pp-hero-eyebrow-line" />
            </div>
            <h1 className="pp-hero-title">All Products</h1>
            <div className="pp-hero-divider">
              <span className="pp-hero-div-gem"></span>
              <span className="pp-hero-div-line" />
            </div>
            <p className="pp-hero-sub">
              Discover our complete range of innerwear, sleepwear & intimate apparel
            </p>
          </div>
        </div>

        <main className="pp-main">
          <div className="pp-container">
            <Breadcrumb items={breadcrumbItems} />

            {/* ── HOT DEALS STRIP ── */}
            {dealProducts.length > 0 && (
              <div className="pp-deals-strip">
                <div className="pp-deals-header">
                  <div className="pp-deals-title-row">
                    <span className="pp-deals-flame"></span>
                    <span className="pp-deals-title">Hot Deals</span>
                    <span className="pp-deals-badge">Limited Time</span>
                  </div>
                  <button
                    onClick={() => setShowDeals(!showDeals)}
                    className="pp-deals-toggle"
                  >
                    {showDeals ? 'Hide' : 'Show Deals'}
                    <span className={`pp-deals-toggle-arrow ${showDeals ? 'open' : ''}`}>›</span>
                  </button>
                </div>

                {showDeals && (
                  <div className="pp-deals-grid">
                    {dealProducts.map((product) => {
                      const displayImage = getProductDisplayImage(product)
                      const { price, oldPrice } = getProductDisplayPrice(product)
                      const discount = product.flashDealDiscount || 20
                      return (
                        <Link key={product._id} href={`/product/${product._id}`} className="pp-deal-card">
                          <div className="pp-deal-img-wrap">
                            <img src={displayImage} alt={product.name} className="pp-deal-img" />
                            <span className="pp-deal-badge">-{discount}%</span>
                          </div>
                          <div className="pp-deal-body">
                            <p className="pp-deal-name">{product.name}</p>
                            <div className="pp-deal-price-row">
                              <span className="pp-deal-price">KSH {price.toLocaleString()}</span>
                              {oldPrice && <span className="pp-deal-old">KSH {oldPrice.toLocaleString()}</span>}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── FILTER BAR ── */}
            <div className="pp-filter-bar">
              {/* Search */}
              <div className="pp-search-wrap">
                <Search size={15} className="pp-search-icon" />
                <input
                  type="text"
                  placeholder="Search products…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pp-search-input"
                />
                {searchTerm && (
                  <button className="pp-search-clear" onClick={() => setSearchTerm('')}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Controls row */}
              <div className="pp-controls">
                <div className="pp-cats-wrap">
                  <SlidersHorizontal size={13} className="pp-cats-icon" />
                  <div className="pp-cats">
                    {availableCategories.slice(0, 6).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          if (selectedCategories.includes(cat)) {
                            setSelectedCategories(prev => prev.filter(c => c !== cat))
                          } else {
                            setSelectedCategories(prev => [...prev, cat])
                          }
                        }}
                        className={`pp-cat-chip ${selectedCategories.includes(cat) ? 'active' : ''}`}
                      >
                        {cat}
                      </button>
                    ))}
                    {selectedCategories.length > 0 && (
                      <button onClick={() => setSelectedCategories([])} className="pp-cat-clear">
                        <X size={11} /> Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="pp-right-controls">
                  <ProductSort 
                    currentSort={
                      sortBy === 'name' ? 'name-a-z' :
                      sortBy === 'price-low' ? 'price-low-high' :
                      sortBy === 'price-high' ? 'price-high-low' :
                      sortBy === 'rating' ? 'rating' :
                      sortBy === 'newest' ? 'newest' : 'featured'
                    }
                    onSortChange={(sort) => {
                      if (sort === 'name-a-z') setSortBy('name')
                      else if (sort === 'price-low-high') setSortBy('price-low')
                      else if (sort === 'price-high-low') setSortBy('price-high')
                      else if (sort === 'rating') setSortBy('rating')
                      else if (sort === 'newest') setSortBy('newest')
                      else setSortBy('name')
                    }}
                  />
                  <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
                  <span className="pp-count">{sortedProducts.length} items</span>
                </div>
              </div>
            </div>

            {/* ── PRODUCTS GRID / LIST ── */}
            <div className={viewMode === 'grid' ? 'pp-grid' : 'pp-list'}>
              {loading
                ? Array(12).fill(0).map((_, i) => (
                    <div key={i} className="pp-skeleton">
                      <div className="pp-sk-img" />
                      <div className="pp-sk-body">
                        <div className="pp-sk-line short" />
                        <div className="pp-sk-line wide" />
                        <div className="pp-sk-line mid" />
                        <div className="pp-sk-line price" />
                      </div>
                    </div>
                  ))
                : sortedProducts.map((product, index) => {
                    const displayImage = getProductDisplayImage(product)
                    const { price, oldPrice } = getProductDisplayPrice(product)
                    const hasDiscount = oldPrice && oldPrice > price
                    const isFlashDeal = product.flashDealDiscount && product.flashDealDiscount > 0
                    const discountPct = hasDiscount ? Math.round((1 - price / oldPrice!) * 100) : 0

                    return viewMode === 'grid' ? (
                      /* GRID CARD */
                      <div key={product._id} className="pp-card" style={{ animationDelay: `${(index % 12) * 0.04}s` }}>
                        <Link href={`/product/${product._id}`} className="pp-card-img-link">
                          <div className="pp-card-img-wrap">
                            <img src={displayImage} alt={product.name} className="pp-card-img" />
                            <div className="pp-card-overlay" />
                            {hasDiscount && (
                              <span className="pp-card-badge">
                                {isFlashDeal ? `${product.flashDealDiscount}% OFF` : `-${discountPct}%`}
                              </span>
                            )}
                            <div className="pp-card-corner tl" />
                            <div className="pp-card-corner br" />
                            <div className="pp-card-view">View</div>
                          </div>
                        </Link>
                        <div className="pp-card-body">
                          <span className="pp-card-cat">{product.category}</span>
                          <Link href={`/product/${product._id}`}>
                            <h3 className="pp-card-name">{product.name}</h3>
                          </Link>
                          <div className="pp-card-rating">
                            <ActiveRatingDisplay
                              productId={product._id || ''}
                              initialRating={product.rating}
                              initialReviews={product.reviews}
                              size="sm"
                            />
                          </div>
                          <div className="pp-card-price-row">
                            <span className="pp-card-price">KSH {price.toLocaleString()}</span>
                            {oldPrice && <span className="pp-card-old">KSH {oldPrice.toLocaleString()}</span>}
                          </div>
                        </div>
                        <div className="pp-card-bar" />
                      </div>
                    ) : (
                      /* LIST CARD */
                      <div key={product._id} className="pp-list-card" style={{ animationDelay: `${(index % 12) * 0.04}s` }}>
                        <Link href={`/product/${product._id}`} className="pp-list-img-link">
                          <div className="pp-list-img-wrap">
                            <img src={displayImage} alt={product.name} className="pp-list-img" />
                            {hasDiscount && (
                              <span className="pp-card-badge sm">
                                {isFlashDeal ? `${product.flashDealDiscount}% OFF` : `-${discountPct}%`}
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="pp-list-body">
                          <span className="pp-card-cat">{product.category}</span>
                          <Link href={`/product/${product._id}`}>
                            <h3 className="pp-list-name">{product.name}</h3>
                          </Link>
                          <div className="pp-card-rating">
                            <ActiveRatingDisplay
                              productId={product._id || ''}
                              initialRating={product.rating}
                              initialReviews={product.reviews}
                              size="sm"
                            />
                          </div>
                          {product.description && (
                            <p className="pp-list-desc">{product.description}</p>
                          )}
                          <div className="pp-card-price-row">
                            <span className="pp-card-price">KSH {price.toLocaleString()}</span>
                            {oldPrice && <span className="pp-card-old">KSH {oldPrice.toLocaleString()}</span>}
                          </div>
                        </div>
                        <div className="pp-list-cta">
                          <Link href={`/product/${product._id}`}>
                            <button className="pp-list-btn">
                              <span>View Product</span>
                              <span className="pp-list-btn-arrow">→</span>
                            </button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
            </div>

            {/* ── EMPTY STATE ── */}
            {!loading && sortedProducts.length === 0 && (
              <div className="pp-empty">
                <span className="pp-empty-gem">◆</span>
                <h3 className="pp-empty-title">No products found</h3>
                <p className="pp-empty-sub">Try adjusting your search or filters</p>
                <button
                  className="pp-empty-btn"
                  onClick={() => { setSearchTerm(''); setSelectedCategories([]) }}
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* ── LOAD MORE ── */}
            {hasMore && !loading && sortedProducts.length > 0 && (
              <div className="pp-load-wrap">
                <button onClick={handleLoadMore} disabled={loadingMore} className="pp-load-btn">
                  <span className="pp-load-inner">
                    {loadingMore
                      ? <><span className="pp-spinner" /> Loading…</>
                      : <><span>Load More</span><span className="pp-load-arrow">↓</span></>
                    }
                  </span>
                  <span className="pp-load-shimmer" />
                </button>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}

const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Josefin+Sans:wght@200;300;400&display=swap');

  :root {
    --pp-pink:    #FF0080;
    --pp-magenta: #CC0066;
    --pp-deep:    #990044;
    --pp-gold:    #E8C87A;
    --pp-gold-lt: #F5DFA0;
  }

  .pp-root { display: flex; flex-direction: column; min-height: 100vh; background: #ffffff; }

  /* ── HERO ── */
  .pp-hero {
    position: relative;
    background: linear-gradient(160deg, #1a0010 0%, #2d0020 50%, #1a0010 100%);
    overflow: hidden;
    padding: 56px 24px 52px;
    text-align: center;
  }
  .pp-hero-orb {
    position: absolute;
    width: 400px; height: 400px;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0.14;
  }
  .pp-hero-orb.left  { top: -120px; left: -80px;  background: radial-gradient(circle, var(--pp-pink), transparent 70%); }
  .pp-hero-orb.right { bottom: -100px; right: -80px; background: radial-gradient(circle, var(--pp-magenta), transparent 70%); }
  .pp-hero-inner { position: relative; z-index: 1; }

  .pp-hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .pp-hero-eyebrow-line {
    display: block;
    width: 32px; height: 1px;
    background: var(--pp-gold);
    opacity: 0.7;
  }
  .pp-hero-eyebrow-text {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 10px;
    letter-spacing: 0.38em;
    text-transform: uppercase;
    color: var(--pp-gold);
  }
  .pp-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: clamp(2.4rem, 5vw, 4rem);
    color: white;
    margin: 0 0 14px;
    line-height: 1.05;
  }
  .pp-hero-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 14px;
  }
  .pp-hero-div-line {
    display: block;
    width: 60px; height: 1px;
    background: linear-gradient(90deg, transparent, var(--pp-gold));
  }
  .pp-hero-div-line:last-child {
    background: linear-gradient(270deg, transparent, var(--pp-gold));
  }
  .pp-hero-div-gem { font-size: 9px; color: var(--pp-gold); }
  .pp-hero-sub {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 13px;
    letter-spacing: 0.12em;
    color: rgba(255,255,255,0.6);
  }

  /* ── MAIN ── */
  .pp-main { flex: 1; padding: 32px 0 64px; background: #fdfdfd; }
  .pp-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }

  /* ── DEALS STRIP ── */
  .pp-deals-strip {
    background: linear-gradient(135deg, rgba(255,0,128,0.04), rgba(232,200,122,0.06));
    border: 1px solid rgba(232,200,122,0.25);
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 28px;
  }
  .pp-deals-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0;
  }
  .pp-deals-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pp-deals-flame { font-size: 18px; }
  .pp-deals-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 20px;
    color: #1a0010;
  }
  .pp-deals-badge {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 9px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--pp-magenta);
    background: rgba(204,0,102,0.08);
    border: 1px solid rgba(204,0,102,0.2);
    border-radius: 20px;
    padding: 3px 10px;
  }
  .pp-deals-toggle {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--pp-magenta);
    background: none;
    border: none;
    cursor: pointer;
  }
  .pp-deals-toggle-arrow {
    font-size: 18px;
    font-family: serif;
    line-height: 1;
    display: inline-block;
    transition: transform 0.3s ease;
  }
  .pp-deals-toggle-arrow.open { transform: rotate(90deg); }
  .pp-deals-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-top: 16px;
  }
  @media (min-width: 768px) {
    .pp-deals-grid { grid-template-columns: repeat(4, 1fr); }
  }
  .pp-deal-card {
    background: white;
    border: 1px solid rgba(232,200,122,0.2);
    border-radius: 8px;
    overflow: hidden;
    text-decoration: none;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .pp-deal-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(153,0,68,0.1);
  }
  .pp-deal-img-wrap { position: relative; height: 100px; overflow: hidden; background: #fff0f6; }
  .pp-deal-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
  .pp-deal-card:hover .pp-deal-img { transform: scale(1.05); }
  .pp-deal-badge {
    position: absolute;
    top: 8px; left: 8px;
    background: linear-gradient(135deg, var(--pp-magenta), var(--pp-pink));
    color: white;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 9px;
    letter-spacing: 0.1em;
    padding: 3px 7px;
    border-radius: 2px;
  }
  .pp-deal-body { padding: 10px 12px; }
  .pp-deal-name {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 11.5px;
    color: #333;
    margin: 0 0 6px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .pp-deal-price-row { display: flex; align-items: baseline; gap: 6px; }
  .pp-deal-price {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 15px;
    color: var(--pp-magenta);
  }
  .pp-deal-old {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 10px;
    color: #ccc;
    text-decoration: line-through;
  }

  /* ── FILTER BAR ── */
  .pp-filter-bar {
    background: white;
    border: 1px solid rgba(232,200,122,0.2);
    border-radius: 12px;
    padding: 18px 20px;
    margin-bottom: 28px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }

  /* Search */
  .pp-search-wrap {
    position: relative;
    display: flex;
    align-items: center;
    background: #f8f8f8;
    border: 1px solid rgba(232,200,122,0.3);
    border-radius: 4px;
    padding: 10px 16px;
    max-width: 400px;
    transition: all 0.3s ease;
  }
  .pp-search-wrap:focus-within {
    border-color: var(--pp-magenta);
    background: white;
    box-shadow: 0 0 0 3px rgba(204,0,102,0.07);
  }
  .pp-search-icon { color: #bbb; flex-shrink: 0; }
  .pp-search-wrap:focus-within .pp-search-icon { color: var(--pp-magenta); }
  .pp-search-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 13px;
    letter-spacing: 0.04em;
    color: #333;
    margin: 0 8px;
  }
  .pp-search-input::placeholder { color: #bbb; }
  .pp-search-clear {
    background: none;
    border: none;
    color: #bbb;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0;
    transition: color 0.2s;
  }
  .pp-search-clear:hover { color: var(--pp-magenta); }

  /* Controls row */
  .pp-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: space-between;
  }
  .pp-cats-wrap { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .pp-cats-icon { color: var(--pp-gold); flex-shrink: 0; }
  .pp-cats { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .pp-cat-chip {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 10.5px;
    letter-spacing: 0.12em;
    padding: 5px 12px;
    border-radius: 2px;
    border: 1px solid rgba(232,200,122,0.3);
    background: white;
    color: #666;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .pp-cat-chip:hover { border-color: var(--pp-magenta); color: var(--pp-magenta); }
  .pp-cat-chip.active {
    background: linear-gradient(135deg, var(--pp-magenta), var(--pp-pink));
    color: white;
    border-color: transparent;
  }
  .pp-cat-clear {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 10px;
    letter-spacing: 0.1em;
    color: #999;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.2s;
  }
  .pp-cat-clear:hover { color: var(--pp-magenta); }
  .pp-right-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .pp-count {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 11px;
    letter-spacing: 0.1em;
    color: #aaa;
  }

  /* ── GRID ── */
  .pp-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
  }
  @media (min-width: 768px)  { .pp-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 1024px) { .pp-grid { grid-template-columns: repeat(4, 1fr); } }

  /* ── GRID CARD ── */
  .pp-card {
    background: white;
    border: 1px solid rgba(232,200,122,0.18);
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s ease, border-color 0.3s;
    animation: ppFadeUp 0.45s ease backwards;
    position: relative;
  }
  @keyframes ppFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .pp-card:hover {
    transform: translateY(-5px);
    border-color: rgba(232,200,122,0.5);
    box-shadow: 0 12px 40px rgba(153,0,68,0.1), 0 4px 10px rgba(0,0,0,0.05);
  }
  .pp-card-img-link { display: block; text-decoration: none; }
  .pp-card-img-wrap {
    position: relative;
    height: 200px;
    overflow: hidden;
    background: linear-gradient(135deg, #fff0f6, #fce4f0);
  }
  .pp-card-img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
  }
  .pp-card:hover .pp-card-img { transform: scale(1.07); }
  .pp-card-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 55%, rgba(26,0,16,0.12) 100%);
    opacity: 0;
    transition: opacity 0.35s ease;
  }
  .pp-card:hover .pp-card-overlay { opacity: 1; }
  .pp-card-badge {
    position: absolute;
    top: 10px; left: 10px;
    background: linear-gradient(135deg, var(--pp-magenta), var(--pp-pink));
    color: white;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 9.5px;
    letter-spacing: 0.1em;
    padding: 4px 8px;
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(255,0,128,0.3);
  }
  .pp-card-badge.sm { font-size: 9px; padding: 3px 7px; }
  .pp-card-corner {
    position: absolute;
    width: 12px; height: 12px;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  .pp-card:hover .pp-card-corner { opacity: 1; }
  .pp-card-corner.tl { top: 8px; right: 8px; border-top: 1.5px solid var(--pp-gold); border-right: 1.5px solid var(--pp-gold); }
  .pp-card-corner.br { bottom: 8px; left: 8px; border-bottom: 1.5px solid var(--pp-gold); border-left: 1.5px solid var(--pp-gold); }
  .pp-card-view {
    position: absolute;
    bottom: 10px; left: 50%;
    transform: translateX(-50%) translateY(6px);
    background: rgba(255,255,255,0.93);
    border: 1px solid rgba(232,200,122,0.4);
    color: var(--pp-magenta);
    font-family: 'Josefin Sans', sans-serif;
    font-size: 9px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 2px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s, transform 0.3s;
  }
  .pp-card:hover .pp-card-view { opacity: 1; transform: translateX(-50%) translateY(0); }
  .pp-card-body { padding: 12px 14px 14px; flex: 1; display: flex; flex-direction: column; }
  .pp-card-cat {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 9px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #bbb;
    margin-bottom: 5px;
    display: block;
  }
  .pp-card-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 600;
    font-size: 15px;
    color: #1a0010;
    line-height: 1.3;
    margin: 0 0 7px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-decoration: none;
    transition: color 0.2s;
    cursor: pointer;
  }
  .pp-card-name:hover { color: var(--pp-magenta); }
  .pp-card-rating { margin-bottom: 8px; }
  .pp-card-price-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-top: auto;
    flex-wrap: wrap;
  }
  .pp-card-price {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 18px;
    color: var(--pp-magenta);
    line-height: 1;
  }
  .pp-card-old {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 11px;
    text-decoration: line-through;
    color: #ccc;
  }
  .pp-card-bar {
    height: 2px;
    background: linear-gradient(90deg, var(--pp-gold), var(--pp-pink));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
    flex-shrink: 0;
  }
  .pp-card:hover .pp-card-bar { transform: scaleX(1); }

  /* ── LIST LAYOUT ── */
  .pp-list { display: flex; flex-direction: column; gap: 14px; }
  .pp-list-card {
    background: white;
    border: 1px solid rgba(232,200,122,0.18);
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    align-items: stretch;
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s;
    animation: ppFadeUp 0.45s ease backwards;
    position: relative;
  }
  .pp-list-card:hover {
    transform: translateX(4px);
    border-color: rgba(232,200,122,0.5);
    box-shadow: 0 6px 24px rgba(153,0,68,0.08);
  }
  .pp-list-img-link { display: block; text-decoration: none; flex-shrink: 0; }
  .pp-list-img-wrap {
    position: relative;
    width: 140px; height: 140px;
    overflow: hidden;
    background: linear-gradient(135deg, #fff0f6, #fce4f0);
  }
  @media (min-width: 768px) {
    .pp-list-img-wrap { width: 180px; height: 160px; }
  }
  .pp-list-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
  .pp-list-card:hover .pp-list-img { transform: scale(1.05); }
  .pp-list-body {
    flex: 1;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .pp-list-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 600;
    font-size: 18px;
    color: #1a0010;
    margin: 0;
    cursor: pointer;
    text-decoration: none;
    line-height: 1.25;
    transition: color 0.2s;
  }
  .pp-list-name:hover { color: var(--pp-magenta); }
  .pp-list-desc {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 12px;
    color: #888;
    line-height: 1.6;
    letter-spacing: 0.03em;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .pp-list-cta {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    flex-shrink: 0;
  }
  @media (max-width: 640px) { .pp-list-cta { display: none; } }
  .pp-list-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: none;
    border: 1px solid rgba(232,200,122,0.4);
    border-radius: 2px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 10.5px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--pp-magenta);
    cursor: pointer;
    transition: all 0.25s ease;
    text-decoration: none;
    white-space: nowrap;
  }
  .pp-list-btn:hover {
    background: linear-gradient(135deg, var(--pp-magenta), var(--pp-pink));
    color: white;
    border-color: transparent;
    box-shadow: 0 4px 14px rgba(255,0,128,0.25);
  }
  .pp-list-btn-arrow {
    color: var(--pp-gold);
    font-size: 14px;
    transition: transform 0.2s;
  }
  .pp-list-btn:hover .pp-list-btn-arrow { transform: translateX(3px); color: white; }

  /* ── SKELETON ── */
  .pp-skeleton { border-radius: 10px; border: 1px solid rgba(232,200,122,0.12); overflow: hidden; background: white; }
  .pp-sk-img { height: 200px; background: linear-gradient(135deg, #ffe6f0, #fff0f6); animation: ppShimmer 1.4s ease-in-out infinite; }
  .pp-sk-body { padding: 12px 14px; }
  .pp-sk-line { height: 10px; border-radius: 5px; background: rgba(204,0,102,0.07); margin-bottom: 8px; animation: ppShimmer 1.4s ease-in-out infinite; width: 50%; }
  .pp-sk-line.short { width: 35%; }
  .pp-sk-line.wide  { width: 85%; height: 13px; }
  .pp-sk-line.mid   { width: 55%; }
  .pp-sk-line.price { width: 44%; height: 15px; }
  @keyframes ppShimmer { 0%,100%{opacity:0.45} 50%{opacity:1} }

  /* ── EMPTY ── */
  .pp-empty {
    text-align: center;
    padding: 80px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .pp-empty-gem { font-size: 28px; color: var(--pp-gold); opacity: 0.4; }
  .pp-empty-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 600;
    font-size: 24px;
    color: #1a0010;
    margin: 0;
  }
  .pp-empty-sub {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 13px;
    letter-spacing: 0.08em;
    color: #aaa;
    margin: 0;
  }
  .pp-empty-btn {
    margin-top: 8px;
    padding: 12px 32px;
    border: 1px solid rgba(232,200,122,0.4);
    background: none;
    border-radius: 2px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 11px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--pp-magenta);
    cursor: pointer;
    transition: all 0.25s ease;
  }
  .pp-empty-btn:hover { background: var(--pp-magenta); color: white; border-color: var(--pp-magenta); }

  /* ── LOAD MORE ── */
  .pp-load-wrap { text-align: center; margin-top: 48px; }
  .pp-load-btn {
    position: relative;
    overflow: hidden;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }
  .pp-load-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .pp-load-inner {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 52px;
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
    color: var(--pp-magenta);
  }
  .pp-load-btn:not(:disabled):hover .pp-load-inner {
    background: linear-gradient(135deg, var(--pp-magenta), var(--pp-pink));
    border-color: var(--pp-gold);
    color: white;
    box-shadow: 0 0 28px rgba(255,0,128,0.25), 0 6px 20px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }
  .pp-load-arrow {
    font-size: 16px;
    transition: transform 0.3s ease;
  }
  .pp-load-btn:not(:disabled):hover .pp-load-arrow { transform: translateY(3px); }
  .pp-load-shimmer {
    position: absolute;
    top: 0; left: -100%;
    width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: skewX(-20deg);
    transition: left 0.55s ease;
  }
  .pp-load-btn:not(:disabled):hover .pp-load-shimmer { left: 150%; }
  .pp-spinner {
    display: inline-block;
    width: 13px; height: 13px;
    border: 2px solid rgba(204,0,102,0.2);
    border-top-color: var(--pp-magenta);
    border-radius: 50%;
    animation: ppSpin 0.7s linear infinite;
  }
  @keyframes ppSpin { to { transform: rotate(360deg); } }
`