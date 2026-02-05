import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ToastProvider } from '@/components/ui/custom-toast'
import GoogleOAuthProvider from '@/components/providers/google-oauth-provider'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'JAVIC COLLECTION - Premium Electronics & Appliances',
  description: 'Your trusted electronics store for fridges, microwaves, TVs, smartphones, and all electronic appliances. Quality products with excellent service.',
  generator: 'v0.app',
  verification: {
    google: 'KO8RUPFOnU-K9AlHfBWRRcuYQG6jIrs9yihNFWfJ-yY',
  },
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/electromatt-icon-only.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/electromatt-icon-only.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased leading-relaxed`}>
        <GoogleOAuthProvider>
          <ToastProvider>
            {children}
            <Analytics />
          </ToastProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}
