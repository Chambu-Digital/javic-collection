import type { Metadata, Viewport } from 'next'
import PosClientLayout from './client-layout'
import Script from 'next/script'

// Viewport configuration for PWA
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#990044',
}

// Metadata only applies when on the POS subdomain.
// The manifest and SW registration are scoped here so the main
// javic.co.ke site never gets the PWA install prompt.
export const metadata: Metadata = {
  title: 'Javic Collection POS',
  description: 'Point of Sale terminal for Javic Collection staff',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Javic POS',
  },
  applicationName: 'Javic POS',
  icons: {
    icon: '/javic-logo1.png',
    apple: '/javic-logo1.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PosClientLayout>{children}</PosClientLayout>
    </>
  )
}
