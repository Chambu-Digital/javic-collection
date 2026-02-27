import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ToastProvider } from '@/components/ui/custom-toast'
import GoogleOAuthProvider from '@/components/providers/google-oauth-provider'
import './globals.css'

const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'JAVIC COLLECTION - Premium Lingerie, Sleepwear & Innerwear | +254 706 512 984',
  description: 'Kenya\'s premier fashion destination for luxury lingerie, sleepwear, innerwear, and sportswear. Premium fabrics, elegant designs, perfect fits. Experience comfort and style. Call +254 706 512 984.',
  generator: 'v0.app',
  verification: {
    google: 'KO8RUPFOnU-K9AlHfBWRRcuYQG6jIrs9yihNFWfJ-yY',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${dmSans.variable} font-sans antialiased leading-relaxed`}>
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
