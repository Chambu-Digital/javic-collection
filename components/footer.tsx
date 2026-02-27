'use client'

import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <>
      <style>{footerStyles}</style>
      <footer className="jf-footer">

        {/* Ambient orbs */}
        <div className="jf-orb top-right" aria-hidden="true" />
        <div className="jf-orb bottom-left" aria-hidden="true" />

        {/* Top decorative border */}
        <div className="jf-top-border" />

        <div className="jf-inner">

          {/* ── BRAND COLUMN ── */}
          <div className="jf-col brand">
            <Link href="/" className="jf-logo-wrap">
              <div className="jf-logo-ring">
                <img
                  src="/javic-logo1.png"
                  alt="Javic Collection"
                  className="jf-logo-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/javiclogo.png'
                  }}
                />
              </div>
              <div className="jf-logo-text">
                <span className="jf-logo-name">JAVIC</span>
                <span className="jf-logo-sub">COLLECTION</span>
              </div>
            </Link>

            <p className="jf-brand-desc">
              Kenya's premier fashion destination for luxury lingerie, sleepwear, innerwear, and sportswear. Premium fabrics, elegant designs, exceptional service.
            </p>

            <div className="jf-hours-card">
              <Clock size={16} className="jf-hours-icon" />
              <div>
                <p className="jf-hours-title">Business Hours</p>
                <p className="jf-hours-detail">Mon–Fri: 8AM – 6PM</p>
                <p className="jf-hours-detail">Saturday: 9AM – 5PM</p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="jf-trust-badges">
              {['Genuine Products', 'Quality Guaranteed', 'Fast Delivery'].map(b => (
                <span key={b} className="jf-trust-badge">
                  <span className="jf-trust-check"></span>
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* ── CONTACT COLUMN ── */}
          <div className="jf-col">
            <div className="jf-col-header">
              <h3 className="jf-col-title">Contact Us</h3>
            </div>

            <div className="jf-contact-list">
              <a href="tel:+254706512984" className="jf-contact-item">
                <div className="jf-contact-icon-ring">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="jf-contact-label">Call Us</p>
                  <p className="jf-contact-value">+254 706 512 984</p>
                </div>
              </a>

              <a href="https://wa.me/254706512984" className="jf-contact-item whatsapp">
                <div className="jf-contact-icon-ring green">
                  <MessageCircle size={16} />
                </div>
                <div>
                  <p className="jf-contact-label">WhatsApp</p>
                  <p className="jf-contact-value">Quick Support</p>
                </div>
              </a>

              <a href="mailto:sales@javiccollection.co.ke" className="jf-contact-item">
                <div className="jf-contact-icon-ring">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="jf-contact-label">Email Us</p>
                  <p className="jf-contact-value">sales@javiccollection.co.ke</p>
                </div>
              </a>

              <div className="jf-contact-item static">
                <div className="jf-contact-icon-ring">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="jf-contact-label">Our Store</p>
                  <p className="jf-contact-value">Taveta Lane, Nairobi</p>
                  <p className="jf-contact-sub">Premium Collection</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── LINKS COLUMN ── */}
          <div className="jf-col">
            <div className="jf-col-header">
              <h3 className="jf-col-title">Quick Links</h3>
            </div>

            <nav className="jf-links">
              {[
                { href: '/products',   label: 'Products' },
                { href: '/categories', label: 'Categories' },
                { href: '/about',      label: 'About Us' },
                { href: '/contact',    label: 'Contact' },
                // { href: '/blog',       label: 'Blog' },
                { href: '/account',    label: 'My Account' },
              ].map(l => (
                <Link key={l.href} href={l.href} className="jf-link">
                  <span className="jf-link-dot"></span>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="jf-bottom-border" />
        <div className="jf-bottom">
          <div className="jf-bottom-inner">
            <p className="jf-copy">
              &copy; 2026 <strong>JAVIC COLLECTION</strong>. All rights reserved.
            </p>
            <div className="jf-tagline-row">
              <span className="jf-tagline-gem">✦</span>
              <span className="jf-tagline">Quality · Elegance · Comfort</span>
              <span className="jf-tagline-gem">✦</span>
            </div>
          </div>
        </div>

      </footer>
    </>
  )
}

const footerStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Josefin+Sans:wght@200;300;400&display=swap');

  :root {
    --jf-pink:    #FF0080;
    --jf-magenta: #CC0066;
    --jf-deep:    #990044;
    --jf-darker:  #1a0010;
    --jf-gold:    #E8C87A;
    --jf-gold-lt: #F5DFA0;
  }

  /* ── FOOTER SHELL ── */
  .jf-footer {
    position: relative;
    background: linear-gradient(160deg, #1a0010 0%, #661f4bff 45%, #832b61ff 100%);
    overflow: hidden;
  }

  /* Ambient orbs */
  .jf-orb {
    position: absolute;
    width: 480px;
    height: 480px;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0.12;
  }
  .jf-orb.top-right  { top: -120px; right: -120px; background: radial-gradient(circle, var(--jf-pink),    transparent 70%); }
  .jf-orb.bottom-left{ bottom: -100px; left: -100px; background: radial-gradient(circle, var(--jf-magenta), transparent 70%); }

  /* Top decorative border */
  .jf-top-border {
    height: 3px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(232,200,122,0.3) 10%,
      var(--jf-magenta) 35%,
      var(--jf-pink) 50%,
      var(--jf-magenta) 65%,
      rgba(232,200,122,0.3) 90%,
      transparent 100%
    );
  }

  /* ── MAIN GRID ── */
  .jf-inner {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin: 0 auto;
    padding: 56px 32px 48px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 44px;
  }
  @media (min-width: 768px) {
    .jf-inner { grid-template-columns: 1.4fr 1fr 1fr; gap: 48px; }
  }

  .jf-col { display: flex; flex-direction: column; gap: 0; }

  /* ── LOGO ── */
  .jf-logo-wrap {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    margin-bottom: 20px;
  }
  .jf-logo-ring {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--jf-pink), var(--jf-deep));
    padding: 2px;
    box-shadow: 0 0 0 1px rgba(232,200,122,0.3), 0 6px 20px rgba(255,0,128,0.3);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: box-shadow 0.3s ease;
    flex-shrink: 0;
  }
  .jf-logo-wrap:hover .jf-logo-ring {
    box-shadow: 0 0 0 1px rgba(232,200,122,0.7), 0 8px 28px rgba(255,0,128,0.5);
  }
  .jf-logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 3px;
  }
  .jf-logo-text {
    display: flex;
    flex-direction: column;
    line-height: 1;
  }
  .jf-logo-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 24px;
    letter-spacing: 0.18em;
    color: white;
  }
  .jf-logo-sub {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 8.5px;
    letter-spacing: 0.38em;
    color: var(--jf-gold);
    text-transform: uppercase;
    margin-top: 3px;
  }

  /* Brand description */
  .jf-brand-desc {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 1.75;
    letter-spacing: 0.03em;
    color: rgba(255,255,255,0.75);
    margin-bottom: 22px;
  }

  /* Hours card */
  .jf-hours-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(232,200,122,0.18);
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 20px;
  }
  .jf-hours-icon { color: var(--jf-gold); flex-shrink: 0; margin-top: 2px; }
  .jf-hours-title {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 500;
    font-size: 12px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--jf-gold-lt);
    margin: 0 0 4px;
  }
  .jf-hours-detail {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 13px;
    letter-spacing: 0.04em;
    color: rgba(255,255,255,0.7);
    margin: 0;
  }

  /* Trust badges */
  .jf-trust-badges {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .jf-trust-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 13px;
    letter-spacing: 0.05em;
    color: rgba(255,255,255,0.7);
  }
  .jf-trust-check {
    font-size: 7px;
    color: var(--jf-gold);
  }

  /* ── COLUMN HEADERS ── */
  .jf-col-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }
  .jf-col-header-line {
    display: block;
    width: 24px;
    height: 2px;
    background: linear-gradient(90deg, var(--jf-magenta), var(--jf-gold));
    border-radius: 1px;
    flex-shrink: 0;
  }
  .jf-col-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 22px;
    color: white;
    letter-spacing: 0.04em;
    margin: 0;
  }

  /* ── CONTACT ── */
  .jf-contact-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .jf-contact-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    text-decoration: none;
    padding: 12px 14px;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: all 0.25s ease;
  }
  .jf-contact-item:not(.static):hover {
    background: rgba(255,255,255,0.04);
    border-color: rgba(232,200,122,0.2);
    transform: translateX(4px);
  }
  .jf-contact-item:not(.static):hover .jf-contact-icon-ring {
    box-shadow: 0 4px 14px rgba(255,0,128,0.3);
    border-color: rgba(232,200,122,0.4);
  }
  .jf-contact-item.whatsapp:hover .jf-contact-value { color: #6ee77f; }

  .jf-contact-icon-ring {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(232,200,122,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--jf-gold-lt);
    flex-shrink: 0;
    transition: all 0.25s ease;
  }
  .jf-contact-icon-ring.green {
    background: rgba(34,197,94,0.1);
    border-color: rgba(34,197,94,0.25);
    color: #6ee77f;
  }

  .jf-contact-label {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 500;
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--jf-gold);
    margin: 0 0 3px;
  }
  .jf-contact-value {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.03em;
    color: rgba(255,255,255,0.85);
    margin: 0;
    transition: color 0.2s;
  }
  .jf-contact-sub {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 11.5px;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.05em;
    margin: 2px 0 0;
  }

  /* ── LINKS ── */
  .jf-links {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 8px;
  }
  .jf-link {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.7);
    text-decoration: none;
    padding: 8px 4px;
    border-left: 2px solid transparent;
    transition: all 0.22s ease;
  }
  .jf-link:hover {
    color: white;
    border-left-color: var(--jf-gold);
    padding-left: 10px;
  }
  .jf-link-dot {
    font-size: 6px;
    color: var(--jf-gold);
    opacity: 0.5;
    flex-shrink: 0;
    transition: opacity 0.2s;
  }
  .jf-link:hover .jf-link-dot { opacity: 1; }

  /* ── BOTTOM BAR ── */
  .jf-bottom-border {
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(232,200,122,0.2) 20%,
      rgba(232,200,122,0.4) 50%,
      rgba(232,200,122,0.2) 80%,
      transparent 100%
    );
  }
  .jf-bottom {
    position: relative;
    z-index: 1;
  }
  .jf-bottom-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  @media (min-width: 768px) {
    .jf-bottom-inner {
      flex-direction: row;
      justify-content: space-between;
    }
  }
  .jf-copy {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 12px;
    letter-spacing: 0.06em;
    color: rgba(255,255,255,0.5);
    margin: 0;
  }
  .jf-copy strong {
    font-weight: 500;
    color: rgba(255,255,255,0.75);
    letter-spacing: 0.12em;
  }
  .jf-tagline-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .jf-tagline {
    font-family: 'Cormorant Garamond', serif;
    font-size: 14px;
    font-style: italic;
    font-weight: 400;
    letter-spacing: 0.12em;
    color: rgba(232,200,122,0.7);
  }
  .jf-tagline-gem {
    font-size: 7px;
    color: var(--jf-gold);
    opacity: 0.4;
  }
`