'use client'

import dynamic from 'next/dynamic'
import { SwRegistration } from '@/components/service-worker-registration'

// Render the entire POS shell only on the client — eliminates hydration
// mismatches from zustand/persist reading localStorage before SSR settles.
const PosShell = dynamic(() => import('@/components/pos/pos-shell'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
    </div>
  ),
})

export default function PosClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Register the POS service worker only within the POS layout */}
      <SwRegistration />
      <PosShell>{children}</PosShell>
    </>
  )
}
