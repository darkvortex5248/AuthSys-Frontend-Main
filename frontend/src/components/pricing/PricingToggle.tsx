'use client'

import { motion } from 'framer-motion'
import { calcYearlySavings } from '@/lib/pricing'

interface Props {
  isYearly: boolean
  onChange: (yearly: boolean) => void
  plans?: { price_monthly: number; price_yearly: number }[]
}

export default function PricingToggle({ isYearly, onChange, plans }: Props) {
  const savings = plans
    ? Math.max(...plans.map((p) => calcYearlySavings(p.price_monthly, p.price_yearly)), 0)
    : 0

  return (
    <div className="relative inline-flex w-80 items-center gap-2 rounded-2xl border border-[var(--border)]/40 bg-[var(--glass-bg)]/25 p-2 backdrop-blur-xl h-16">
      {/* Sliding background pill — transform-only for GPU acceleration */}
      <motion.div
        className="absolute top-2 bottom-2 left-2 rounded-[14px] bg-[var(--accent-opacity-8)]"
        initial={false}
        animate={{
          x: isYearly ? '100%' : 0,
        }}
        style={{
          width: 'calc(50% - 4px)',
        }}
        transition={{
          duration: 0.3,
          ease: [0.22, 0.61, 0.36, 1] as const,
        }}
      />

      <button
        onClick={() => onChange(false)}
        className={`relative z-10 flex h-12 w-full items-center justify-center rounded-[14px] px-6 text-sm font-medium transition-[color] duration-200 ${
          !isYearly
            ? 'text-[var(--primary-foreground)]'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        }`}
      >
        Monthly
      </button>

      <button
        onClick={() => onChange(true)}
        className={`relative z-10 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] px-6 text-sm font-medium transition-[color] duration-200 ${
          isYearly
            ? 'text-[var(--primary-foreground)]'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        }`}
      >
        Yearly
        {savings > 0 && (
          <span className="shrink-0 inline-flex items-center rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 px-2.5 py-0.5 text-[10px] font-medium text-[var(--primary)]">
            Save {savings}%
          </span>
        )}
      </button>
    </div>
  )
}
