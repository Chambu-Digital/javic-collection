'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { useUserStore } from '@/lib/user-store'
import type { ICampaign, VisibilityPage, AudienceTarget, DisplayFrequency } from '@/models/Campaign'

// ── localStorage helpers ──────────────────────────────────────────────────────

function getVisitorId(): string {
  const key = 'javic_visitor_id'
  let id = localStorage.getItem(key)
  if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(key, id) }
  return id
}

function isFirstVisit(): boolean {
  const key = 'javic_visit_recorded'
  const first = !localStorage.getItem(key)
  if (first) localStorage.setItem(key, '1')
  return first
}

const FREQ_MS: Record<DisplayFrequency, number | null> = {
  every_visit: 0,
  once_per_session: -1,
  once_per_day: 86400000,
  once_per_3_days: 259200000,
  once_per_7_days: 604800000,
  only_once: Infinity,
}

function shouldShow(campaign: ICampaign & { _id: string }): boolean {
  const freq = campaign.visibility?.frequency ?? 'every_visit'
  const ms = FREQ_MS[freq]
  if (ms === 0) return true
  if (ms === -1) {
    // once_per_session — use sessionStorage
    const key = `javic_camp_${campaign._id}_session`
    if (sessionStorage.getItem(key)) return false
    return true
  }
  const key = `javic_camp_${campaign._id}_shown`
  const last = localStorage.getItem(key)
  if (!last) return true
  if (ms === Infinity) return false
  return Date.now() - Number(last) >= ms
}

function recordShown(campaign: ICampaign & { _id: string }) {
  const freq = campaign.visibility?.frequency ?? 'every_visit'
  if (freq === 'every_visit') return
  if (freq === 'once_per_session') {
    sessionStorage.setItem(`javic_camp_${campaign._id}_session`, '1')
  } else {
    localStorage.setItem(`javic_camp_${campaign._id}_shown`, String(Date.now()))
  }
}

function recordDismiss(campaign: ICampaign & { _id: string }) {
  const freq = campaign.visibility?.frequency ?? 'every_visit'
  if (freq === 'once_per_session') {
    sessionStorage.setItem(`javic_camp_${campaign._id}_session`, '1')
  } else if (freq !== 'every_visit') {
    localStorage.setItem(`javic_camp_${campaign._id}_shown`, String(Date.now()))
  }
}

// ── Page matching ─────────────────────────────────────────────────────────────

function resolvePageType(pathname: string): VisibilityPage {
  if (pathname === '/') return 'homepage'
  if (pathname.startsWith('/product/') || pathname.startsWith('/products')) return 'product_pages'
  if (pathname.startsWith('/category') || pathname.startsWith('/categories')) return 'category_pages'
  if (pathname.startsWith('/checkout')) return 'checkout'
  return 'homepage'
}

function matchesPage(pages: VisibilityPage[], pathname: string): boolean {
  if (!pages || pages.length === 0) return true
  if (pages.includes('entire_website')) return true
  return pages.includes(resolvePageType(pathname))
}

function matchesAudience(targets: AudienceTarget[], isLoggedIn: boolean, firstVisit: boolean): boolean {
  if (!targets || targets.length === 0) return true
  if (targets.includes('everyone')) return true
  if (isLoggedIn && targets.includes('logged_in_users')) return true
  if (!isLoggedIn && targets.includes('guests')) return true
  if (firstVisit && targets.includes('first_time_visitors')) return true
  if (!firstVisit && targets.includes('returning_visitors')) return true
  return false
}

// ── Track event ───────────────────────────────────────────────────────────────

function track(campaignId: string, event: 'view' | 'click' | 'dismiss', visitorId: string) {
  fetch('/api/campaigns/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId, event, visitorId }),
  }).catch(() => {})
}

// ── Countdown ─────────────────────────────────────────────────────────────────

function Countdown({ endsAt }: { endsAt: Date }) {
  const [remaining, setRemaining] = useState(Math.max(0, new Date(endsAt).getTime() - Date.now()))
  useEffect(() => {
    if (remaining <= 0) return
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1000)), 1000)
    return () => clearInterval(t)
  }, [remaining])
  if (remaining <= 0) return null
  const s = Math.floor(remaining / 1000)
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <div className="flex gap-1 justify-center text-sm font-mono mt-2">
      {d > 0 && <span className="bg-white/20 px-2 py-1 rounded">{d}d</span>}
      <span className="bg-white/20 px-2 py-1 rounded">{pad(h)}h</span>
      <span className="bg-white/20 px-2 py-1 rounded">{pad(m)}m</span>
      <span className="bg-white/20 px-2 py-1 rounded">{pad(sec)}s</span>
    </div>
  )
}

