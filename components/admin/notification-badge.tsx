import { Badge } from '@/components/ui/badge'

interface NotificationBadgeProps {
  count: number
  className?: string
}

export default function NotificationBadge({ count, className = '' }: NotificationBadgeProps) {
  if (count === 0) return null

  return (
    <Badge 
      variant="destructive" 
      className={`
        ml-auto min-w-[18px] h-[18px] px-1 py-0 text-[10px] font-bold
        bg-red-500 hover:bg-red-600 text-white border-red-500 rounded-full
        flex items-center justify-center animate-pulse
        shadow-sm
        ${className}
      `}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  )
}