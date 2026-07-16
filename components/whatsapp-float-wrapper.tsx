'use client'

import { usePathname } from 'next/navigation'
import WhatsAppFloat from '@/components/whatsapp-float'

// Suppress the WhatsApp button on the POS — it's a staff-only terminal,
// not a customer-facing storefront, and the component causes hydration
// mismatches when it appears after a redirect from /pos routes.
export default function WhatsAppFloatWrapper() {
  const pathname = usePathname()
  if (pathname.startsWith('/pos')) return null
  return <WhatsAppFloat />
}
