'use client'

import { calcYearlySavings } from '@/lib/pricing'

interface Props {
  isYearly: boolean
  onChange: (yearly: boolean) => void
  plans?: { price_monthly: number; price_yearly: number }[]
}

export default function PricingToggle({ isYearly, onChange, plans }: Props) {
  const savings = plans
    ? Math.max(...plans.map(p => calcYearlySavings(p.price_monthly, p.price_yearly)), 0)
    : 0

  return (
    <div className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1">
      <button
        onClick={() => onChange(false)}
        className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-150 ${
          !isYearly
            ? 'bg-[var(--primary)] text-white shadow-sm'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange(true)}
        className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-150 ${
          isYearly
            ? 'bg-[var(--primary)] text-white shadow-sm'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        }`}
      >
        Yearly
        {savings > 0 && (
          <span className="ml-1.5 text-[10px] font-bold text-emerald-400">
            Save {savings}%
          </span>
        )}
      </button>
    </div>
  )
}
