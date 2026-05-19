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
  title: 'AuthSys — Software License & Auth Platform',
  description: 'License management, HWID locking, AI-powered threat detection.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/favicon.png',
  }
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
