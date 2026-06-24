'use client'

import { ReactNode, useEffect, useState } from 'react'
import { TableOfContents } from '@/components/docs/toc'
import { ArrowUp } from 'lucide-react'

type DocSection = {
  title: string
  content: ReactNode
}

export function DocPageLayout({
  title,
  subtitle,
  sections,
}: {
  title: string
  subtitle?: string
  sections: DocSection[]
}) {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  return (
    <div className="relative flex gap-12">
      {/* Main content */}
      <div className="doc-content min-w-0 flex-1 max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)] lg:text-lg">
              {subtitle}
            </p>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-16">
          {sections.map((sec, i) => {
            const id = sec.title.toLowerCase().replace(/\s+/g, '-')
            return (
              <section key={i} id={id}>
                <h2 className="mb-6 text-xl font-semibold text-[var(--color-text-primary)] sm:text-2xl">
                  {sec.title}
                </h2>
                <div className="space-y-5 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
                  {sec.content}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      {/* Sidebar - TOC */}
      <aside className="hidden w-64 flex-shrink-0 lg:block">
        <div className="sticky top-24">
          <TableOfContents />
        </div>
      </aside>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] shadow-lg backdrop-blur-md transition-all duration-200 hover:border-[var(--primary)]/30 hover:text-[var(--primary)] hover:shadow-[var(--primary)]/10"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
