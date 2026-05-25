import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SmoothScroll from '@/components/SmoothScroll'
import PageTransition from '@/components/PageTransition'
import { NextAuthProvider } from '@/components/NextAuthProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://authsys-nyz.vercel.app'),
  title: {
    default: 'AuthSys - Secure Authentication System & Cyber Security Login Platform',
    template: '%s | AuthSys',
  },
  description: 'AuthSys is a modern authentication system and secure login platform offering advanced cyber security features like HWID locking, real-time threat detection, and AI-powered access control. Optimize your software protection with our robust, hacker-friendly auth UI.',
  keywords: [
    'AuthSys',
    'authentication system',
    'secure login platform',
    'cyber security login',
    'modern auth platform',
    'hacker auth UI',
    'secure authentication dashboard',
    'software license management',
    'HWID locking',
    'AI threat detection',
    'API authentication',
    'developer tools',
    'cyberpunk auth',
    'AuthSys platform',
    'authentication service',
    'secure login solution',
    'cyber security platform',
    'modern authentication service',
    'hacker user interface',
    'cyberpunk authentication',
    'developer authentication',
    'API authentication solution',
    'user management system',
    'license key management',
    'HWID protection',
    'AI-powered security',
    'threat detection system',
    'real-time analytics security',
    'software protection',
    'developer tools security',
    'access control system',
    'user authentication API',
    'secure development',
    'anti-piracy solution',
    'game authentication',
    'application security',
    'digital rights management',
    'dev authentication',
    'scalable authentication',
    'high-performance auth',
    'identity and access management',
    'IAM solution',
    'two-factor authentication',
    'multi-factor authentication',
    'MFA solution',
    'SSO solution',
    'single sign-on',
    'user session management',
    'developer SDK',
    'python authentication',
    'csharp authentication',
    'javascript authentication',
    'cpp authentication'
  ],
  openGraph: {
    title: 'AuthSys - Secure Authentication System & Cyber Security Login Platform',
    description: 'AuthSys is a modern authentication system and secure login platform offering advanced cyber security features like HWID locking, real-time threat detection, and AI-powered access control. Optimize your software protection with our robust, hacker-friendly auth UI.',
    url: 'https://authsys-nyz.vercel.app',
    siteName: 'AuthSys',
    images: [
      {
        url: 'https://authsys-nyz.vercel.app/logo.png', // Assuming a logo.png in public directory
        width: 800,
        height: 600,
        alt: 'AuthSys - Secure Authentication Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AuthSys - Secure Authentication System & Cyber Security Login Platform',
    description: 'AuthSys is a modern authentication system and secure login platform offering advanced cyber security features like HWID locking, real-time threat detection, and AI-powered access control. Optimize your software protection with our robust, hacker-friendly auth UI.',
    creator: '@AuthSysOfficial', // Replace with actual Twitter handle if available
    images: ['https://authsys-nyz.vercel.app/logo.png'], // Assuming a logo.png in public directory
  },
  alternates: { canonical: 'https://authsys-nyz.vercel.app', },
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
  themeColor: '#d97757', // Matching the primary orange/amber color
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
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className} 
            style={{ background: '#08080F', color: '#EEEEFF' }}>
        <NextAuthProvider>
          <QueryProvider>
            <ConfirmProvider>
              <CopyProvider>
              <SmoothScroll>
                <PageTransition>
                  {children}
                </PageTransition>
              </SmoothScroll>
              <Toaster />
              </CopyProvider>
            </ConfirmProvider>
          </QueryProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}
