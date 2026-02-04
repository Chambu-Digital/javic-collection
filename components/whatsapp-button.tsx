'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { openWhatsAppChat } from '@/lib/whatsapp-service'

interface WhatsAppButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
  businessPhone?: string
}

export default function WhatsAppButton({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  businessPhone,
}: WhatsAppButtonProps) {
  return (
    <Button
      onClick={() => openWhatsAppChat(businessPhone)}
      className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
      size={size}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      {children || 'Chat on WhatsApp'}
    </Button>
  )
}
