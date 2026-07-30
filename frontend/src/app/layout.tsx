import type { Metadata, Viewport } from 'next'
import { Geist, JetBrains_Mono, Instrument_Serif } from 'next/font/google'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import ErrorBoundary from '@/components/ErrorBoundary'
import CookieConsent from '@/components/CookieConsent'
import GrainOverlay from '@/components/GrainOverlay'

const geist = Geist({ 
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap',
})

const siteUrl = 'https://authsys.dpdns.org'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'RinoxAuth | Enterprise Authentication & License Management Platform',
    template: '%s | RinoxAuth',
  },
  description: 'Enterprise-grade authentication, license management, and software protection platform. HWID lock, AI-powered threat detection, license keys, and developer SDK for C#, C++, Python, and more. Trusted by developers worldwide.',
  keywords: [
    'RinoxAuth',
    'authentication platform',
    'license management',
    'software protection',
    'HWID lock',
    'license key system',
    'software licensing',
    'developer authentication',
    'API authentication',
    'game authentication',
    'desktop app security',
    'anti-piracy',
    'software license server',
    'HWID authentication',
    'KeyAuth alternative',
    'secure login system',
    'app authentication API',
    'REST API authentication',
    'JWT authentication',
    'license validation',
    'developer SDK',
    'authentication SDK',
    'C# authentication',
    'C++ authentication',
    'Python authentication',
    'Discord bot authentication',
    'Telegram bot authentication',
    'license key management',
    'software licensing platform',
    'enterprise authentication',
    'cloud authentication',
    'modern authentication',
    'developer API',
    'API management',
    'application security',
  ],
  openGraph: {
    title: 'RinoxAuth | Enterprise Authentication & License Management Platform',
    description: 'Enterprise-grade authentication, license management, and software protection platform. HWID lock, AI-powered threat detection, license keys, and developer SDK.',
    url: siteUrl,
    siteName: 'RinoxAuth',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'RinoxAuth - Enterprise Authentication Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RinoxAuth | Enterprise Authentication & License Management Platform',
    description: 'Enterprise-grade authentication, license management, and software protection platform. HWID lock, AI-powered threat detection, license keys, and developer SDK.',
    images: ['/logo.png'],
  },
  alternates: { canonical: siteUrl },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/favicon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

import { Toaster } from '@/components/ui/sonner'
import { ConfirmProvider } from '@/components/ui/confirm-dialog'
import { CopyProvider } from '@/components/ui/copy-dialog'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} dark`} suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="yQWy34X2ldX08euJkZ1lBU6AubTA9Jb1xG-r3HYbneQ" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${geist.className} antialiased`}>
        <ThemeProvider>
            <QueryProvider>
            <AuthProvider>
            <ConfirmProvider>
              <CopyProvider>
                  <ErrorBoundary>
                    <GrainOverlay />
                    <main style={{ viewTransitionName: "page-content" }}>
                      {children}
                    </main>
                  </ErrorBoundary>
                  <CookieConsent />
              <Toaster />
              </CopyProvider>
            </ConfirmProvider>
            </AuthProvider>
            </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
