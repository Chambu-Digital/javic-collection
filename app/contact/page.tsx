'use client'

import Header from '@/components/header'
import Footer from '@/components/footer'
import Breadcrumb from '@/components/breadcrumb'
import ShopMap from '@/components/shop-map'
import Link from 'next/link'
import { Phone, MessageCircle, Mail, MapPin, Clock, Instagram, Music } from 'lucide-react'

const breadcrumbItems = [
  { label: 'Home', href: '/' },
  { label: 'Contact', href: '/contact' },
]

export default function ContactPage() {
  return (
    <>
      <style>{styles}</style>
      <div className="ct-root">
        <Header />

        <main className="ct-main">

          {/* Breadcrumb */}
          <div className="ct-breadcrumb-bar">
            <div className="ct-container">
              <Breadcrumb items={breadcrumbItems} />
            </div>
          </div>

          {/* ── HERO ── */}
          <section className="ct-hero">
            <div className="ct-hero-orb left"  aria-hidden="true" />
            <div className="ct-hero-orb right" aria-hidden="true" />
            <div className="ct-hero-inner">
              <div className="ct-eyebrow">
                <span className="ct-eyebrow-line" />
                <span className="ct-eyebrow-text">Get In Touch</span>
                <span className="ct-eyebrow-line" />
              </div>
              <h1 className="ct-hero-title">
                Contact <em>Javic Collection</em>
              </h1>
              <div className="ct-divider">
                <span className="ct-div-line" />
                <span className="ct-div-gem">◆</span>
                <span className="ct-div-line" />
              </div>
              <p className="ct-hero-sub">
                Visit us in store, call, or chat on WhatsApp — we're here to help.
              </p>
            </div>
          </section>

          {/* ── CONTACT DETAILS + MAP ── */}
          <section className="ct-section">
            <div className="ct-container ct-grid">

              {/* Left — details */}
              <div className="ct-details">
                <div className="ct-section-label">Reach Us</div>
                <h2 className="ct-section-title">We'd Love to Hear From You</h2>

                <div className="ct-contact-list">

                  {/* Phone */}
                  <a href="tel:+254706512984" className="ct-contact-item">
                    <div className="ct-icon-ring">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="ct-contact-label">Call Us</p>
                      <p className="ct-contact-value">+254 706 512 984</p>
                      <p className="ct-contact-sub">+254 723 277 306</p>
                    </div>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/254706512984"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ct-contact-item whatsapp"
                  >
                    <div className="ct-icon-ring green">
                      <MessageCircle size={18} />
                    </div>
                    <div>
                      <p className="ct-contact-label">WhatsApp</p>
                      <p className="ct-contact-value">+254 706 512 984</p>
                      <p className="ct-contact-sub">+254 723 277 306</p>
                    </div>
                  </a>

                  {/* Location */}
                  <div className="ct-contact-item static">
                    <div className="ct-icon-ring">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="ct-contact-label">Our Store</p>
                      <p className="ct-contact-value">Biashara Street, Mombasa</p>
                      <p className="ct-contact-sub">Shop at Marikiti, Mombasa</p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="ct-contact-item static">
                    <div className="ct-icon-ring">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="ct-contact-label">Business Hours</p>
                      <p className="ct-contact-value">Mon – Sat: 8 AM – 5 PM</p>
                      <p className="ct-contact-sub">Sunday: Closed</p>
                    </div>
                  </div>

                </div>

                {/* Social links */}
                <div className="ct-socials">
                  <p className="ct-socials-label">Follow Us</p>
                  <div className="ct-socials-row">
                    <a
                      href="https://www.instagram.com/javic_collection"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ct-social-link"
                    >
                      <Instagram size={16} />
                      <span>@javic_collection</span>
                    </a>
                    <a
                      href="https://www.tiktok.com/@javic_collection"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ct-social-link"
                    >
                      <Music size={16} />
                      <span>@javic_collection</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Right — map */}
              <div className="ct-map-wrap">
                <ShopMap height={480} showDirectionsButton />
                <p className="ct-map-caption">
                  <MapPin size={13} />
                  Biashara Street, Marikiti — Mombasa, Kenya
                </p>
              </div>

            </div>
          </section>

          {/* ── CTA ── */}
          <section className="ct-cta-section">
            <div className="ct-container ct-cta-inner">
              <div>
                <h2 className="ct-cta-title">Ready to Shop?</h2>
                <p className="ct-cta-sub">Visit us in store or browse our full collection online.</p>
              </div>
              <div className="ct-cta-btns">
                <Link href="/products">
                  <button className="ct-btn primary">
                    <span className="ct-btn-inner">
                      <span>Shop Now</span>
                      <span className="ct-btn-arrow">→</span>
                    </span>
                    <span className="ct-btn-shimmer" />
                  </button>
                </Link>
                <a href="https://wa.me/254706512984" target="_blank" rel="noopener noreferrer">
                  <button className="ct-btn ghost">
                    <span className="ct-btn-inner">Chat on WhatsApp</span>
                  </button>
                </a>
              </div>
            </div>
          </section>

        </main>

        <Footer />
      </div>
    </>
  )
}

