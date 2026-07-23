import type { Metadata } from 'next'
import PosClientLayout from './client-layout'

// Metadata only applies when on the POS subdomain.
// The manifest and SW registration are scoped here so the main
// javic.co.ke site never gets the PWA install prompt.
export const metadata: Metadata = {
  title: 'Javic Collection POS',
  description: 'Point of Sale terminal for Javic Collection staff',
  manifest: '/manifest.json',
}

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return <PosClientLayout>{children}</PosClientLayout>
}
