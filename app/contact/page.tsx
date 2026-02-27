'use client'

import { useState } from 'react'
import { MessageCircle, Mail, Phone, MapPin, Clock, Send } from 'lucide-react'
import Breadcrumb from '@/components/breadcrumb'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { useToast } from '@/components/ui/custom-toast'
import Link from 'next/link'

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))
    console.log('Form submitted:', formData)
    toast.success('Thank you for your message! We will get back to you soon.')
    setFormData({ name: '', email: '', subject: '', message: '' })
    setSubmitting(false)
  }

  const handleWhatsAppClick = () => {
    const msg = encodeURIComponent(`Hello JAVIC COLLECTION!\n\nI am interested in your products and would love to know more.\n\nThank you!`)
    window.open(`https://wa.me/254706512984?text=${msg}`, '_blank')
  }

  const contactInfo = [
    { icon: Phone,          title: 'Call Us',   detail: '+254 706 512 984',               href: 'tel:+254706512984',                    accent: 'blue' },
    { icon: MessageCircle,  title: 'WhatsApp',  detail: '+254 706 512 984',               href: 'https://wa.me/254706512984',           accent: 'green' },
    { icon: Mail,           title: 'Email',     detail: 'sales@javiccollection.co.ke',    href: 'mailto:sales@javiccollection.co.ke',   accent: 'magenta' },
    { icon: MapPin,         title: 'Visit Us',  detail: 'Agro House, Moi Ave, 1st Fl Rm 35', href: '#',                               accent: 'gold' },
  ]

  const faqs = [
    { q: 'Free Delivery?',        a: 'Free delivery within Nairobi for orders above KSh 10,000.' },
    { q: 'Fitting Consultation?', a: 'Professional sizing advice available for all intimate apparel.' },
    { q: 'Warranty Support?',     a: 'All products carry manufacturer warranties plus our own guarantee.' },
  ]

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Contact', href: '/contact' }
  ]

  return (
    <>
      <style>{contactStyles}</style>
      <div className="cp-root">
        <Header />

        <main className="cp-main">

          {/* Breadcrumb */}
          <div className="cp-breadcrumb-bar">
            <div className="cp-container"><Breadcrumb items={breadcrumbItems} /></div>
          </div>

          {/* ── HERO ── */}
          <section className="cp-hero">
            <div className="cp-hero-orb left"  aria-hidden="true" />
            <div className="cp-hero-orb right" aria-hidden="true" />
            <div className="cp-hero-inner">
              <div className="cp-eyebrow">
                <span className="cp-eyebrow-line" />
                <span className="cp-eyebrow-text">We'd Love to Hear From You</span>
                <span className="cp-eyebrow-line" />
              </div>
              <h1 className="cp-hero-title">Get in <em>Touch</em></h1>
              <div className="cp-divider">
                <span className="cp-div-line" />
                <span className="cp-div-gem"></span>
              </div>
              <p className="cp-hero-sub">Questions about our products? Need sizing help? We're here for you.</p>
            </div>
          </section>

          {/* ── CONTACT CARDS ── */}
          <section className="cp-cards-section">
            <div className="cp-container">
              <div className="cp-cards-grid">
                {contactInfo.map((c, i) => {
                  const Icon = c.icon
                  return (
                    <a
                      key={i}
                      href={c.href}
                      target={c.href.startsWith('http') ? '_blank' : undefined}
                      className={`cp-contact-card accent-${c.accent}`}
                      style={{ animationDelay: `${i * 0.08}s` }}
                    >
                      <div className="cp-card-icon"><Icon size={20} /></div>
                      <h3 className="cp-card-title">{c.title}</h3>
                      <p className="cp-card-detail">{c.detail}</p>
                      <div className="cp-card-bar" />
                    </a>
                  )
                })}
              </div>
            </div>
          </section>

          {/* ── FORM + SIDEBAR ── */}
          <section className="cp-body-section">
            <div className="cp-container cp-two-col">

              {/* Contact form */}
              <div className="cp-form-card">
                <div className="cp-form-header">
                  <span className="cp-form-gem"></span>
                  <h2 className="cp-form-title">Send Us a Message</h2>
                </div>

                <form onSubmit={handleSubmit} className="cp-form">
                  <div className="cp-form-row">
                    <div className="cp-field">
                      <label className="cp-label">Your Name</label>
                      <input
                        type="text" name="name" value={formData.name}
                        onChange={handleChange} placeholder="Jane Doe"
                        required className="cp-input"
                      />
                    </div>
                    <div className="cp-field">
                      <label className="cp-label">Email Address</label>
                      <input
                        type="email" name="email" value={formData.email}
                        onChange={handleChange} placeholder="you@example.com"
                        required className="cp-input"
                      />
                    </div>
                  </div>

                  <div className="cp-field">
                    <label className="cp-label">Subject</label>
                    <input
                      type="text" name="subject" value={formData.subject}
                      onChange={handleChange} placeholder="What's this about?"
                      required className="cp-input"
                    />
                  </div>

                  <div className="cp-field">
                    <label className="cp-label">Message</label>
                    <textarea
                      name="message" value={formData.message}
                      onChange={handleChange} rows={5}
                      placeholder="Tell us what's on your mind…"
                      required className="cp-textarea"
                    />
                  </div>

                  <button type="submit" disabled={submitting} className="cp-submit-btn">
                    <span className="cp-submit-inner">
                      {submitting
                        ? <><span className="cp-spinner" /> Sending…</>
                        : <><Send size={14} /> Send Message</>
                      }
                    </span>
                    <span className="cp-submit-shimmer" />
                  </button>
                </form>
              </div>

              {/* Sidebar */}
              <div className="cp-sidebar">

                {/* Hours */}
                <div className="cp-sidebar-card dark">
                  <div className="cp-sidebar-card-header">
                    <h3 className="cp-sidebar-title">Business Hours</h3>
                  </div>
                  <div className="cp-hours-list">
                    {[
                      ['Mon – Fri', '8:00 AM – 6:00 PM'],
                      ['Saturday',  '9:00 AM – 5:00 PM'],
                      ['Sunday',    '10:00 AM – 4:00 PM'],
                    ].map(([day, hrs]) => (
                      <div key={day} className="cp-hours-row">
                        <span className="cp-hours-day">{day}</span>
                        <span className="cp-hours-time">{hrs}</span>
                      </div>
                    ))}
                  </div>
                </div>


                {/* Mini CTA */}
                

              </div>
            </div>
          </section>

        </main>

        {/* ── FLOATING WHATSAPP ── */}
        <button onClick={handleWhatsAppClick} className="cp-whatsapp-fab" title="Chat on WhatsApp">
          <MessageCircle size={24} />
          <span className="cp-wa-pulse" aria-hidden="true" />
        </button>

        <Footer />
      </div>
    </>
  )
}

const contactStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Josefin+Sans:wght@200;300;400&display=swap');

  :root {
    --cp-pink:    #FF0080;
    --cp-magenta: #CC0066;
    --cp-deep:    #990044;
    --cp-gold:    #E8C87A;
    --cp-gold-lt: #F5DFA0;
  }

  .cp-root { display: flex; flex-direction: column; min-height: 100vh; background: #fff; }
  .cp-main { flex: 1; }
  .cp-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

  .cp-breadcrumb-bar {
    background: #fdf5f9;
    border-bottom: 1px solid rgba(232,200,122,0.18);
    padding: 12px 0;
  }

  /* ── HERO ── */
  .cp-hero {
    position: relative;
    background: linear-gradient(160deg, #1a0010 0%, #2d0020 50%, #1a0010 100%);
    padding: 64px 24px 56px;
    text-align: center;
    overflow: hidden;
  }
  .cp-hero-orb {
    position: absolute; width: 360px; height: 360px;
    border-radius: 50%; pointer-events: none; opacity: 0.12;
  }
  .cp-hero-orb.left  { top: -100px; left: -80px;  background: radial-gradient(circle, var(--cp-pink),    transparent 70%); }
  .cp-hero-orb.right { bottom: -80px; right: -80px; background: radial-gradient(circle, var(--cp-magenta), transparent 70%); }
  .cp-hero-inner { position: relative; z-index: 1; }

  .cp-eyebrow {
    display: inline-flex; align-items: center; gap: 10px; margin-bottom: 12px;
  }
  .cp-eyebrow-line { display: block; width: 28px; height: 1px; background: var(--cp-gold); opacity: 0.6; }
  .cp-eyebrow-text {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400; font-size: 12px; letter-spacing: 0.32em;
    text-transform: uppercase; color: var(--cp-gold);
  }
  .cp-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700; font-size: clamp(2.4rem, 5vw, 4rem);
    color: white; margin: 0 0 14px; line-height: 1.05;
  }
  .cp-hero-title em { font-style: italic; color: var(--cp-gold-lt); }
  .cp-divider { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 14px; }
  .cp-div-line { display: block; width: 52px; height: 1px; background: linear-gradient(90deg, transparent, var(--cp-gold)); }
  .cp-div-line:last-child { background: linear-gradient(270deg, transparent, var(--cp-gold)); }
  .cp-div-gem { font-size: 9px; color: var(--cp-gold); }
  .cp-hero-sub {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 15px; letter-spacing: 0.1em; color: rgba(255,255,255,0.75);
  }

  /* ── CONTACT CARDS ── */
  .cp-cards-section {
    padding: 48px 0 0;
    background: white;
  }
  .cp-cards-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
  @media (min-width: 768px) { .cp-cards-grid { grid-template-columns: repeat(4, 1fr); } }

  .cp-contact-card {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    background: white; border: 1px solid rgba(232,200,122,0.2); border-radius: 10px;
    padding: 24px 16px 20px; text-decoration: none;
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s;
    position: relative; overflow: hidden;
    animation: cpFadeUp 0.45s ease backwards;
  }
  @keyframes cpFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .cp-contact-card:hover {
    transform: translateY(-4px);
    border-color: rgba(232,200,122,0.5);
    box-shadow: 0 10px 32px rgba(153,0,68,0.1);
  }

  .cp-card-icon {
    width: 48px; height: 48px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 12px; color: white;
    transition: box-shadow 0.3s ease;
  }
  .accent-blue    .cp-card-icon { background: linear-gradient(135deg, #3b82f6, #1d4ed8); box-shadow: 0 4px 14px rgba(59,130,246,0.3); }
  .accent-green   .cp-card-icon { background: linear-gradient(135deg, #22c55e, #16a34a); box-shadow: 0 4px 14px rgba(34,197,94,0.3); }
  .accent-magenta .cp-card-icon { background: linear-gradient(135deg, var(--cp-magenta), var(--cp-pink)); box-shadow: 0 4px 14px rgba(255,0,128,0.3); }
  .accent-gold    .cp-card-icon { background: linear-gradient(135deg, #d97706, #b45309); box-shadow: 0 4px 14px rgba(217,119,6,0.3); }

  .cp-contact-card:hover .cp-card-icon { box-shadow: 0 6px 20px rgba(153,0,68,0.25); }

  .cp-card-title {
    font-family: 'Josefin Sans', sans-serif; font-weight: 500;
    font-size: 12px; letter-spacing: 0.25em; text-transform: uppercase;
    color: var(--cp-magenta); margin: 0 0 5px;
  }
  .cp-card-detail {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 14px; letter-spacing: 0.04em; color: #1A0010; margin: 0;
  }
  .cp-card-bar {
    height: 2px; width: 0; background: linear-gradient(90deg, var(--cp-gold), var(--cp-pink));
    border-radius: 1px; margin-top: 14px;
    transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
  }
  .cp-contact-card:hover .cp-card-bar { width: 60%; }

  /* ── BODY ── */
  .cp-body-section { padding: 40px 0 72px; background: white; }
  .cp-two-col {
    display: grid; grid-template-columns: 1fr;
    gap: 32px;
  }
  @media (min-width: 768px) { .cp-two-col { grid-template-columns: 1.35fr 1fr; gap: 40px; } }

  /* Form card */
  .cp-form-card {
    background: white; border: 1px solid rgba(232,200,122,0.22);
    border-radius: 14px; overflow: hidden;
    box-shadow: 0 4px 24px rgba(153,0,68,0.07);
  }
  .cp-form-header {
    display: flex; align-items: center; gap: 10px;
    padding: 20px 24px 16px;
    border-bottom: 1px solid rgba(232,200,122,0.18);
    background: linear-gradient(90deg, rgba(255,0,128,0.03), transparent);
  }
  .cp-form-gem { font-size: 8px; color: var(--cp-gold); }
  .cp-form-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700; font-size: 22px; color: #1a0010; margin: 0;
  }
  .cp-form { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
  .cp-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 480px) { .cp-form-row { grid-template-columns: 1fr; } }

  .cp-field { display: flex; flex-direction: column; gap: 5px; }
  .cp-label {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--cp-magenta);
  }
  .cp-input, .cp-textarea {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 15px; letter-spacing: 0.03em;
    background: #f9f9f9; border: 1px solid rgba(232,200,122,0.3);
    border-radius: 3px; padding: 10px 14px; color: #1A0010;
    outline: none; transition: all 0.25s ease;
    width: 100%; box-sizing: border-box;
  }
  .cp-input::placeholder, .cp-textarea::placeholder { color: #bbb; }
  .cp-input:focus, .cp-textarea:focus {
    border-color: var(--cp-magenta);
    background: white;
    box-shadow: 0 0 0 3px rgba(204,0,102,0.07);
  }
  .cp-textarea { resize: none; }

  /* Submit */
  .cp-submit-btn {
    position: relative; overflow: hidden; background: none;
    border: none; padding: 0; cursor: pointer; width: 100%;
  }
  .cp-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .cp-submit-inner {
    display: flex; align-items: center; justify-content: center;
    gap: 8px; width: 100%; padding: 14px;
    background: linear-gradient(135deg, var(--cp-magenta) 0%, var(--cp-pink) 50%, var(--cp-magenta) 100%);
    background-size: 200% 100%;
    border-radius: 2px;
    font-family: 'Josefin Sans', sans-serif; font-weight: 500;
    font-size: 13px; letter-spacing: 0.28em; text-transform: uppercase;
    color: white; transition: all 0.35s ease;
    position: relative; z-index: 1;
  }
  .cp-submit-btn:not(:disabled):hover .cp-submit-inner {
    background-position: 100% 0;
    box-shadow: 0 4px 20px rgba(255,0,128,0.4);
    transform: translateY(-1px);
  }
  .cp-submit-shimmer {
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
    transform: skewX(-20deg); transition: left 0.55s ease;
  }
  .cp-submit-btn:not(:disabled):hover .cp-submit-shimmer { left: 150%; }
  .cp-spinner {
    display: inline-block; width: 13px; height: 13px;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
    border-radius: 50%; animation: cpSpin 0.7s linear infinite;
  }
  @keyframes cpSpin { to { transform: rotate(360deg); } }

  /* ── SIDEBAR ── */
  .cp-sidebar { display: flex; flex-direction: column; gap: 18px; }

  .cp-sidebar-card {
    border-radius: 12px; overflow: hidden;
    border: 1px solid rgba(232,200,122,0.18);
  }
  .cp-sidebar-card.dark {
    background: linear-gradient(160deg, #1a0010, #2d0020);
  }
  .cp-sidebar-card.light {
    background: white;
  }

  .cp-sidebar-card-header {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 20px 12px;
    border-bottom: 1px solid rgba(232,200,122,0.12);
  }
  .cp-sidebar-card-header.light {
    border-bottom-color: rgba(232,200,122,0.2);
    background: linear-gradient(90deg, rgba(255,0,128,0.02), transparent);
  }
  .cp-sidebar-icon { color: var(--cp-gold); flex-shrink: 0; }
  .cp-sidebar-gem  { font-size: 7px; color: var(--cp-gold); }
  .cp-sidebar-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700; font-size: 19px; color: white; margin: 0;
  }
  .cp-sidebar-title.dark { color: #1a0010; }

  /* Hours */
  .cp-hours-list { padding: 12px 20px 16px; display: flex; flex-direction: column; gap: 0; }
  .cp-hours-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .cp-hours-row:last-child { border-bottom: none; }
  .cp-hours-day {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 12px; letter-spacing: 0.1em; color: var(--cp-gold);
    text-transform: uppercase;
  }
  .cp-hours-time {
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
    font-size: 14px; color: rgba(255,255,255,0.75); letter-spacing: 0.04em;
  }

  /* FAQ */
  .cp-faq-list { padding: 14px 20px 18px; display: flex; flex-direction: column; gap: 14px; }
  .cp-faq-item { border-bottom: 1px solid rgba(232,200,122,0.12); padding-bottom: 14px; }
  .cp-faq-item:last-child { border-bottom: none; padding-bottom: 0; }
  .cp-faq-q {
    font-family: 'Cormorant Garamond', serif; font-weight: 600;
    font-size: 15px; color: #1a0010; margin: 0 0 4px;
  }
  .cp-faq-a {
    font-family: 'Josefin Sans', sans-serif; font-weight: 300;
    font-size: 12px; color: #888; letter-spacing: 0.04em;
    line-height: 1.65; margin: 0;
  }

  /* Mini CTA */
  .cp-mini-cta {
    background: linear-gradient(135deg, #1a0010, #2d0020);
    border: 1px solid rgba(232,200,122,0.2);
    border-radius: 12px; padding: 20px 20px 20px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; flex-wrap: wrap;
  }
  .cp-mini-cta-text {
    font-family: 'Josefin Sans', sans-serif; font-weight: 300;
    font-size: 12px; letter-spacing: 0.1em; color: rgba(255,255,255,0.55);
    margin: 0;
  }
  .cp-mini-cta-btn {
    position: relative; overflow: hidden; background: none; border: none; padding: 0; cursor: pointer;
  }
  .cp-mini-cta-btn .cp-submit-inner {
    padding: 10px 24px; font-size: 10px; letter-spacing: 0.25em;
    background: linear-gradient(135deg, var(--cp-magenta), var(--cp-pink));
    background-size: 200% 100%;
    border: 1px solid rgba(232,200,122,0.3);
    border-radius: 2px; justify-content: center;
  }
  .cp-mini-cta-btn:hover .cp-submit-inner {
    background-position: 100% 0;
    border-color: var(--cp-gold);
    box-shadow: 0 4px 16px rgba(255,0,128,0.3);
    transform: translateY(-1px);
  }
  .cp-cta-arrow { font-size: 14px; color: var(--cp-gold-lt); transition: transform 0.3s; }
  .cp-mini-cta-btn:hover .cp-cta-arrow { transform: translateX(3px); }

  /* ── WHATSAPP FAB ── */
  .cp-whatsapp-fab {
    position: fixed; bottom: 24px; right: 24px; z-index: 50;
    width: 56px; height: 56px; border-radius: 50%;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: white;
    box-shadow: 0 6px 24px rgba(34,197,94,0.4), 0 2px 8px rgba(0,0,0,0.15);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    overflow: visible;
  }
  .cp-whatsapp-fab:hover {
    transform: scale(1.08) translateY(-2px);
    box-shadow: 0 10px 32px rgba(34,197,94,0.55), 0 4px 12px rgba(0,0,0,0.2);
  }
  .cp-wa-pulse {
    position: absolute;
    width: 56px; height: 56px; border-radius: 50%;
    border: 2px solid rgba(34,197,94,0.5);
    animation: cpWaPulse 2s ease-out infinite;
  }
  @keyframes cpWaPulse {
    0%   { transform: scale(1);   opacity: 0.8; }
    100% { transform: scale(1.7); opacity: 0; }
  }
`