const styles = `
  :root {
    --ct-pink:    #FF0080;
    --ct-magenta: #CC0066;
    --ct-deep:    #990044;
    --ct-gold:    #E8C87A;
    --ct-gold-lt: #F5DFA0;
  }

  .ct-root { display: flex; flex-direction: column; min-height: 100vh; background: #fff; }
  .ct-main { flex: 1; }
  .ct-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

  .ct-breadcrumb-bar {
    background: #fdf5f9;
    border-bottom: 1px solid rgba(232,200,122,0.18);
    padding: 12px 0;
  }

  /* ── HERO ── */
  .ct-hero {
    position: relative;
    background: linear-gradient(160deg, #1a0010 0%, #2d0020 50%, #1a0010 100%);
    padding: 72px 24px 64px;
    text-align: center;
    overflow: hidden;
  }
  .ct-hero-orb {
    position: absolute; width: 380px; height: 380px;
    border-radius: 50%; pointer-events: none; opacity: 0.12;
  }
  .ct-hero-orb.left  { top: -100px; left: -80px;   background: radial-gradient(circle, var(--ct-pink),    transparent 70%); }
  .ct-hero-orb.right { bottom: -80px; right: -80px; background: radial-gradient(circle, var(--ct-magenta), transparent 70%); }
  .ct-hero-inner { position: relative; z-index: 1; }

  .ct-eyebrow {
    display: inline-flex; align-items: center; gap: 10px; margin-bottom: 14px;
  }
  .ct-eyebrow-line { display: block; width: 28px; height: 1px; background: var(--ct-gold); opacity: 0.7; }
  .ct-eyebrow-text {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 12px; letter-spacing: 0.38em; text-transform: uppercase; color: var(--ct-gold);
  }

  .ct-hero-title {
    font-family: 'Cormorant Garamond', serif; font-weight: 700;
    font-size: clamp(2.4rem, 5vw, 4rem); color: white;
    margin: 0 0 16px; line-height: 1.05;
  }
  .ct-hero-title em { font-style: italic; color: var(--ct-gold-lt); }

  .ct-divider { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 16px; }
  .ct-div-line { display: block; width: 56px; height: 1px; background: linear-gradient(90deg, transparent, var(--ct-gold)); }
  .ct-div-line:last-child { background: linear-gradient(270deg, transparent, var(--ct-gold)); }
  .ct-div-gem { font-size: 9px; color: var(--ct-gold); }

  .ct-hero-sub {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 15px; letter-spacing: 0.1em; color: rgba(255,255,255,0.75);
    max-width: 480px; margin: 0 auto;
  }

  /* ── SECTION ── */
  .ct-section { padding: 64px 0; background: white; }

  .ct-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 48px;
    align-items: start;
  }
  @media (min-width: 768px) {
    .ct-grid { grid-template-columns: 1fr 1.4fr; gap: 56px; }
  }

  .ct-section-label {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 12px; letter-spacing: 0.38em; text-transform: uppercase;
    color: var(--ct-magenta); margin-bottom: 10px;
  }
  .ct-section-title {
    font-family: 'Cormorant Garamond', serif; font-weight: 700;
    font-size: clamp(1.8rem, 3.5vw, 2.4rem); color: #1a0010;
    margin: 0 0 28px; line-height: 1.1;
  }

  /* Contact list */
  .ct-contact-list { display: flex; flex-direction: column; gap: 0; margin-bottom: 32px; }

  .ct-contact-item {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 14px 0;
    border-bottom: 1px solid rgba(232,200,122,0.15);
    text-decoration: none;
    transition: opacity 0.2s;
  }
  .ct-contact-item:last-child { border-bottom: none; }
  a.ct-contact-item:hover { opacity: 0.8; }
  .ct-contact-item.static { cursor: default; }

  .ct-icon-ring {
    width: 40px; height: 40px; border-radius: 50%; shrink: 0;
    background: linear-gradient(135deg, var(--ct-magenta), var(--ct-pink));
    display: flex; align-items: center; justify-content: center;
    color: white; flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(255,0,128,0.28);
  }
  .ct-icon-ring.green {
    background: linear-gradient(135deg, #25D366, #128C7E);
    box-shadow: 0 4px 14px rgba(37,211,102,0.28);
  }

  .ct-contact-label {
    font-family: 'Josefin Sans', sans-serif; font-weight: 300;
    font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--ct-gold); margin: 0 0 3px;
  }
  .ct-contact-value {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 15px; color: #1a0010; margin: 0;
  }
  .ct-contact-sub {
    font-family: 'Josefin Sans', sans-serif; font-weight: 300;
    font-size: 12px; color: #888; margin: 2px 0 0;
  }

  /* Socials */
  .ct-socials { margin-top: 8px; }
  .ct-socials-label {
    font-family: 'Josefin Sans', sans-serif; font-weight: 300;
    font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--ct-gold); margin-bottom: 10px;
  }
  .ct-socials-row { display: flex; flex-wrap: wrap; gap: 10px; }
  .ct-social-link {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 7px 14px; border: 1px solid rgba(204,0,102,0.25);
    border-radius: 999px; text-decoration: none;
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 12px; letter-spacing: 0.06em; color: var(--ct-magenta);
    transition: all 0.2s;
  }
  .ct-social-link:hover {
    background: var(--ct-magenta); color: white;
    border-color: var(--ct-magenta);
  }

  /* Map */
  .ct-map-wrap { display: flex; flex-direction: column; gap: 8px; }
  .ct-map-caption {
    display: flex; align-items: center; gap: 5px;
    font-family: 'Josefin Sans', sans-serif; font-weight: 300;
    font-size: 12px; letter-spacing: 0.08em; color: #999;
  }

  /* ── CTA ── */
  .ct-cta-section {
    background: linear-gradient(135deg, #1a0010 0%, #2d0020 50%, #1a0010 100%);
    padding: 56px 24px;
    border-top: 1px solid rgba(232,200,122,0.15);
  }
  .ct-cta-inner {
    display: flex; flex-direction: column;
    align-items: center; gap: 28px; text-align: center;
  }
  @media (min-width: 640px) {
    .ct-cta-inner { flex-direction: row; justify-content: space-between; text-align: left; }
  }
  .ct-cta-title {
    font-family: 'Cormorant Garamond', serif; font-weight: 700;
    font-size: clamp(1.8rem, 3.5vw, 2.4rem); color: white;
    margin: 0 0 6px; line-height: 1.1;
  }
  .ct-cta-sub {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 15px; letter-spacing: 0.1em; color: rgba(255,255,255,0.65); margin: 0;
  }
  .ct-cta-btns { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }

  .ct-btn { position: relative; overflow: hidden; background: none; border: none; padding: 0; cursor: pointer; }
  .ct-btn-inner {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 13px 32px; border-radius: 2px;
    font-family: 'Josefin Sans', sans-serif; font-weight: 500;
    font-size: 13px; letter-spacing: 0.28em; text-transform: uppercase;
    transition: all 0.3s ease; position: relative; z-index: 1;
  }
  .ct-btn.primary .ct-btn-inner {
    background: linear-gradient(135deg, var(--ct-magenta), var(--ct-pink));
    border: 1px solid rgba(232,200,122,0.3); color: white;
  }
  .ct-btn.primary:hover .ct-btn-inner {
    border-color: var(--ct-gold);
    box-shadow: 0 0 28px rgba(255,0,128,0.4), 0 6px 20px rgba(0,0,0,0.2);
    transform: translateY(-2px);
  }
  .ct-btn-arrow { color: var(--ct-gold-lt); font-size: 16px; transition: transform 0.3s; }
  .ct-btn.primary:hover .ct-btn-arrow { transform: translateX(4px); }
  .ct-btn-shimmer {
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
    transform: skewX(-20deg); transition: left 0.55s ease;
  }
  .ct-btn.primary:hover .ct-btn-shimmer { left: 150%; }
  .ct-btn.ghost .ct-btn-inner {
    border: 1px solid rgba(232,200,122,0.35); border-radius: 2px;
    color: rgba(255,255,255,0.75); transition: all 0.3s ease;
  }
  .ct-btn.ghost:hover .ct-btn-inner {
    border-color: rgba(232,200,122,0.7); color: white;
    background: rgba(255,255,255,0.05);
  }
`