// ── Single campaign card ──────────────────────────────────────────────────────

type Camp = ICampaign & { _id: string }

function CampaignCard({ campaign, onDismiss }: { campaign: Camp; onDismiss: () => void }) {
  const { display, title, subtitle, description, badge, cta, countdown, coupon, images } = campaign
  const bg = display?.background
  const bgStyle: React.CSSProperties = {
    background:
      bg?.type === 'gradient'
        ? `linear-gradient(${bg.gradientDirection ?? 'to right'}, ${bg.gradientFrom ?? '#5a1e5c'}, ${bg.gradientTo ?? '#9c4a9e'})`
        : bg?.type === 'image' && bg.imageUrl
        ? `url(${bg.imageUrl}) center/cover no-repeat`
        : (bg?.color ?? '#5a1e5c'),
    color: display?.textColor ?? '#ffffff',
  }
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    if (!coupon?.code) return
    navigator.clipboard.writeText(coupon.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  // Get campaign images
  const desktopImg = images?.find(i => i.device === 'desktop')
  const mobileImg = images?.find(i => i.device === 'mobile')
  const carouselImages = images?.filter(i => i.device === 'carousel') || []

  const inner = (
    <div className="relative" style={bgStyle}>
      {display?.overlay !== 'none' && (
        <div className={`absolute inset-0 pointer-events-none ${display?.overlay === 'dark' ? 'bg-black/40' : 'backdrop-blur-sm bg-black/20'}`} />
      )}
      <div className="relative z-10 p-6 text-center space-y-3">
        {/* Campaign Image */}
        {desktopImg && (
          <div className="mb-4">
            <img 
              src={desktopImg.url} 
              alt={desktopImg.alt || title} 
              className="w-full h-auto max-h-48 object-contain mx-auto rounded-lg"
            />
          </div>
        )}
        
        {badge?.type && (
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold bg-white/20 mb-2 shadow-lg">
            {badge.type === 'custom' ? (badge.customText || 'Custom') : badge.type.toUpperCase()}
            {badge.discountValue ? ` ${badge.discountValue}${badge.discountType === 'percentage' ? '%' : ''}` : ''}
          </span>
        )}
        <h2 className="text-2xl font-bold leading-tight">{title}</h2>
        {subtitle && <p className="opacity-95 text-base font-medium">{subtitle}</p>}
        {description && <p className="opacity-85 text-sm leading-relaxed">{description}</p>}
        {countdown?.enabled && countdown.endsAt && <Countdown endsAt={new Date(countdown.endsAt)} />}
        {coupon?.enabled && coupon.code && (
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="font-mono font-bold bg-white/20 px-4 py-2 rounded-lg tracking-widest text-base border border-white/30">{coupon.code}</span>
            <button type="button" onClick={handleCopy} className="text-sm bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors border border-white/30">
              {copied ? (coupon.copyConfirmationText || 'Copied!') : 'Copy'}
            </button>
          </div>
        )}
        {cta?.enabled && cta.text && (
          <a
            href={cta.url}
            target={cta.isExternal ? '_blank' : undefined}
            rel={cta.isExternal ? 'noopener noreferrer' : undefined}
            className="inline-block mt-3 px-8 py-3 bg-white text-gray-900 rounded-full text-base font-semibold hover:bg-white/90 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            {cta.text}
          </a>
        )}
      </div>
      {display?.showCloseButton !== false && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-4 right-4 z-20 opacity-70 hover:opacity-100 transition-opacity bg-black/20 hover:bg-black/40 rounded-full p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )

  const mode = display?.mode ?? 'popup_modal'
  const pos = display?.position ?? 'center'

  // Announcement bar
  if (mode === 'announcement_bar') {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999]" style={bgStyle}>
        {display?.overlay !== 'none' && <div className={`absolute inset-0 pointer-events-none ${display?.overlay === 'dark' ? 'bg-black/40' : 'backdrop-blur-sm bg-black/20'}`} />}
        <div className="relative z-10 px-4 py-2 flex items-center justify-center gap-4 text-sm">
          {badge?.type && <span className="font-bold bg-white/20 px-2 py-0.5 rounded-full text-xs">{badge.type === 'custom' ? badge.customText : badge.type.toUpperCase()}</span>}
          <span className="font-medium">{title}</span>
          {subtitle && <span className="opacity-80">{subtitle}</span>}
          {cta?.enabled && cta.text && <a href={cta.url} target={cta.isExternal ? '_blank' : undefined} rel={cta.isExternal ? 'noopener noreferrer' : undefined} className="underline font-semibold">{cta.text}</a>}
          {display?.showCloseButton !== false && <button type="button" onClick={onDismiss} className="ml-auto opacity-70 hover:opacity-100"><X className="w-4 h-4"/></button>}
        </div>
      </div>
    )
  }

  // Floating card
  if (mode === 'floating_card') {
    const posClass = pos === 'bottom_right' ? 'bottom-6 right-6' : pos === 'bottom_left' ? 'bottom-6 left-6' : pos === 'top' ? 'top-6 right-6' : 'bottom-6 right-6'
    return <div className={`fixed ${posClass} z-[9998] w-80 rounded-xl overflow-hidden shadow-2xl`}>{inner}</div>
  }

  // Slide-in panel
  if (mode === 'slide_in_panel') {
    const posClass = pos === 'bottom_left' ? 'bottom-0 left-0' : pos === 'top' ? 'top-0 right-0' : 'bottom-0 right-0'
    return <div className={`fixed ${posClass} z-[9998] w-80 rounded-t-xl overflow-hidden shadow-2xl`}>{inner}</div>
  }

  // Full screen overlay
  if (mode === 'full_screen_overlay') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={bgStyle}>
        {display?.overlay !== 'none' && <div className={`absolute inset-0 pointer-events-none ${display?.overlay === 'dark' ? 'bg-black/40' : 'backdrop-blur-sm bg-black/20'}`}/>}
        <div className="relative z-10 max-w-lg w-full mx-4 rounded-xl overflow-hidden shadow-2xl">
          {inner}
        </div>
      </div>
    )
  }

  // Hero banner — inline, handled separately
  if (mode === 'hero_banner') {
    return <div className="w-full overflow-hidden">{inner}</div>
  }

  // Default: popup modal
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onDismiss() }}>
      <div className="relative max-w-md w-full rounded-xl overflow-hidden shadow-2xl">
        {inner}
      </div>
    </div>
  )
}

