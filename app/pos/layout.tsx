'use client'

import dynamic from 'next/dynamic'

// Render the entire POS shell only on the client — this eliminates all
// hydration mismatches caused by zustand/persist reading from localStorage
// and any router.push calls that would happen during SSR.
const PosShell = dynamic(() => import('@/components/pos/pos-shell'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
    </div>
  ),
})

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return <PosShell>{children}</PosShell>
}
