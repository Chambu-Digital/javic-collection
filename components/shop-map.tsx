'use client'

import { Navigation } from 'lucide-react'

// Exact coordinates extracted from the provided embed URL
const SHOP_LAT = -4.056806
const SHOP_LNG = 39.670927
const MAPS_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${SHOP_LAT},${SHOP_LNG}`

const EMBED_SRC =
  'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3979.8214298095404!2d39.67092727497559!3d-4.056806195916937!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zNMKwMDMnMjQuNSJTIDM5wrA0MCcyNC42IkU!5e0!3m2!1sen!2ske!4v1784184871674!5m2!1sen!2ske'

interface ShopMapProps {
  /** Height of the iframe. Defaults to 400px */
  height?: number
  /** Show the floating "Get Directions" button. Defaults to true */
  showDirectionsButton?: boolean
  className?: string
}

export default function ShopMap({
  height = 400,
  showDirectionsButton = true,
  className = '',
}: ShopMapProps) {
  const openDirections = () => {
    window.open(MAPS_DIRECTIONS_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-xl ${className}`} style={{ height }}>
      <iframe
        src={EMBED_SRC}
        width="100%"
        height="100%"
        style={{ border: 0, display: 'block' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        title="Javic Collection store location"
      />

      {showDirectionsButton && (
        <button
          onClick={openDirections}
          aria-label="Get directions to Javic Collection"
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: 'linear-gradient(135deg, #CC0066, #FF0080)',
            color: '#fff',
            border: 'none',
            borderRadius: '999px',
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 500,
            fontSize: '13px',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(255,0,128,0.45)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(255,0,128,0.55)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 18px rgba(255,0,128,0.45)'
          }}
        >
          <Navigation size={16} strokeWidth={2.5} />
          Get Directions
        </button>
      )}
    </div>
  )
}

/** Standalone floating button — circular, icon-only, matches WhatsApp FAB style */
export function DirectionsFloatButton() {
  const openDirections = () => {
    window.open(MAPS_DIRECTIONS_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <style>{`
        @keyframes df-pulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(255,0,128,0.45); }
          50%       { box-shadow: 0 6px 28px rgba(255,0,128,0.7); }
        }
        .df-btn { animation: df-pulse 3s ease-in-out infinite; }
        .df-btn:hover {
          transform: scale(1.08) !important;
          animation: none !important;
          box-shadow: 0 6px 22px rgba(255,0,128,0.65) !important;
        }
      `}</style>
      <button
        onClick={openDirections}
        aria-label="Get directions to Javic Collection"
        title="Get directions to our store"
        className="df-btn"
        style={{
          position: 'fixed',
          bottom: '96px',   /* sits above the WhatsApp FAB at 24px */
          right: '24px',
          zIndex: 9998,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #CC0066, #FF0080)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
      >
        {/* MapPin SVG — clearly a location marker, not a message icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="white"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </button>
    </>
  )
}
