'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import Link from 'next/link'
import { ICategory } from '@/models/Category'
import Breadcrumb from '@/components/breadcrumb'
import Header from '@/components/header'
import Footer from '@/components/footer'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCategories()
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
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' }
  ]

  return (
    <>
      <style>{catPageStyles}</style>
      <div className="catpg-root">
        <Header />

        {/* ── HERO ── */}
        <div className="catpg-hero">
          <div className="catpg-hero-orb left"  aria-hidden="true" />
          <div className="catpg-hero-orb right" aria-hidden="true" />
          <div className="catpg-hero-inner">
            <div className="catpg-eyebrow">
              <span className="catpg-eyebrow-line" />
              <span className="catpg-eyebrow-text">Javic Collection</span>
              <span className="catpg-eyebrow-line" />
            </div>
            <h1 className="catpg-hero-title">All Categories</h1>
            <div className="catpg-divider">
              <span className="catpg-div-gem"></span>
              <span className="catpg-div-line" />
            </div>
            <p className="catpg-hero-sub">Browse our complete range of fashion categories</p>
          </div>
        </div>

        <main className="catpg-main">
          <div className="catpg-container">
            <Breadcrumb items={breadcrumbItems} />

            {/* ── SEARCH ── */}
            <div className="catpg-search-wrap">
              <div className="catpg-search-box">
                <Search size={15} className="catpg-search-icon" />
                <input
                  type="text"
                  placeholder="Search categories…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="catpg-search-input"
                />
                {searchTerm && (
                  <button className="catpg-search-clear" onClick={() => setSearchTerm('')}>
                    <X size={14} />
                  </button>
                )}
              </div>
              {!loading && (
                <span className="catpg-count">
                  {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
                </span>
              )}
            </div>

            {/* ── GRID ── */}
            <div className="catpg-grid">
              {loading
                ? Array(6).fill(0).map((_, i) => (
                    <div key={i} className="catpg-skeleton">
                      <div className="catpg-sk-img" />
                      <div className="catpg-sk-body">
                        <div className="catpg-sk-line wide" />
                        <div className="catpg-sk-line" />
                        <div className="catpg-sk-line short" />
                      </div>
                    </div>
                  ))
                : filteredCategories.map((category, index) => (
                    <Link
                      key={category._id}
                      href={`/category/${category.slug}`}
                      className="catpg-card"
                      style={{ animationDelay: `${index * 0.07}s` }}
                    >
                      {/* Image */}
                      <div className="catpg-card-img-wrap">
                        <img
                          src={category.image || '/placeholder.svg'}
                          alt={category.name}
                          className="catpg-card-img"
                        />
                        <div className="catpg-card-overlay" />

                        {/* Gold corners */}
                        <div className="catpg-corner tl" />
                        <div className="catpg-corner br" />

                        {/* Hover label */}
                        <div className="catpg-hover-label">
                          <span>Browse</span>
                          <span className="catpg-hover-arrow">→</span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="catpg-card-body">
                        <h3 className="catpg-card-name">{category.name}</h3>
                        <p className="catpg-card-desc">{category.description}</p>
                        <div className="catpg-card-cta">
                          <span className="catpg-cta-text">Browse Products</span>
                          <span className="catpg-cta-arrow"></span>
                        </div>
                      </div>

                      <div className="catpg-card-bar" />
                    </Link>
                  ))
              }
            </div>

            {/* ── EMPTY STATE ── */}
            {!loading && filteredCategories.length === 0 && (
              <div className="catpg-empty">
                <span className="catpg-empty-gem">◆</span>
                <h3 className="catpg-empty-title">
                  {searchTerm ? 'No categories found' : 'No categories available'}
                </h3>
                <p className="catpg-empty-sub">
                  {searchTerm ? `No results for "${searchTerm}"` : 'Check back soon'}
                </p>
                {searchTerm && (
                  <button className="catpg-empty-btn" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </button>
                )}
              </div>
            )}

            {/* ── FOOTER CTA ── */}
            {!loading && filteredCategories.length > 0 && (
              <div className="catpg-footer-cta">
                <Link href="/products">
                  <button className="catpg-cta-btn">
                    <span className="catpg-cta-inner">
                      <span>View All Products</span>
                      <span className="catpg-cta-btn-arrow"></span>
                    </span>
                    <span className="catpg-cta-shimmer" />
                  </button>
                </Link>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}

const catPageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Josefin+Sans:wght@200;300;400&display=swap');

  :root {
    --catpg-pink:    #FF0080;
    --catpg-magenta: #CC0066;
    --catpg-deep:    #990044;
    --catpg-gold:    #E8C87A;
    --catpg-gold-lt: #F5DFA0;
  }

  .catpg-root { display: flex; flex-direction: column; min-height: 100vh; background: #fff; }

  /* ── HERO ── */
  .catpg-hero {
    position: relative;
    background: linear-gradient(160deg, #1a0010 0%, #2d0020 50%, #1a0010 100%);
    padding: 64px 24px 56px;
    text-align: center;
    overflow: hidden;
  }
  .catpg-hero-orb {
    position: absolute; width: 360px; height: 360px;
    border-radius: 50%; pointer-events: none; opacity: 0.13;
  }
  .catpg-hero-orb.left  { top: -100px; left: -80px;  background: radial-gradient(circle, var(--catpg-pink),    transparent 70%); }
  .catpg-hero-orb.right { bottom: -80px; right: -80px; background: radial-gradient(circle, var(--catpg-magenta), transparent 70%); }
  .catpg-hero-inner { position: relative; z-index: 1; }

  .catpg-eyebrow {
    display: inline-flex; align-items: center; gap: 10px; margin-bottom: 12px;
  }
  .catpg-eyebrow-line { display: block; width: 28px; height: 1px; background: var(--catpg-gold); opacity: 0.7; }
  .catpg-eyebrow-text {
    font-family: 'Josefin Sans', sans-serif; font-weight: 300;
    font-size: 10px; letter-spacing: 0.38em; text-transform: uppercase; color: var(--catpg-gold);
  }
  .catpg-hero-title {
    font-family: 'Cormorant Garamond', serif; font-weight: 700;
    font-size: clamp(2.4rem, 5vw, 4rem); color: white; margin: 0 0 14px; line-height: 1.05;
  }
  .catpg-divider { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 14px; }
  .catpg-div-line { display: block; width: 52px; height: 1px; background: linear-gradient(90deg, transparent, var(--catpg-gold)); }
  .catpg-div-line:last-child { background: linear-gradient(270deg, transparent, var(--catpg-gold)); }
  .catpg-div-gem { font-size: 9px; color: var(--catpg-gold); }
  .catpg-hero-sub {
    font-family: 'Josefin Sans', sans-serif; font-weight: 300;
    font-size: 13px; letter-spacing: 0.1em; color: rgba(255,255,255,0.6);
  }

  /* ── MAIN ── */
  .catpg-main { flex: 1; padding: 32px 0 72px; background: #fdfdfd; }
  .catpg-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

  /* ── SEARCH ── */
  .catpg-search-wrap {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; flex-wrap: wrap; margin-bottom: 32px;
  }
  .catpg-search-box {
    display: flex; align-items: center; gap: 10px;
    background: white; border: 1px solid rgba(232,200,122,0.3);
    border-radius: 3px; padding: 10px 16px;
    max-width: 380px; flex: 1;
    transition: all 0.3s ease;
  }
  .catpg-search-box:focus-within {
    border-color: var(--catpg-magenta);
    box-shadow: 0 0 0 3px rgba(204,0,102,0.07);
    background: white;
  }
  .catpg-search-icon { color: #bbb; flex-shrink: 0; }
  .catpg-search-box:focus-within .catpg-search-icon { color: var(--catpg-magenta); }
  .catpg-search-input {
    flex: 1; background: none; border: none; outline: none;
    font-family: 'Josefin Sans', sans-serif; font-weight: 300;
    font-size: 13px; letter-spacing: 0.04em; color: #333;
  }
  .catpg-search-input::placeholder { color: #bbb; }
  .catpg-search-clear {
    background: none; border: none; color: #bbb; cursor: pointer;
    display: flex; align-items: center; transition: color 0.2s;
  }
  .catpg-search-clear:hover { color: var(--catpg-magenta); }
  .catpg-count {
    font-family: 'Josefin Sans', sans-serif; font-weight: 300;
    font-size: 11px; letter-spacing: 0.1em; color: #aaa;
    flex-shrink: 0;
  }

  /* ── GRID ── */
  .catpg-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 20px;
  }
  @media (min-width: 640px)  { .catpg-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .catpg-grid { grid-template-columns: repeat(3, 1fr); } }

  /* ── CARD ── */
  .catpg-card {
    display: block; text-decoration: none;
    background: white; border: 1px solid rgba(232,200,122,0.18);
    border-radius: 12px; overflow: hidden;
    transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s ease, border-color 0.3s;
    position: relative;
    animation: catpgFadeUp 0.5s ease backwards;
  }
  @keyframes catpgFadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .catpg-card:hover {
    transform: translateY(-6px);
    border-color: rgba(232,200,122,0.5);
    box-shadow: 0 0 0 1px rgba(232,200,122,0.15), 0 14px 44px rgba(153,0,68,0.13), 0 4px 12px rgba(0,0,0,0.06);
  }

  /* Image */
  .catpg-card-img-wrap {
    position: relative; height: 200px; overflow: hidden;
    background: linear-gradient(135deg, #fff0f6, #fce4f0);
  }
  .catpg-card-img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
  }
  .catpg-card:hover .catpg-card-img { transform: scale(1.07); }

  .catpg-card-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 40%, rgba(26,0,16,0.22) 100%);
    opacity: 0; transition: opacity 0.35s ease;
  }
  .catpg-card:hover .catpg-card-overlay { opacity: 1; }

  /* Gold corners */
  .catpg-corner {
    position: absolute; width: 14px; height: 14px;
    opacity: 0; transition: opacity 0.3s; pointer-events: none;
  }
  .catpg-card:hover .catpg-corner { opacity: 1; }
  .catpg-corner.tl { top: 10px; left: 10px; border-top: 1.5px solid var(--catpg-gold); border-left: 1.5px solid var(--catpg-gold); }
  .catpg-corner.br { bottom: 10px; right: 10px; border-bottom: 1.5px solid var(--catpg-gold); border-right: 1.5px solid var(--catpg-gold); }

  /* Hover label */
  .catpg-hover-label {
    position: absolute; bottom: 14px; left: 50%;
    transform: translateX(-50%) translateY(8px);
    display: flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,0.93);
    border: 1px solid rgba(232,200,122,0.4);
    border-radius: 2px; padding: 7px 18px;
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 9.5px; letter-spacing: 0.25em; text-transform: uppercase;
    color: var(--catpg-magenta); white-space: nowrap;
    opacity: 0; transition: opacity 0.3s, transform 0.3s;
  }
  .catpg-card:hover .catpg-hover-label { opacity: 1; transform: translateX(-50%) translateY(0); }
  .catpg-hover-arrow { color: var(--catpg-gold); transition: transform 0.3s; }
  .catpg-card:hover .catpg-hover-arrow { transform: translateX(3px); }

  /* Body */
  .catpg-card-body { padding: 18px 20px 16px; }
  .catpg-card-name {
    font-family: 'Cormorant Garamond', serif; font-weight: 700;
    font-size: 20px; color: #1a0010; margin: 0 0 8px; line-height: 1.2;
    transition: color 0.2s;
  }
  .catpg-card:hover .catpg-card-name { color: var(--catpg-magenta); }
  .catpg-card-desc {
    font-family: 'Josefin Sans', sans-serif; font-weight: 300;
    font-size: 12px; letter-spacing: 0.04em; line-height: 1.7;
    color: #888; margin: 0 0 14px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .catpg-card-cta {
    display: flex; align-items: center; gap: 7px;
    opacity: 0; transform: translateY(4px);
    transition: opacity 0.3s, transform 0.3s;
  }
  .catpg-card:hover .catpg-card-cta { opacity: 1; transform: translateY(0); }
  .catpg-cta-text {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--catpg-magenta);
  }
  .catpg-cta-arrow { color: var(--catpg-gold); font-size: 14px; transition: transform 0.3s; }
  .catpg-card:hover .catpg-cta-arrow { transform: translateX(3px); }

  /* Bottom bar */
  .catpg-card-bar {
    height: 2px;
    background: linear-gradient(90deg, var(--catpg-gold), var(--catpg-pink));
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
  }
  .catpg-card:hover .catpg-card-bar { transform: scaleX(1); }

  /* ── SKELETON ── */
  .catpg-skeleton { border-radius: 12px; border: 1px solid rgba(232,200,122,0.12); overflow: hidden; background: white; }
  .catpg-sk-img  { height: 200px; background: linear-gradient(135deg, #ffe6f0, #fff0f6); animation: catpgShimmer 1.4s ease-in-out infinite; }
  .catpg-sk-body { padding: 18px 20px; }
  .catpg-sk-line { height: 11px; border-radius: 5px; background: rgba(204,0,102,0.07); margin-bottom: 9px; animation: catpgShimmer 1.4s ease-in-out infinite; width: 55%; }
  .catpg-sk-line.wide  { width: 72%; height: 16px; }
  .catpg-sk-line.short { width: 40%; }
  @keyframes catpgShimmer { 0%,100%{ opacity: 0.45; } 50%{ opacity: 1; } }

  /* ── EMPTY ── */
  .catpg-empty {
    text-align: center; padding: 80px 24px;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
  }
  .catpg-empty-gem { font-size: 28px; color: var(--catpg-gold); opacity: 0.4; }
  .catpg-empty-title {
    font-family: 'Cormorant Garamond', serif; font-weight: 600;
    font-size: 24px; color: #1a0010; margin: 0;
  }
  .catpg-empty-sub {
    font-family: 'Josefin Sans', sans-serif; font-weight: 300;
    font-size: 13px; letter-spacing: 0.08em; color: #aaa; margin: 0;
  }
  .catpg-empty-btn {
    margin-top: 8px; padding: 11px 30px;
    border: 1px solid rgba(232,200,122,0.4); background: none; border-radius: 2px;
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase;
    color: var(--catpg-magenta); cursor: pointer; transition: all 0.25s;
  }
  .catpg-empty-btn:hover { background: var(--catpg-magenta); color: white; border-color: var(--catpg-magenta); }

  /* ── FOOTER CTA ── */
  .catpg-footer-cta { text-align: center; margin-top: 52px; }
  .catpg-cta-btn {
    position: relative; overflow: hidden;
    background: none; border: none; padding: 0; cursor: pointer;
  }
  .catpg-cta-inner {
    display: inline-flex; align-items: center; gap: 12px;
    padding: 14px 48px;
    border: 1px solid rgba(232,200,122,0.45);
    background: linear-gradient(135deg, var(--catpg-magenta) 0%, var(--catpg-pink) 50%, var(--catpg-magenta) 100%);
    background-size: 200% 100%;
    border-radius: 2px;
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: white;
    transition: all 0.4s ease; position: relative; z-index: 1;
  }
  .catpg-cta-btn:hover .catpg-cta-inner {
    background-position: 100% 0;
    border-color: var(--catpg-gold);
    box-shadow: 0 0 32px rgba(255,0,128,0.35), 0 8px 24px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
  .catpg-cta-btn-arrow { color: var(--catpg-gold-lt); font-size: 15px; transition: transform 0.3s; }
  .catpg-cta-btn:hover .catpg-cta-btn-arrow { transform: translateX(4px); }
  .catpg-cta-shimmer {
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
    transform: skewX(-20deg); transition: left 0.55s ease;
  }
  .catpg-cta-btn:hover .catpg-cta-shimmer { left: 150%; }
`