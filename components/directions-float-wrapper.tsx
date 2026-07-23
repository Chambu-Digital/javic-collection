'use client'

import { usePathname } from 'next/navigation'
import { DirectionsFloatButton } from '@/components/shop-map'

// Suppress the directions button on POS and admin routes —
// it's a customer-facing feature, not relevant to staff terminals.
export default function DirectionsFloatWrapper() {
  const pathname = usePathname()
  if (pathname.startsWith('/pos') || pathname.startsWith('/admin')) return null
  return <DirectionsFloatButton />
}
