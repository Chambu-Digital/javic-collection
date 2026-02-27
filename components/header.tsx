'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, User, Search, Menu, X, ChevronDown, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ICategory } from '@/models/Category'
import { getProductDisplayImage, getProductDisplayPrice } from '@/lib/product-utils'
import { useCartStore } from '@/lib/cart-store'
import { useUserStore } from '@/lib/user-store'
import CartSidebar from '@/components/cart-sidebar'

export default function Header() {
  const { getTotalItems, isLoaded } = useCartStore()
  const { user, checkAuth, isLoaded: userLoaded } = useUserStore()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [categories, setCategories] = useState<ICategory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    fetchCategories()
    if (!userLoaded) {
      checkAuth()
    }
  }, [checkAuth, userLoaded])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSearchResults(false)
      setIsSearchOpen(false)
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const handleSearchChange = async (value: string) => {
    setSearchQuery(value)
    if (value.trim().length < 2) {
      setShowSearchResults(false)
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(value.trim())}&catalog=true&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.products || [])
        setShowSearchResults(true)
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const selectSearchResult = (product: any) => {
    setShowSearchResults(false)
    setSearchQuery('')
    setIsSearchOpen(false)
    window.location.href = `/product/${product._id}`
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <>
      <style>{headerStyles}</style>
      <header className={`javic-header ${scrolled ? 'scrolled' : ''}`}>

        {/* Top announcement bar */}
        {/* <div className="javic-topbar">
          <div className="javic-topbar-inner">
            <span className="javic-topbar-ornament">✦</span>
            <span className="javic-topbar-text">Free delivery on orders above KSH 2,000</span>
            <span className="javic-topbar-ornament">✦</span>
            <a href="tel:+254706512984" className="javic-topbar-phone">
              <Phone size={13} />
              <span>+254 706 512 984</span>
            </a>
            <span className="javic-topbar-ornament">✦</span>
            <span className="javic-topbar-text">Comfort Meets Style</span>
            <span className="javic-topbar-ornament">✦</span>
          </div>
        </div> */}

        {/* Main header */}
        <div className="javic-header-main">
          <div className="javic-header-inner">

            {/* Logo */}
            <Link href="/" className="javic-logo-link">
              <div className="javic-logo-ring">
                <img
                  src="/javic-logo1.png"
                  alt="Javic Collection"
                  className="javic-logo-img"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement
                    t.src = "/javiclogo.png"
                  }}
                />
              </div>
              <div className="javic-logo-text">
                <span className="javic-logo-name">JAVIC</span>
                <span className="javic-logo-sub">COLLECTION</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="javic-nav">
              <Link href="/" className="javic-nav-link">Home</Link>
              <Link href="/products" className="javic-nav-link">Products</Link>

              <div
                className="javic-nav-dropdown"
                onMouseEnter={() => setShowCategories(true)}
                onMouseLeave={() => setShowCategories(false)}
              >
                <button className="javic-nav-link javic-nav-btn-cat">
                  Categories
                  <ChevronDown size={14} className={`javic-chevron ${showCategories ? 'open' : ''}`} />
                </button>
                {showCategories && (
                  <div className="javic-dropdown-menu">
                    <div className="javic-dropdown-header">
                      <span className="javic-dropdown-header-line" />
                      <span className="javic-dropdown-header-text">Browse</span>
                      <span className="javic-dropdown-header-line" />
                    </div>
                    {categories.map((category) => (
                      <Link
                        key={category._id}
                        href={`/category/${category.slug}`}
                        className="javic-dropdown-item"
                      >
                        <span className="javic-dropdown-dot">◆</span>
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Desktop Search */}
            <div className="javic-search-wrap">
              <form onSubmit={handleSearch} className="javic-search-form">
                <Search size={15} className="javic-search-icon" />
                <input
                  type="text"
                  placeholder="Search innerwear, sleepwear…"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  className="javic-search-input"
                />
                {searchLoading && <div className="javic-search-spinner" />}
              </form>

              {showSearchResults && searchResults.length > 0 && (
                <div className="javic-search-results">
                  {searchResults.map((product) => {
                    const displayImage = getProductDisplayImage(product)
                    const { price } = getProductDisplayPrice(product)
                    return (
                      <div
                        key={product._id}
                        onClick={() => selectSearchResult(product)}
                        className="javic-result-item"
                      >
                        <img src={displayImage} alt={product.name} className="javic-result-img" />
                        <div className="javic-result-info">
                          <p className="javic-result-name">{product.name}</p>
                          <p className="javic-result-cat">{product.category}</p>
                        </div>
                        <p className="javic-result-price">KSH {price.toLocaleString()}</p>
                      </div>
                    )
                  })}
                  {searchQuery.trim() && (
                    <button
                      onClick={() => handleSearch({ preventDefault: () => {} } as any)}
                      className="javic-result-viewall"
                    >
                      View all results for "{searchQuery}" →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right actions */}
            <div className="javic-actions">
              {/* Mobile search toggle */}
              <button
                className="javic-icon-btn md-hide"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              {/* Account */}
              <div className="javic-icon-wrap sm-hide">
                {user ? (
                  <Link href="/account">
                    <button className="javic-icon-btn">
                      <User size={18} />
                      <span className="javic-user-dot" />
                    </button>
                  </Link>
                ) : (
                  <Link href="/account/login">
                    <button className="javic-icon-btn">
                      <User size={18} />
                    </button>
                  </Link>
                )}
              </div>

              {/* Cart */}
              <CartSidebar>
                <button className="javic-icon-btn javic-cart-btn" aria-label="Cart">
                  <ShoppingCart size={18} />
                  {isLoaded && getTotalItems() > 0 && (
                    <span className="javic-cart-badge">{getTotalItems()}</span>
                  )}
                </button>
              </CartSidebar>

              {/* Divider */}
              <span className="javic-action-divider lg-hide" />

              {/* Mobile menu toggle */}
              <button
                className="javic-icon-btn javic-menu-btn lg-hide"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          {isSearchOpen && (
            <div className="javic-mobile-search">
              <form onSubmit={handleSearch} className="javic-search-form">
                <Search size={15} className="javic-search-icon" />
                <input
                  type="text"
                  placeholder="Search innerwear, sleepwear…"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  className="javic-search-input"
                  autoFocus
                />
                {searchLoading && <div className="javic-search-spinner" />}
              </form>

              {showSearchResults && searchResults.length > 0 && (
                <div className="javic-search-results">
                  {searchResults.map((product) => {
                    const displayImage = getProductDisplayImage(product)
                    const { price } = getProductDisplayPrice(product)
                    return (
                      <div
                        key={product._id}
                        onClick={() => selectSearchResult(product)}
                        className="javic-result-item"
                      >
                        <img src={displayImage} alt={product.name} className="javic-result-img" />
                        <div className="javic-result-info">
                          <p className="javic-result-name">{product.name}</p>
                          <p className="javic-result-cat">{product.category}</p>
                        </div>
                        <p className="javic-result-price">KSH {price.toLocaleString()}</p>
                      </div>
                    )
                  })}
                  {searchQuery.trim() && (
                    <button
                      onClick={() => handleSearch({ preventDefault: () => {} } as any)}
                      className="javic-result-viewall"
                    >
                      View all results for "{searchQuery}" →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="javic-mobile-menu">
              <div className="javic-mobile-menu-inner">
                {/* Account */}
                <div className="javic-mobile-account">
                  {user ? (
                    <Link href="/account" onClick={closeMobileMenu} className="javic-mobile-account-link">
                      <div className="javic-mobile-avatar"><User size={16} /></div>
                      <span>My Account</span>
                    </Link>
                  ) : (
                    <Link href="/account/login" onClick={closeMobileMenu} className="javic-mobile-account-link">
                      <div className="javic-mobile-avatar"><User size={16} /></div>
                      <span>Sign In</span>
                    </Link>
                  )}
                </div>

                <div className="javic-mobile-divider"><span>✦</span></div>

                <Link href="/" onClick={closeMobileMenu} className="javic-mobile-link">Home</Link>
                <Link href="/products" onClick={closeMobileMenu} className="javic-mobile-link">Products</Link>
                <Link href="/blog" onClick={closeMobileMenu} className="javic-mobile-link">Blog</Link>

                {categories.length > 0 && (
                  <>
                    <div className="javic-mobile-divider"><span>Categories</span></div>
                    {categories.map((category) => (
                      <Link
                        key={category._id}
                        href={`/category/${category.slug}`}
                        onClick={closeMobileMenu}
                        className="javic-mobile-link sub"
                      >
                        <span className="javic-mobile-link-dot">◆</span>
                        {category.name}
                      </Link>
                    ))}
                  </>
                )}

                <div className="javic-mobile-footer">
                  <a href="tel:+254706512984" className="javic-mobile-phone">
                    <Phone size={14} />
                    +254 706 512 984
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom gold border accent */}
        <div className="javic-header-border" />
      </header>
    </>
  )
}

const headerStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Josefin+Sans:wght@200;300;400&display=swap');

  :root {
    --jh-pink: #FF0080;
    --jh-magenta: #CC0066;
    --jh-deep: #990044;
    --jh-gold: #E8C87A;
    --jh-gold-light: #F5DFA0;
    --jh-white: #FFFFFF;
    --jh-bg: rgba(255, 255, 255, 0.97);
  }

  /* ── HEADER SHELL ── */
  .javic-header {
    position: sticky;
    top: 0;
    z-index: 50;
    background: var(--jh-bg);
    backdrop-filter: blur(12px);
    transition: box-shadow 0.4s ease;
  }
  .javic-header.scrolled {
    box-shadow:
      0 1px 0 rgba(232, 200, 122, 0.25),
      0 4px 24px rgba(204, 0, 102, 0.12),
      0 8px 40px rgba(0, 0, 0, 0.08);
  }

  /* ── TOP BAR ── */
  .javic-topbar {
    background: linear-gradient(90deg, var(--jh-deep) 0%, var(--jh-magenta) 50%, var(--jh-deep) 100%);
    overflow: hidden;
  }
  .javic-topbar-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 7px 16px;
    white-space: nowrap;
  }
  .javic-topbar-text {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 10.5px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.85);
  }
  .javic-topbar-ornament {
    color: var(--jh-gold);
    font-size: 9px;
    opacity: 0.8;
  }
  .javic-topbar-phone {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 10.5px;
    letter-spacing: 0.1em;
    color: var(--jh-gold-light);
    text-decoration: none;
    transition: color 0.2s;
  }
  .javic-topbar-phone:hover { color: var(--jh-white); }

  /* ── MAIN HEADER ── */
  .javic-header-main {
    position: relative;
  }
  .javic-header-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    height: 68px;
    display: flex;
    align-items: center;
    gap: 32px;
  }
  @media (min-width: 1024px) {
    .javic-header-inner { height: 76px; }
  }

  /* ── LOGO ── */
  .javic-logo-link {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
    text-decoration: none;
  }
  .javic-logo-ring {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--jh-pink), var(--jh-deep));
    padding: 2px;
    box-shadow: 0 0 0 1px rgba(232, 200, 122, 0.3), 0 4px 12px rgba(204, 0, 102, 0.25);
    transition: box-shadow 0.3s ease, transform 0.3s ease;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .javic-logo-link:hover .javic-logo-ring {
    box-shadow: 0 0 0 1px rgba(232, 200, 122, 0.7), 0 6px 20px rgba(255, 0, 128, 0.4);
    transform: scale(1.04);
  }
  .javic-logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 3px;
  }
  .javic-logo-text {
    display: flex;
    flex-direction: column;
    line-height: 1;
  }
  .javic-logo-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 26px;
    letter-spacing: 0.18em;
    background: linear-gradient(135deg, var(--jh-magenta), var(--jh-pink));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .javic-logo-sub {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 10px;
    letter-spacing: 0.35em;
    color: #1A0010;
    text-transform: uppercase;
    margin-top: 2px;
  }

  /* ── DESKTOP NAV ── */
  .javic-nav {
    display: none;
    align-items: center;
    gap: 4px;
  }
  @media (min-width: 1024px) {
    .javic-nav { display: flex; }
  }
  .javic-nav-link {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #1A0010;
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 2px;
    transition: color 0.25s ease, background 0.25s ease;
    position: relative;
    white-space: nowrap;
    background: none;
    border: none;
    cursor: pointer;
  }
  .javic-nav-link::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 50%;
    width: 0;
    height: 1px;
    background: var(--jh-gold);
    transition: width 0.3s ease, left 0.3s ease;
  }
  .javic-nav-link:hover::after {
    width: 60%;
    left: 20%;
  }
  .javic-nav-link:hover { color: var(--jh-magenta); }
  .javic-nav-btn-cat {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .javic-chevron {
    transition: transform 0.3s ease;
    color: var(--jh-gold);
  }
  .javic-chevron.open { transform: rotate(180deg); }

  /* ── DROPDOWN ── */
  .javic-nav-dropdown { position: relative; }
  .javic-dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    min-width: 220px;
    background: white;
    border: 1px solid rgba(232, 200, 122, 0.3);
    border-top: 2px solid var(--jh-magenta);
    border-radius: 0 0 12px 12px;
    box-shadow: 0 20px 50px rgba(153, 0, 68, 0.15), 0 4px 12px rgba(0,0,0,0.08);
    padding: 12px 0;
    animation: javicDropIn 0.2s ease forwards;
  }
  @keyframes javicDropIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .javic-dropdown-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px 10px;
  }
  .javic-dropdown-header-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(232,200,122,0.5));
  }
  .javic-dropdown-header-line:first-child {
    background: linear-gradient(270deg, transparent, rgba(232,200,122,0.5));
  }
  .javic-dropdown-header-text {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 9px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #aaa;
  }
  .javic-dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.08em;
    color: #1A0010;
    text-decoration: none;
    transition: all 0.2s ease;
    border-left: 2px solid transparent;
  }
  .javic-dropdown-item:hover {
    color: var(--jh-magenta);
    background: linear-gradient(90deg, rgba(255,0,128,0.04), transparent);
    border-left-color: var(--jh-gold);
    padding-left: 24px;
  }
  .javic-dropdown-dot {
    font-size: 7px;
    color: var(--jh-gold);
    opacity: 0.6;
    flex-shrink: 0;
  }

  /* ── SEARCH ── */
  .javic-search-wrap {
    display: none;
    flex: 1;
    max-width: 360px;
    position: relative;
  }
  @media (min-width: 768px) {
    .javic-search-wrap { display: block; }
  }
  .javic-search-form {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f7f7f7;
    border: 1px solid rgba(232, 200, 122, 0.3);
    border-radius: 3px;
    padding: 9px 16px;
    transition: all 0.3s ease;
  }
  .javic-search-form:focus-within {
    border-color: var(--jh-magenta);
    background: white;
    box-shadow: 0 0 0 3px rgba(204, 0, 102, 0.08);
  }
  .javic-search-icon { color: #aaa; flex-shrink: 0; }
  .javic-search-form:focus-within .javic-search-icon { color: var(--jh-magenta); }
  .javic-search-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.03em;
    color: #1A0010;
  }
  .javic-search-input::placeholder { color: #888; }
  .javic-search-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(204,0,102,0.2);
    border-top-color: var(--jh-magenta);
    border-radius: 50%;
    animation: javicSpin 0.7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes javicSpin { to { transform: rotate(360deg); } }

  /* ── SEARCH RESULTS ── */
  .javic-search-results {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background: white;
    border: 1px solid rgba(232, 200, 122, 0.3);
    border-top: 2px solid var(--jh-magenta);
    border-radius: 0 0 12px 12px;
    box-shadow: 0 20px 50px rgba(153,0,68,0.12);
    max-height: 360px;
    overflow-y: auto;
    z-index: 60;
    animation: javicDropIn 0.2s ease forwards;
  }
  .javic-result-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background 0.2s ease;
    border-bottom: 1px solid rgba(0,0,0,0.04);
  }
  .javic-result-item:hover { background: rgba(255,0,128,0.03); }
  .javic-result-img {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid rgba(232,200,122,0.3);
    flex-shrink: 0;
  }
  .javic-result-info { flex: 1; min-width: 0; }
  .javic-result-name {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 500;
    font-size: 14px;
    color: #1A0010;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
  }
  .javic-result-cat {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 12px;
    color: #666;
    letter-spacing: 0.05em;
    margin: 0;
  }
  .javic-result-price {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 600;
    font-size: 14px;
    color: var(--jh-magenta);
    flex-shrink: 0;
    margin: 0;
  }
  .javic-result-viewall {
    display: block;
    width: 100%;
    padding: 12px 16px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 11.5px;
    letter-spacing: 0.1em;
    color: var(--jh-magenta);
    background: none;
    border: none;
    border-top: 1px solid rgba(232,200,122,0.25);
    cursor: pointer;
    text-align: left;
    transition: background 0.2s;
  }
  .javic-result-viewall:hover { background: rgba(255,0,128,0.04); }

  /* ── RIGHT ACTIONS ── */
  .javic-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }
  .javic-icon-btn {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: none;
    border: 1px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #555;
    transition: all 0.25s ease;
  }
  .javic-icon-btn:hover {
    color: var(--jh-magenta);
    border-color: rgba(232,200,122,0.35);
    background: rgba(255,0,128,0.05);
  }
  .javic-user-dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--jh-magenta);
    border: 1.5px solid white;
  }
  .javic-cart-btn { }
  .javic-cart-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9px;
    background: var(--jh-magenta);
    color: white;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(204,0,102,0.4);
    border: 1.5px solid white;
  }
  .javic-action-divider {
    display: block;
    width: 1px;
    height: 20px;
    background: rgba(232,200,122,0.3);
    margin: 0 4px;
  }
  .javic-icon-wrap { }

  /* Responsive visibility */
  @media (min-width: 640px) { .sm-hide { display: flex; } }
  .sm-hide { display: none; }
  @media (min-width: 768px) { .md-hide { display: none !important; } }
  @media (min-width: 1024px) { .lg-hide { display: none !important; } }

  /* ── BOTTOM BORDER ACCENT ── */
  .javic-header-border {
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(232,200,122,0.2) 15%,
      var(--jh-magenta) 40%,
      var(--jh-pink) 50%,
      var(--jh-magenta) 60%,
      rgba(232,200,122,0.2) 85%,
      transparent 100%
    );
  }

  /* ── MOBILE SEARCH ── */
  .javic-mobile-search {
    border-top: 1px solid rgba(232,200,122,0.2);
    padding: 12px 24px;
    position: relative;
  }

  /* ── MOBILE MENU ── */
  .javic-mobile-menu {
    border-top: 1px solid rgba(232,200,122,0.2);
    background: white;
    animation: javicSlideDown 0.25s ease forwards;
  }
  @keyframes javicSlideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .javic-mobile-menu-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 16px 24px 24px;
  }
  .javic-mobile-account {
    margin-bottom: 8px;
  }
  .javic-mobile-account-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    text-decoration: none;
    color: #1A0010;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 15px;
    letter-spacing: 0.08em;
    border-radius: 4px;
    transition: background 0.2s;
  }
  .javic-mobile-account-link:hover { background: rgba(255,0,128,0.04); }
  .javic-mobile-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--jh-pink), var(--jh-deep));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }
  .javic-mobile-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0 8px;
    font-family: 'Josefin Sans', sans-serif;
    font-size: 9.5px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #bbb;
  }
  .javic-mobile-divider::before,
  .javic-mobile-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(232,200,122,0.25);
  }
  .javic-mobile-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 15px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #1A0010;
    text-decoration: none;
    border-left: 2px solid transparent;
    transition: all 0.2s ease;
  }
  .javic-mobile-link:hover {
    color: var(--jh-magenta);
    border-left-color: var(--jh-gold);
    padding-left: 22px;
    background: rgba(255,0,128,0.03);
  }
  .javic-mobile-link.sub {
    font-size: 14px;
    letter-spacing: 0.08em;
    text-transform: none;
    color: #1A0010;
  }
  .javic-mobile-link-dot {
    font-size: 7px;
    color: var(--jh-gold);
    opacity: 0.6;
  }
  .javic-mobile-footer {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid rgba(232,200,122,0.2);
  }
  .javic-mobile-phone {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.08em;
    color: var(--jh-magenta);
    text-decoration: none;
  }
`