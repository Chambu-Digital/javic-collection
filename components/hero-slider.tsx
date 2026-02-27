'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Banner {
  _id: string
  title: string
  subtitle: string
  image: string
  isActive: boolean
  order: number
}

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    fetchBanners()
  }, [])

  useEffect(() => {
    if (slides.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [slides.length])

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/banners')
      if (response.ok) {
        const data = await response.json()
        setSlides(data)
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  if (loading) {
    return (
      <div className="javic-hero-loading">
        <div className="javic-loading-content">
          <div className="javic-loading-peacock">✦</div>
          <div className="javic-loading-bar"></div>
          <div className="javic-loading-bar short"></div>
        </div>
        <style>{heroStyles}</style>
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <div className="javic-hero-empty">
        <div className="javic-empty-ornament">✦</div>
        <h2 className="javic-empty-title">No banners available</h2>
        <p className="javic-empty-sub">Please add banners in admin settings</p>
        <style>{heroStyles}</style>
      </div>
    )
  }

  return (
    <>
      <style>{heroStyles}</style>
      <div className="javic-hero-wrapper">
       

        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={slide._id}
            className={`javic-slide ${index === currentSlide ? 'active' : ''}`}
          >
            <img
              src={slide.image || "/placeholder.svg"}
              alt={slide.title}
              className="javic-slide-img"
            />
            {/* Multi-layer overlay for depth */}
            <div className="javic-overlay-base" />
            <div className="javic-overlay-radial" />
            <div className="javic-overlay-vignette" />

            {/* Content */}
            <div className="javic-slide-content">
              {/* Top badge */}
              <div className="javic-badge">
                <span className="javic-badge-line" />
                <span className="javic-badge-text">Our Collection</span>
                <span className="javic-badge-line" />
              </div>

              <h2 className="javic-slide-title">{slide.title}</h2>

              {/* Decorative divider */}
              <div className="javic-divider">
                <span className="javic-divider-line" />
                <span className="javic-divider-gem"></span>
                <span className="javic-divider-line" />
              </div>

              <p className="javic-slide-sub">{slide.subtitle}</p>

              <Link href="/products">
                <button className="javic-cta-btn">
                  <span className="javic-cta-inner">
                    <span className="javic-cta-text">Shop Now</span>
                    <span className="javic-cta-arrow"></span>
                  </span>
                  <span className="javic-cta-shimmer" />
                </button>
              </Link>
            </div>
          </div>
        ))}

        {/* Side scroll indicators */}
        <div className="javic-slide-counter">
          <span className="javic-counter-current">{String(currentSlide + 1).padStart(2, '0')}</span>
          <span className="javic-counter-sep"></span>
          <span className="javic-counter-total">{String(slides.length).padStart(2, '0')}</span>
        </div>

        {/* Nav Buttons */}
        <button onClick={prevSlide} className="javic-nav-btn left" aria-label="Previous">
          <span className="javic-nav-icon">‹</span>
        </button>
        <button onClick={nextSlide} className="javic-nav-btn right" aria-label="Next">
          <span className="javic-nav-icon">›</span>
        </button>

        {/* Progress dots */}
        <div className="javic-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`javic-dot ${index === currentSlide ? 'active' : ''}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Bottom brand strip */}
        <div className="javic-brand-strip">
          <span>COMFORT</span>
          <span className="javic-strip-dot">✦</span>
          <span>ELEGANCE</span>
          <span className="javic-strip-dot">✦</span>
          <span>STYLE</span>
          <span className="javic-strip-dot">✦</span>
          <span>GRACE</span>
        </div>
      </div>
    </>
  )
}

const heroStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Josefin+Sans:wght@200;300;400&display=swap');

  :root {
    --javic-hot-pink: #FF0080;
    --javic-deep-magenta: #CC0066;
    --javic-crimson: #990044;
    --javic-gold: #E8C87A;
    --javic-gold-light: #F5DFA0;
    --javic-white: #FFFFFF;
  }

  .javic-hero-wrapper {
    position: relative;
    height: 520px;
    overflow: hidden;
    border-radius: 20px;
    margin: 0 16px;
    box-shadow:
      0 0 0 1px rgba(232, 200, 122, 0.3),
      0 4px 6px rgba(204, 0, 102, 0.15),
      0 20px 60px rgba(153, 0, 68, 0.4),
      0 40px 80px rgba(0, 0, 0, 0.3);
  }

  @media (min-width: 768px) {
    .javic-hero-wrapper {
      height: 600px;
      margin: 0;
    }
  }

  /* CORNERS */
  .javic-corner {
    position: absolute;
    z-index: 20;
    color: var(--javic-gold);
    font-size: 12px;
    opacity: 0.7;
    pointer-events: none;
  }
  .javic-corner.tl { top: 16px; left: 16px; }
  .javic-corner.tr { top: 16px; right: 16px; }
  .javic-corner.bl { bottom: 48px; left: 16px; }
  .javic-corner.br { bottom: 48px; right: 16px; }

  /* SLIDES */
  .javic-slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .javic-slide.active {
    opacity: 1;
  }

  .javic-slide-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.05);
    transition: transform 8s ease-out;
  }
  .javic-slide.active .javic-slide-img {
    transform: scale(1);
  }

  /* OVERLAYS */
  .javic-overlay-base {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(153, 0, 68, 0.75) 0%,
      rgba(204, 0, 102, 0.55) 40%,
      rgba(255, 0, 128, 0.35) 70%,
      rgba(100, 0, 50, 0.7) 100%
    );
  }
  .javic-overlay-radial {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse at 50% 40%,
      rgba(255, 0, 128, 0.1) 0%,
      rgba(0, 0, 0, 0.3) 70%
    );
  }
  .javic-overlay-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse at center,
      transparent 40%,
      rgba(0, 0, 0, 0.5) 100%
    );
  }

  /* SLIDE CONTENT */
  .javic-slide-content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 24px 32px 64px;
    z-index: 10;
  }

  /* BADGE */
  .javic-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    opacity: 0;
    transform: translateY(20px);
  }
  .javic-slide.active .javic-badge {
    animation: javicFadeUp 0.7s 0.2s ease forwards;
  }
  .javic-badge-line {
    display: block;
    width: 40px;
    height: 1px;
    background: var(--javic-gold);
    opacity: 0.8;
  }
  .javic-badge-text {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 11px;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: var(--javic-gold-light);
  }

  /* TITLE */
  .javic-slide-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: clamp(2.5rem, 7vw, 5.5rem);
    line-height: 1.05;
    color: var(--javic-white);
    margin-bottom: 16px;
    text-shadow:
      0 2px 20px rgba(153, 0, 68, 0.6),
      0 0 60px rgba(255, 0, 128, 0.3);
    letter-spacing: -0.01em;
    opacity: 0;
    transform: translateY(30px);
  }
  .javic-slide.active .javic-slide-title {
    animation: javicFadeUp 0.8s 0.35s ease forwards;
  }

  /* DIVIDER */
  .javic-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    opacity: 0;
  }
  .javic-slide.active .javic-divider {
    animation: javicFadeUp 0.7s 0.5s ease forwards;
  }
  .javic-divider-line {
    display: block;
    width: 60px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--javic-gold));
  }
  .javic-divider-line:last-child {
    background: linear-gradient(90deg, var(--javic-gold), transparent);
  }
  .javic-divider-gem {
    color: var(--javic-gold);
    font-size: 10px;
  }

  /* SUBTITLE */
  .javic-slide-sub {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 200;
    font-size: clamp(0.85rem, 2.2vw, 1.15rem);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.88);
    margin-bottom: 36px;
    max-width: 480px;
    opacity: 0;
    transform: translateY(20px);
  }
  .javic-slide.active .javic-slide-sub {
    animation: javicFadeUp 0.7s 0.6s ease forwards;
  }

  /* CTA BUTTON */
  .javic-cta-btn {
    position: relative;
    overflow: hidden;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0;
    transform: translateY(20px);
  }
  .javic-slide.active .javic-cta-btn {
    animation: javicFadeUp 0.7s 0.75s ease forwards;
  }
  .javic-cta-inner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 44px;
    background: linear-gradient(135deg, var(--javic-hot-pink) 0%, var(--javic-deep-magenta) 50%, var(--javic-hot-pink) 100%);
    background-size: 200% 100%;
    border: 1px solid rgba(232, 200, 122, 0.4);
    border-radius: 2px;
    transition: all 0.4s ease;
    position: relative;
    z-index: 1;
  }
  .javic-cta-btn:hover .javic-cta-inner {
    background-position: 100% 0;
    border-color: rgba(232, 200, 122, 0.8);
    box-shadow: 0 0 40px rgba(255, 0, 128, 0.6), 0 8px 32px rgba(0,0,0,0.3);
    transform: translateY(-2px);
  }
  .javic-cta-text {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 13px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--javic-white);
  }
  .javic-cta-arrow {
    color: var(--javic-gold-light);
    font-size: 18px;
    transition: transform 0.3s ease;
  }
  .javic-cta-btn:hover .javic-cta-arrow {
    transform: translateX(4px);
  }
  .javic-cta-shimmer {
    position: absolute;
    top: 0; left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: skewX(-20deg);
    transition: left 0.6s ease;
  }
  .javic-cta-btn:hover .javic-cta-shimmer {
    left: 150%;
  }

  /* SLIDE COUNTER */
  .javic-slide-counter {
    position: absolute;
    right: 24px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 20;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .javic-counter-current {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 300;
    color: var(--javic-white);
    line-height: 1;
  }
  .javic-counter-sep {
    display: block;
    width: 1px;
    height: 30px;
    background: linear-gradient(to bottom, var(--javic-gold), transparent);
  }
  .javic-counter-total {
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px;
    font-weight: 300;
    color: rgba(255,255,255,0.5);
    line-height: 1;
  }

  /* NAV BUTTONS */
  .javic-nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 20;
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(232, 200, 122, 0.25);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }
  .javic-nav-btn.left { left: 20px; }
  .javic-nav-btn.right { right: 20px; }
  .javic-nav-btn:hover {
    background: rgba(255, 0, 128, 0.25);
    border-color: rgba(232, 200, 122, 0.6);
    box-shadow: 0 0 20px rgba(255, 0, 128, 0.3);
    transform: translateY(-50%) scale(1.08);
  }
  .javic-nav-icon {
    color: var(--javic-white);
    font-size: 28px;
    line-height: 1;
    font-weight: 200;
    font-family: serif;
  }

  /* DOTS */
  .javic-dots {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    z-index: 20;
  }
  .javic-dot {
    height: 3px;
    border-radius: 2px;
    border: none;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(255, 255, 255, 0.35);
    width: 20px;
    padding: 0;
  }
  .javic-dot.active {
    background: var(--javic-gold);
    width: 48px;
    box-shadow: 0 0 10px rgba(232, 200, 122, 0.6);
  }
  .javic-dot:hover:not(.active) {
    background: rgba(255, 255, 255, 0.65);
  }

  /* BRAND STRIP */
  .javic-brand-strip {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 32px;
    background: linear-gradient(90deg, rgba(153,0,68,0.95), rgba(204,0,102,0.95), rgba(153,0,68,0.95));
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    z-index: 20;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 9px;
    letter-spacing: 0.35em;
    color: rgba(255,255,255,0.7);
  }
  .javic-strip-dot {
    color: var(--javic-gold);
    font-size: 7px;
    opacity: 0.8;
  }

  /* LOADING */
  .javic-hero-loading {
    position: relative;
    height: 520px;
    overflow: hidden;
    border-radius: 20px;
    margin: 0 16px;
    background: linear-gradient(135deg, #660033, #990044, #CC0066);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  @media (min-width: 768px) {
    .javic-hero-loading { height: 600px; margin: 0; }
  }
  .javic-loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .javic-loading-peacock {
    font-size: 32px;
    color: var(--javic-gold);
    animation: javicPulse 1.5s ease-in-out infinite;
  }
  .javic-loading-bar {
    height: 3px;
    border-radius: 2px;
    background: rgba(232, 200, 122, 0.3);
    width: 200px;
    position: relative;
    overflow: hidden;
  }
  .javic-loading-bar.short { width: 120px; }
  .javic-loading-bar::after {
    content: '';
    position: absolute;
    top: 0; left: -60%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, var(--javic-gold), transparent);
    animation: javicLoadBar 1.4s ease-in-out infinite;
  }

  /* EMPTY */
  .javic-hero-empty {
    position: relative;
    height: 520px;
    border-radius: 20px;
    margin: 0 16px;
    background: linear-gradient(135deg, #660033, #990044);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  .javic-empty-ornament {
    font-size: 40px;
    color: var(--javic-gold);
    opacity: 0.5;
  }
  .javic-empty-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 600;
    color: var(--javic-white);
  }
  .javic-empty-sub {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 13px;
    letter-spacing: 0.15em;
    color: rgba(255,255,255,0.5);
  }

  /* KEYFRAMES */
  @keyframes javicFadeUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes javicPulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
  }
  @keyframes javicLoadBar {
    0% { left: -60%; }
    100% { left: 110%; }
  }
`