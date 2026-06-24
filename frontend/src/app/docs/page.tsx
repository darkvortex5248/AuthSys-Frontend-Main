'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { DOCS_NAV } from '@/lib/docs-nav'
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  BookOpen,
  MessageCircle,
  ExternalLink,
} from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
}

const CATEGORY_COLORS: Record<
  string,
  { gradient: string; border: string; bg: string }
> = {
  'Getting Started': {
    gradient:
      'linear-gradient(135deg, rgba(109,93,246,0.12) 0%, rgba(109,93,246,0.02) 100%)',
    border: 'border-[var(--primary)]/20',
    bg: 'bg-[var(--primary)]/5',
  },
  Security: {
    gradient:
      'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(239,68,68,0.02) 100%)',
    border: 'border-red-500/20',
    bg: 'bg-red-500/5',
  },
  'SDK Integration': {
    gradient:
      'linear-gradient(135deg, rgba(34,211,238,0.10) 0%, rgba(34,211,238,0.02) 100%)',
    border: 'border-cyan-500/20',
    bg: 'bg-cyan-500/5',
  },
  'API Reference': {
    gradient:
      'linear-gradient(135deg, rgba(251,191,36,0.10) 0%, rgba(251,191,36,0.02) 100%)',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
  },
  'License Keys': {
    gradient:
      'linear-gradient(135deg, rgba(52,211,153,0.10) 0%, rgba(52,211,153,0.02) 100%)',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/5',
  },
  'Dashboard Guide': {
    gradient:
      'linear-gradient(135deg, rgba(168,85,247,0.10) 0%, rgba(168,85,247,0.02) 100%)',
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/5',
  },
  FAQ: {
    gradient:
      'linear-gradient(135deg, rgba(249,115,22,0.10) 0%, rgba(249,115,22,0.02) 100%)',
    border: 'border-orange-500/20',
    bg: 'bg-orange-500/5',
  },
}

const DOC_STATS = [
  { label: 'Guides', value: '7' },
  { label: 'Pages', value: '32+' },
  { label: 'SDK Languages', value: '4' },
  { label: 'API Endpoints', value: '24' },
]

export default function DocsOverview() {
  return (
    <div className="max-w-3xl">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-12"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-4 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
          <span className="text-[11px] font-semibold text-[var(--primary)]">
            Welcome to the AuthSys documentation
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
          Build with{' '}
          <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--ring)] bg-clip-text text-transparent">
            confidence
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
          Everything you need to integrate enterprise-grade security into your
          software. From quickstart guides to API references.
        </p>

        {/* Quick links */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/docs/getting-started/quickstart"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[var(--primary)]/90 hover:shadow-lg hover:shadow-[var(--primary)]/20"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/docs/api-reference"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition-all duration-200 hover:border-[var(--color-border)]/50 hover:bg-[var(--color-bg-elevated)]"
          >
            <BookOpen className="h-4 w-4" />
            API Reference
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35, ease: 'easeOut' }}
        className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {DOC_STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-3 text-center"
          >
            <div className="text-lg font-bold text-[var(--color-text-primary)]">
              {stat.value}
            </div>
            <div className="text-[11px] font-medium text-[var(--color-text-muted)]">
              {stat.label}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Category Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mb-16 grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {DOCS_NAV.map((cat) => {
          const colors = CATEGORY_COLORS[cat.title] || CATEGORY_COLORS['Getting Started']
          return (
            <motion.div key={cat.href} variants={item}>
              <Link
                href={cat.href}
                className="group relative block h-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] transition-all duration-300 hover:border-[var(--color-border)]/50"
                style={{ background: colors.gradient }}
              >
                <div className="p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors.bg} ${colors.border} border`}
                    >
                      <span className="material-symbols-outlined text-[18px] text-[var(--primary)]">
                        {cat.icon}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {cat.title}
                    </h3>
                    <ArrowRight className="ml-auto h-4 w-4 text-[var(--color-text-muted)] opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
                  </div>

                  <ul className="space-y-1.5">
                    {cat.pages.slice(0, 3).map((p) => (
                      <li
                        key={p.href}
                        className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]"
                      >
                        <span className="h-1 w-1 flex-shrink-0 rounded-full bg-[var(--color-text-muted)]/30" />
                        {p.title}
                      </li>
                    ))}
                    {cat.pages.length > 3 && (
                      <li className="text-xs font-medium text-[var(--primary)]">
                        +{cat.pages.length - 3} more guides
                      </li>
                    )}
                  </ul>
                </div>

                {/* Hover glow */}
                <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-[var(--primary)]/10" />
                </div>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-8 text-center sm:p-10"
      >
        <div className="relative z-10">
          <div className="mb-4 inline-flex items-center justify-center gap-2">
            <MessageCircle className="h-5 w-5 text-[var(--primary)]" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Need live help?
            </h3>
          </div>
          <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Our support team is available 24/7 for technical assistance and
            integration support.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[var(--primary)]/90 hover:shadow-lg hover:shadow-[var(--primary)]/20"
            >
              Contact Support
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition-all duration-200 hover:border-[var(--color-border)]/50"
            >
              <ExternalLink className="h-4 w-4" />
              GitHub
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
