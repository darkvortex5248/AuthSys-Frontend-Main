'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type TOCItem = {
  id: string
  text: string
  level: number
}

export function TableOfContents() {
  const [items, setItems] = useState<TOCItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const headings = document.querySelectorAll(
      '.doc-content h2, .doc-content h3',
    )
    const tocItems: TOCItem[] = Array.from(headings).map((h) => ({
      id: h.id || h.textContent?.toLowerCase().replace(/\s+/g, '-') || '',
      text: h.textContent || '',
      level: h.tagName === 'H2' ? 2 : 3,
    }))

    tocItems.forEach((item) => {
      if (item.id) {
        const el = document.getElementById(item.id)
        if (!el) {
          const heading = Array.from(headings).find(
            (h) => h.textContent === item.text,
          )
          if (heading) {
            heading.id = item.id
          }
        }
      }
    })

    setItems(tocItems)
  }, [])

  useEffect(() => {
    if (items.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 },
    )

    items.forEach((item) => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <nav className="w-full">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)] mb-4">
        On this page
      </h3>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault()
                const el = document.getElementById(item.id)
                if (el) {
                  el.scrollIntoView({ behavior: 'auto', block: 'start' })
                  history.replaceState(null, '', `#${item.id}`)
                }
              }}
              className={`group relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-all duration-200 ${
                activeId === item.id
                  ? 'text-[var(--primary)] font-medium'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
              style={{ paddingLeft: item.level === 3 ? '1.75rem' : '0.75rem' }}
            >
              {activeId === item.id && (
                <motion.div
                  layoutId="toc-active"
                  className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[var(--primary)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative">{item.text}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
