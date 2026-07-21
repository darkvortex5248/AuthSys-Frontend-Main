'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { DOCS_NAV, getDocPageMeta } from '@/lib/docs-nav'
import {
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  Search,
  Home,
  ChevronRight,
  Slash,
  BookOpen,
} from 'lucide-react'

function useActiveScroll() {
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sidebarRef.current
    if (!el) return
    const active = el.querySelector('[data-active="true"]')
    if (active) {
      active.scrollIntoView({ block: 'center', behavior: 'auto' })
    }
  }, [])

  return sidebarRef
}

function useKeyboardSearch(open: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        open()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])
}

function SidebarCategory({
  cat,
  pathname,
  defaultOpen,
  onNavigate,
  searchQuery,
}: {
  cat: (typeof DOCS_NAV)[number]
  pathname: string
  defaultOpen: boolean
  onNavigate: () => void
  searchQuery?: string
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const isCategoryActive = pathname === cat.href
  const hasActiveChild = cat.pages.some((p) => pathname === p.href)

  useEffect(() => {
    if (searchQuery) {
      const matches = cat.pages.some((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      if (matches) setIsOpen(true)
    }
  }, [searchQuery, cat.pages])

  return (
    <div>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
          isCategoryActive || hasActiveChild
            ? 'text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
        }`}
      >
        <span
          className={`absolute inset-0 rounded-xl transition-colors duration-150 ${
            isCategoryActive || hasActiveChild
              ? 'bg-[var(--accent-tint)]'
              : 'bg-transparent'
          }`}
        />
        <span className="relative z-10 flex h-5 w-5 items-center justify-center">
          <span className="material-symbols-outlined text-[18px]">
            {cat.icon}
          </span>
        </span>
        <span className="relative z-10 flex-1 text-left text-xs font-semibold">
          {cat.title}
        </span>
        <span
          className="relative z-10 transition-transform duration-150"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <ChevronDown className="h-3 w-3 opacity-40" />
        </span>
      </button>

      <div
        className="transition-all duration-200 ease-out overflow-hidden"
        style={{
          maxHeight: isOpen ? `${cat.pages.length * 40 + 8}px` : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-[var(--color-border)] pl-3">
          {cat.pages.map((page) => {
            const isPageActive = pathname === page.href
            return (
              <div key={page.href}>
                <Link
                  href={page.href}
                  data-active={isPageActive ? 'true' : undefined}
                  onClick={onNavigate}
                  className={`group relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-all duration-150 ${
                    isPageActive
                      ? 'font-medium text-[var(--primary)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <span
                    className={`absolute inset-0 rounded-lg transition-colors duration-150 ${
                      isPageActive
                        ? 'bg-[var(--accent-tint)]'
                        : 'bg-transparent'
                    }`}
                  />
                  {isPageActive && (
                    <span className="absolute -left-[13.5px] top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[var(--primary)]" />
                  )}
                  <span className="relative z-10">{page.title}</span>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SearchDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [open])

  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  const allPages = useMemo(
    () =>
      DOCS_NAV.flatMap((cat) =>
        cat.pages.map((p) => ({ ...p, category: cat.title, catHref: cat.href })),
      ),
    [],
  )

  const filtered = useMemo(
    () =>
      query
        ? allPages.filter(
            (p) =>
              p.title.toLowerCase().includes(query.toLowerCase()) ||
              p.category.toLowerCase().includes(query.toLowerCase()),
          )
        : allPages.slice(0, 8),
    [query, allPages],
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-4 top-[12%] z-[110] mx-auto h-fit max-w-[580px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-2xl shadow-black/40 sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search documentation..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full border-0 border-b border-[var(--color-border)] bg-transparent py-4 pl-11 pr-4 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none"
              />
            </div>
            <div className="max-h-[320px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Search className="h-8 w-8 text-[var(--color-text-muted)]/40" />
                  <p className="text-sm text-[var(--color-text-muted)]">
                    No results found
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]/60">
                    Try a different search term
                  </p>
                </div>
              ) : (
                filtered.map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-[var(--accent-tint)]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-bg-base)] text-[10px] font-semibold text-[var(--color-text-muted)]">
                      <BookOpen className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex-1">
                      <span className="text-[var(--color-text-primary)]">
                        {page.title}
                      </span>
                      <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                        in {page.category}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)]/40">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))
              )}
            </div>
            <div className="flex items-center gap-3 border-t border-[var(--color-border)] px-4 py-2.5">
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]/60">
                <kbd className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-base)] px-1.5 py-0.5 text-[10px] font-mono">
                  ↑↓
                </kbd>
                <span>navigate</span>
              </span>
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]/60">
                <kbd className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-base)] px-1.5 py-0.5 text-[10px] font-mono">
                  esc
                </kbd>
                <span>close</span>
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const sidebarRef = useActiveScroll()
  const meta = getDocPageMeta(pathname)

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])
  useKeyboardSearch(openSearch)

  const filteredNav = useMemo(
    () =>
      DOCS_NAV.map((cat) => ({
        ...cat,
        pages: cat.pages.filter((p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      })).filter(
        (cat) =>
          cat.pages.length > 0 ||
          cat.title.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery],
  )

  useEffect(() => {
    if (!sidebarOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  const isOverview = pathname === '/docs'

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg-base)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)] lg:hidden"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
            <Link
              href="/docs"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)]">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight">
                AuthSys
                <span className="ml-1.5 text-[11px] font-medium text-[var(--color-text-muted)]">
                  Docs
                </span>
              </span>
            </Link>
            {meta && !isOverview && (
              <div className="hidden items-center gap-1.5 sm:flex">
                <Slash className="h-3.5 w-3.5 text-[var(--color-text-muted)]/30" />
                <Link
                  href="/docs"
                  className="text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  Docs
                </Link>
                <ChevronRight className="h-3 w-3 text-[var(--color-text-muted)]/30" />
                <Link
                  href={meta.category.href}
                  className="text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  {meta.category.title}
                </Link>
                {meta.page.href !== meta.category.href && (
                  <>
                    <ChevronRight className="h-3 w-3 text-[var(--color-text-muted)]/30" />
                    <span className="text-xs font-medium text-[var(--color-text-primary)]">
                      {meta.page.title}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openSearch}
              className="flex h-8 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 text-xs text-[var(--color-text-muted)] transition-all duration-150 hover:border-[var(--color-border)]/50 hover:text-[var(--color-text-primary)] sm:w-48 lg:w-56"
            >
              <Search className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Search docs...</span>
              <span className="ml-auto hidden items-center gap-0.5 sm:flex">
                <kbd className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-base)] px-1.5 py-0.5 text-[9px] font-mono">
                  ⌘
                </kbd>
                <kbd className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-base)] px-1.5 py-0.5 text-[9px] font-mono">
                  K
                </kbd>
              </span>
            </button>
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)]"
              aria-label="Home"
            >
              <Home className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="relative flex gap-8 lg:gap-12">
          {/* Mobile overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Sidebar */}
          <aside
            ref={sidebarRef}
            className={`fixed left-0 top-14 z-40 flex h-[calc(100vh-56px)] w-[280px] flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-surface)] transition-transform duration-250 ease-out lg:sticky lg:top-14 lg:z-auto lg:h-[calc(100vh-56px)] lg:border-r lg:bg-transparent ${
              sidebarOpen
                ? 'translate-x-0'
                : '-translate-x-full lg:translate-x-0'
            }`}
          >
            {/* Search input */}
            <div className="flex-shrink-0 border-b border-[var(--color-border)] px-3 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="Filter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] py-2 pl-9 pr-3 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-all duration-150 focus:border-[var(--primary)]/30"
                />
              </div>
            </div>

            {/* Scrollable nav */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
              {filteredNav.map((cat) => {
                const hasActiveChild = cat.pages.some(
                  (p) => pathname === p.href,
                )
                return (
                  <SidebarCategory
                    key={cat.href}
                    cat={cat}
                    pathname={pathname}
                    defaultOpen={
                      searchQuery
                        ? true
                        : hasActiveChild || pathname === cat.href
                    }
                    onNavigate={() => setSidebarOpen(false)}
                    searchQuery={searchQuery}
                  />
                )
              })}
            </nav>
          </aside>

          {/* Main content area — instant, no animations */}
          <main
            key={pathname}
            className="min-w-0 flex-1 py-8 lg:py-12"
            style={{ viewTransitionName: 'page-content' }}
          >
            {children}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-xs text-[var(--color-text-muted)]">
              &copy; {new Date().getFullYear()} AuthSys Security Platform. All
              rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className="text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Search dialog */}
      <SearchDialog open={searchOpen} onClose={closeSearch} />
    </div>
  )
}
