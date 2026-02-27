'use client'

import { Zap, Award, Shield, Truck } from 'lucide-react'
import Breadcrumb from '@/components/breadcrumb'
import Header from '@/components/header'
import Footer from '@/components/footer'
import Link from 'next/link'

export default function AboutPage() {
  const values = [
    { icon: Zap,    num: '01', title: 'Premium Fabrics',      description: 'Finest materials sourced for exceptional comfort and durability in every piece.' },
    { icon: Shield, num: '02', title: 'Quality Guaranteed',   description: 'Every product backed by our commitment to lasting quality and your satisfaction.' },
    { icon: Truck,  num: '03', title: 'Fast Delivery',        description: 'Reliable delivery across Kenya — straight to your door, on time.' },
    { icon: Award,  num: '04', title: 'Expert Support',       description: 'Our team is on hand with sizing advice and after-sales care whenever you need.' },
  ]

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' }
  ]

  return (
    <>
      <style>{aboutStyles}</style>
      <div className="ab-root">
        <Header />

        <main className="ab-main">

          {/* Breadcrumb */}
          <div className="ab-breadcrumb-bar">
            <div className="ab-container">
              <Breadcrumb items={breadcrumbItems} />
            </div>
          </div>

          {/* ── HERO ── */}
          <section className="ab-hero">
            <div className="ab-hero-orb left"  aria-hidden="true" />
            <div className="ab-hero-orb right" aria-hidden="true" />
            <div className="ab-hero-inner">
              <div className="ab-eyebrow">
                <span className="ab-eyebrow-line" />
                <span className="ab-eyebrow-text">Our Story</span>
                <span className="ab-eyebrow-line" />
              </div>
              <h1 className="ab-hero-title">
                About <em>Javic Collection</em>
              </h1>
              <div className="ab-divider">
                <span className="ab-div-line" />
                <span className="ab-div-gem"></span>
                <span className="ab-div-line" />
              </div>
              <p className="ab-hero-sub">
                Kenya's premier destination for luxury lingerie, sleepwear, innerwear & sportswear — where comfort meets elegance.
              </p>
            </div>
          </section>

          {/* ── STORY + CONTACT ── */}
          <section className="ab-section">
            <div className="ab-container ab-two-col">

              {/* Story */}
              <div className="ab-story">
                <div className="ab-section-label">Who We Are</div>
                <h2 className="ab-section-title">Comfort Meets Style</h2>
                <p className="ab-body-text">
                  JAVIC COLLECTION grew from a boutique fashion store into Kenya's most trusted name in intimate apparel. We curate premium fabrics and elegant designs to bring you pieces that celebrate your confidence every single day.
                </p>
                <p className="ab-body-text">
                  From silk nightwear to everyday innerwear, every item in our range is selected for its quality, fit, and feel — because you deserve nothing less.
                </p>
               
              </div>

            

            </div>
          </section>

          {/* ── VALUES ── */}
          <section className="ab-values-section">
            <div className="ab-container">
              <div className="ab-eyebrow center">
                <span className="ab-eyebrow-line" />
                <span className="ab-eyebrow-text">Our Promise</span>
                <span className="ab-eyebrow-line" />
              </div>
              <h2 className="ab-section-title center">Why Choose Us</h2>
              <div className="ab-divider center">
                <span className="ab-div-line" />
                <span className="ab-div-gem">◆</span>
                <span className="ab-div-line" />
              </div>

              <div className="ab-values-grid">
                {values.map((v, i) => {
                  const Icon = v.icon
                  return (
                    <div key={i} className="ab-value-card" style={{ animationDelay: `${i * 0.1}s` }}>
                      <span className="ab-value-watermark">{v.num}</span>
                     
                      <h3 className="ab-value-title">{v.title}</h3>
                      <p className="ab-value-desc">{v.description}</p>
                      <div className="ab-value-bar" />
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="ab-cta-section">
            <div className="ab-container ab-cta-inner">
              <div>
                <h2 className="ab-cta-title">Ready to Shop?</h2>
                <p className="ab-cta-sub">Premium fashion, expert service, unbeatable quality.</p>
              </div>
              <div className="ab-cta-btns">
                <Link href="/products">
                  <button className="ab-btn primary">
                    <span className="ab-btn-inner">
                      <span>Shop Now</span>
                      <span className="ab-btn-arrow"></span>
                    </span>
                    <span className="ab-btn-shimmer" />
                  </button>
                </Link>
                <Link href="/contact">
                  <button className="ab-btn ghost">Contact Us</button>
                </Link>
              </div>
            </div>
          </section>

        </main>

        <Footer />
      </div>
    </>
  )
}

const aboutStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Josefin+Sans:wght@200;300;400&display=swap');

  :root {
    --ab-pink:    #FF0080;
    --ab-magenta: #CC0066;
    --ab-deep:    #990044;
    --ab-gold:    #E8C87A;
    --ab-gold-lt: #F5DFA0;
  }

  .ab-root { display: flex; flex-direction: column; min-height: 100vh; background: #fff; }
  .ab-main { flex: 1; }
  .ab-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

  /* Breadcrumb */
  .ab-breadcrumb-bar {
    background: #fdf5f9;
    border-bottom: 1px solid rgba(232,200,122,0.18);
    padding: 12px 0;
  }

  /* ── HERO ── */
  .ab-hero {
    position: relative;
    background: linear-gradient(160deg, #1a0010 0%, #2d0020 50%, #1a0010 100%);
    padding: 72px 24px 64px;
    text-align: center;
    overflow: hidden;
  }
  .ab-hero-orb {
    position: absolute;
    width: 380px; height: 380px;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0.12;
  }
  .ab-hero-orb.left  { top: -100px; left: -80px;  background: radial-gradient(circle, var(--ab-pink),    transparent 70%); }
  .ab-hero-orb.right { bottom: -80px; right: -80px; background: radial-gradient(circle, var(--ab-magenta), transparent 70%); }
  .ab-hero-inner { position: relative; z-index: 1; }

  .ab-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }
  .ab-eyebrow.center { display: flex; justify-content: center; }
  .ab-eyebrow-line { display: block; width: 28px; height: 1px; background: var(--ab-gold); opacity: 0.7; }
  .ab-eyebrow-text {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 12px;
    letter-spacing: 0.38em;
    text-transform: uppercase;
    color: var(--ab-gold);
  }

  .ab-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: clamp(2.4rem, 5vw, 4rem);
    color: white;
    margin: 0 0 16px;
    line-height: 1.05;
  }
  .ab-hero-title em { font-style: italic; color: var(--ab-gold-lt); }

  .ab-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .ab-divider.center { margin-bottom: 12px; }
  .ab-div-line { display: block; width: 56px; height: 1px; background: linear-gradient(90deg, transparent, var(--ab-gold)); }
  .ab-div-line:last-child { background: linear-gradient(270deg, transparent, var(--ab-gold)); }
  .ab-div-gem { font-size: 9px; color: var(--ab-gold); }

  .ab-hero-sub {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 15px;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.75);
    max-width: 500px;
    margin: 0 auto;
  }

  /* ── STORY + CONTACT ── */
  .ab-section {
    padding: 64px 0;
    background: white;
  }
  .ab-two-col {
    display: grid;
    grid-template-columns: 1fr;
    gap: 40px;
  }
  @media (min-width: 768px) {
    .ab-two-col { grid-template-columns: 1.3fr 1fr; gap: 56px; align-items: start; }
  }

  .ab-section-label {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 12px;
    letter-spacing: 0.38em;
    text-transform: uppercase;
    color: var(--ab-magenta);
    margin-bottom: 10px;
  }
  .ab-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: clamp(1.8rem, 3.5vw, 2.6rem);
    color: #1a0010;
    margin: 0 0 12px;
    line-height: 1.1;
  }
  .ab-section-title.center { text-align: center; }

  .ab-body-text {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 15px;
    line-height: 1.8;
    letter-spacing: 0.04em;
    color: #1A0010;
    margin: 0 0 16px;
  }

  /* Stats */
  .ab-stat-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 28px;
    padding-top: 24px;
    border-top: 1px solid rgba(232,200,122,0.25);
    flex-wrap: wrap;
  }
  .ab-stat { display: flex; flex-direction: column; gap: 3px; }
  .ab-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 26px;
    color: var(--ab-magenta);
    line-height: 1;
  }
  .ab-stat-label {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 9.5px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #aaa;
  }
  .ab-stat-sep { font-size: 8px; color: var(--ab-gold); opacity: 0.5; padding: 0 4px; }

  /* Contact card */
  .ab-contact-card {
    background: linear-gradient(160deg, #1a0010, #2d0020);
    border: 1px solid rgba(232,200,122,0.2);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 12px 40px rgba(153,0,68,0.18);
  }
  .ab-contact-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 18px 24px 14px;
    border-bottom: 1px solid rgba(232,200,122,0.15);
  }
  .ab-contact-gem { font-size: 8px; color: var(--ab-gold); }
  .ab-contact-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 18px;
    color: white;
    letter-spacing: 0.04em;
  }
  .ab-contact-rows { padding: 16px 24px 20px; display: flex; flex-direction: column; gap: 0; }
  .ab-contact-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 9px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .ab-contact-row:last-child { border-bottom: none; }
  .ab-contact-label {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ab-gold);
  }
  .ab-contact-val {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 12.5px;
    color: rgba(255,255,255,0.75);
    text-decoration: none;
    transition: color 0.2s;
  }
  a.ab-contact-val:hover { color: var(--ab-gold-lt); }
  .ab-contact-divider {
    height: 1px;
    background: rgba(232,200,122,0.18);
    margin: 8px 0;
  }

  /* ── VALUES ── */
  .ab-values-section {
    padding: 64px 0 72px;
    background: linear-gradient(180deg, #fdf5f9 0%, #fff8fb 60%, #ffffff 100%);
  }
  .ab-values-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
    margin-top: 36px;
  }
  @media (min-width: 768px) {
    .ab-values-grid { grid-template-columns: repeat(4, 1fr); }
  }

  .ab-value-card {
    background: white;
    border: 1px solid rgba(232,200,122,0.2);
    border-radius: 12px;
    padding: 28px 22px 22px;
    text-align: center;
    position: relative;
    overflow: hidden;
    transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.3s;
    animation: abFadeUp 0.5s ease backwards;
  }
  @keyframes abFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ab-value-card:hover {
    transform: translateY(-5px);
    border-color: rgba(232,200,122,0.5);
    box-shadow: 0 12px 36px rgba(153,0,68,0.1);
  }

  .ab-value-watermark {
    position: absolute;
    top: 8px; right: 12px;
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 48px;
    color: rgba(204,0,102,0.05);
    line-height: 1;
    user-select: none;
    pointer-events: none;
  }

  .ab-value-icon {
    width: 52px; height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--ab-magenta), var(--ab-pink));
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 14px;
    color: white;
    box-shadow: 0 6px 18px rgba(255,0,128,0.3);
    transition: box-shadow 0.3s;
  }
  .ab-value-card:hover .ab-value-icon { box-shadow: 0 8px 26px rgba(255,0,128,0.5); }

  .ab-value-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 19px;
    color: #1a0010;
    margin: 0 0 8px;
    letter-spacing: 0.01em;
    transition: color 0.2s;
  }
  .ab-value-card:hover .ab-value-title { color: var(--ab-magenta); }

  .ab-value-desc {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 1.7;
    letter-spacing: 0.04em;
    color: #1A0010;
    margin: 0;
  }

  .ab-value-bar {
    height: 2px;
    background: linear-gradient(90deg, var(--ab-gold), var(--ab-pink));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
    margin-top: 16px;
    border-radius: 1px;
  }
  .ab-value-card:hover .ab-value-bar { transform: scaleX(1); }

  /* ── CTA ── */
  .ab-cta-section {
    background: linear-gradient(135deg, #1a0010 0%, #2d0020 50%, #1a0010 100%);
    padding: 56px 24px;
    border-top: 1px solid rgba(232,200,122,0.15);
  }
  .ab-cta-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    text-align: center;
  }
  @media (min-width: 640px) {
    .ab-cta-inner { flex-direction: row; justify-content: space-between; text-align: left; }
  }

  .ab-cta-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: clamp(1.8rem, 3.5vw, 2.4rem);
    color: white;
    margin: 0 0 6px;
    line-height: 1.1;
  }
  .ab-cta-sub {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 15px;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.65);
    margin: 0;
  }

  .ab-cta-btns { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }

  .ab-btn {
    position: relative;
    overflow: hidden;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-decoration: none;
  }
  .ab-btn-inner {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 13px 36px;
    border-radius: 2px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 500;
    font-size: 13px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    transition: all 0.35s ease;
    position: relative;
    z-index: 1;
  }
  .ab-btn.primary .ab-btn-inner {
    background: linear-gradient(135deg, var(--ab-magenta), var(--ab-pink));
    border: 1px solid rgba(232,200,122,0.3);
    color: white;
  }
  .ab-btn.primary:hover .ab-btn-inner {
    border-color: var(--ab-gold);
    box-shadow: 0 0 28px rgba(255,0,128,0.4), 0 6px 20px rgba(0,0,0,0.2);
    transform: translateY(-2px);
  }
  .ab-btn-arrow { color: var(--ab-gold-lt); font-size: 15px; transition: transform 0.3s; }
  .ab-btn.primary:hover .ab-btn-arrow { transform: translateX(4px); }

  .ab-btn-shimmer {
    position: absolute;
    top: 0; left: -100%;
    width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
    transform: skewX(-20deg);
    transition: left 0.55s ease;
  }
  .ab-btn.primary:hover .ab-btn-shimmer { left: 150%; }

  .ab-btn.ghost .ab-btn-inner {
    display: inline-flex;
    align-items: center;
    padding: 13px 36px;
    border: 1px solid rgba(232,200,122,0.35);
    border-radius: 2px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 500;
    font-size: 13px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.75);
    transition: all 0.3s ease;
    background: none;
    gap: 0;
  }
  .ab-btn.ghost:hover .ab-btn-inner {
    border-color: rgba(232,200,122,0.7);
    color: white;
    background: rgba(255,255,255,0.05);
  }
`