'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PosPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to make-sale page by default
    router.push('/pos/make-sale')
  }, [router])

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
    </div>
  )
}
