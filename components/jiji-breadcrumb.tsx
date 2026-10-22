'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface JijiBreadcrumbProps {
  items?: BreadcrumbItem[]
  customItems?: BreadcrumbItem[]
}

export default function JijiBreadcrumb({ items, customItems }: JijiBreadcrumbProps) {
  const pathname = usePathname()

  // Generate breadcrumbs from pathname if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems && customItems.length > 0) {
      return customItems
    }

    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    segments.forEach((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/')
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      // Don't add as link if it's the last segment (current page)
      if (index === segments.length - 1) {
        breadcrumbs.push({ label })
      } else {
        breadcrumbs.push({ label, href })
      }
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Don't show breadcrumb on home page
  if (pathname === '/') {
    return null
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
        <div className="flex items-center gap-2">
          {/* Home Icon */}
          <Link
            href="/"
            className="text-gray-600 hover:text-[#1E90FF] transition-colors"
            aria-label="Home"
          >
            <Home className="w-5 h-5" />
          </Link>

          {/* Breadcrumb Items */}
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-gray-400" />

              {item.href ? (
                <Link
                  href={item.href}
                  className="text-gray-600 hover:text-[#1E90FF] transition-colors font-medium text-sm"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-900 font-semibold text-sm">
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}
