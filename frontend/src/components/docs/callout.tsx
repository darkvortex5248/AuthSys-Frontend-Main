'use client'

import { Info, AlertTriangle, AlertCircle, Lightbulb, X } from 'lucide-react'
import { useState } from 'react'

type CalloutVariant = 'info' | 'warning' | 'danger' | 'tip'

const CALLOUT_CONFIG: Record<
  CalloutVariant,
  {
    icon: typeof Info
    gradient: string
    border: string
    bg: string
    iconBg: string
    iconColor: string
    label: string
  }
> = {
  info: {
    icon: Info,
    gradient:
      'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(56,189,248,0.02) 100%)',
    border: 'border-sky-500/20',
    bg: 'bg-sky-500/5',
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-400',
    label: 'Note',
  },
  warning: {
    icon: AlertTriangle,
    gradient:
      'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.02) 100%)',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    label: 'Warning',
  },
  danger: {
    icon: AlertCircle,
    gradient:
      'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)',
    border: 'border-red-500/20',
    bg: 'bg-red-500/5',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    label: 'Danger',
  },
  tip: {
    icon: Lightbulb,
    gradient:
      'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(52,211,153,0.02) 100%)',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/5',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    label: 'Tip',
  },
}

export function Callout({
  variant = 'info',
  title,
  children,
  dismissible,
}: {
  variant?: CalloutVariant
  title?: string
  children: React.ReactNode
  dismissible?: boolean
}) {
  const [dismissed, setDismissed] = useState(false)
  const config = CALLOUT_CONFIG[variant]
  const Icon = config.icon

  if (dismissed) return null

  return (
    <div
      className={`group relative my-8 overflow-hidden rounded-2xl border ${config.border} ${config.bg}`}
      style={{ background: config.gradient }}
    >
      <div className="flex items-start gap-4 px-5 py-4">
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${config.iconBg} ring-1 ring-inset ring-white/[0.04]`}
        >
          <Icon className={`h-4 w-4 ${config.iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${config.iconColor}`}
            >
              {title || config.label}
            </span>
          </div>
          <div className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {children}
          </div>
        </div>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 rounded-lg p-1 text-[var(--color-text-muted)] opacity-0 transition-all duration-200 hover:bg-white/5 hover:text-[var(--color-text-primary)] group-hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.03]" />
    </div>
  )
}