// ── Main renderer ─────────────────────────────────────────────────────────────

export default function CampaignRenderer() {
  const pathname = usePathname()
  const { user } = useUserStore()
  const [visible, setVisible] = useState<Camp[]>([])

  useEffect(() => {
    // Don't render on admin pages
    if (pathname.startsWith('/admin')) return

    const visitorId = getVisitorId()
    const firstVisit = isFirstVisit()
    const isLoggedIn = !!user

    fetch('/api/campaigns/active')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.campaigns) return
        const eligible: Camp[] = (data.campaigns as Camp[])
          .filter(c => matchesPage(c.visibility?.pages, pathname))
          .filter(c => matchesAudience(c.audience?.targets, isLoggedIn, firstVisit))
          .filter(c => shouldShow(c))

        // Apply delays
        eligible.forEach((c, i) => {
          const delay = (c.display?.delaySeconds ?? 0) * 1000
          setTimeout(() => {
            setVisible(prev => {
              if (prev.find(x => x._id === c._id)) return prev
              return [...prev, c]
            })
            recordShown(c)
            track(String(c._id), 'view', visitorId)
          }, delay + i * 300)
        })
      })
      .catch(() => {})
  }, [pathname, user])

  const dismiss = useCallback((id: string) => {
    const visitorId = getVisitorId()
    const c = visible.find(x => String(x._id) === id)
    if (c) { recordDismiss(c); track(id, 'dismiss', visitorId) }
    setVisible(prev => prev.filter(x => String(x._id) !== id))
  }, [visible])

  const handleCtaClick = useCallback((id: string) => {
    track(id, 'click', getVisitorId())
  }, [])

  if (visible.length === 0) return null

  return (
    <>
      {visible.map(c => (
        <div key={String(c._id)} onClick={() => c.cta?.enabled && handleCtaClick(String(c._id))}>
          <CampaignCard campaign={c} onDismiss={() => dismiss(String(c._id))} />
        </div>
      ))}
    </>
  )
}
