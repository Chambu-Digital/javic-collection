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
  title: 'JAVIC COLLECTION - Premium Inner Wear & Sleepwear | +254 706 512 984',
  description: 'Kenya\'s trusted clothing store specializing in quality inner wear, sleepwear, pajamas, and intimate apparel. Premium fabrics, comfortable fits, affordable prices. Call +254 706 512 984.',
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
        url: '/javiclogo.png',
        type: 'image/png',
      },
    ],
    apple: '/javiclogo.png',
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
