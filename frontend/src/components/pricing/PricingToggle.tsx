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
    <div className="relative inline-flex w-64 items-center gap-1.5 rounded-2xl border border-[var(--border)]/30 bg-[var(--glass-bg)]/20 p-1.5 backdrop-blur-xl h-12">
      {/* Sliding background pill — transform-only for GPU acceleration */}
      <motion.div
        className="absolute top-1.5 bottom-1.5 left-1.5 rounded-xl bg-[var(--primary)]/10"
        initial={false}
        animate={{
          x: isYearly ? '100%' : 0,
        }}
        style={{
          width: 'calc(50% - 3px)',
        }}
        transition={{
          duration: 0.3,
          ease: [0.22, 0.61, 0.36, 1] as const,
        }}
      />

      <button
        onClick={() => onChange(false)}
        className={`relative z-10 flex h-9 flex-1 items-center justify-center rounded-xl px-5 text-xs font-medium
          transition-[color] duration-200 ease-out
          ${
            !isYearly
              ? 'text-[var(--primary-foreground)]'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
      >
        Monthly
      </button>

      <button
        onClick={() => onChange(true)}
        className={`relative z-10 flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl px-5 text-xs font-medium
          transition-[color] duration-200 ease-out
          ${
            isYearly
              ? 'text-[var(--primary-foreground)]'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
      >
        Yearly
        {savings > 0 && (
          <span className="text-[var(--primary)] text-[10px] font-semibold">
            Save {savings}%
          </span>
        )}
      </button>
    </div>
  )
}
