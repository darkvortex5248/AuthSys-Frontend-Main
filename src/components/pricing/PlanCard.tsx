'use client'

import { Zap, Gem, Crown, Sparkles, Check, X, type LucideIcon } from 'lucide-react'
import type { Plan } from '@/types/pricing'
import { calcYearlySavings } from '@/lib/pricing'

interface Props {
  plan: Plan
  isYearly: boolean
  onSelect: (plan: Plan) => void
}

const PLAN_ICONS: Record<string, LucideIcon> = {
  explore: Zap,
  diamond: Gem,
  workspace_premium: Crown,
}

interface FeatureDef {
  label: string
  isBool?: boolean
  getValue: (plan: Plan) => string | null
  isIncluded: (plan: Plan) => boolean
}

const FEATURES: FeatureDef[] = [
  { label: 'Applications', getValue: p => p.max_apps >= 999 ? 'Unlimited' : `${p.max_apps} Apps`, isIncluded: p => p.max_apps > 0 },
  { label: 'Licenses', getValue: p => p.max_licenses >= 99999 ? 'Unlimited' : `${p.max_licenses.toLocaleString()} Keys`, isIncluded: p => p.max_licenses > 0 },
  { label: 'Cloud Variables', getValue: p => p.max_variables >= 99999 ? 'Unlimited' : `${p.max_variables} Variables`, isIncluded: p => p.max_variables > 0 },
  { label: 'Version Whitelist', isBool: true, getValue: () => null, isIncluded: p => p.has_version_whitelist },
  { label: 'IP Tracking', isBool: true, getValue: () => null, isIncluded: p => p.has_ip_tracking },
  { label: 'Team Management', isBool: true, getValue: () => null, isIncluded: p => p.has_staff_management },
  { label: 'Webhooks', isBool: true, getValue: () => null, isIncluded: p => p.has_webhooks },
  { label: 'Audit Logs', isBool: true, getValue: () => null, isIncluded: p => p.has_audit_logs },
  { label: 'User Panel', isBool: true, getValue: () => null, isIncluded: p => p.has_user_panel },
  { label: 'Discord Bot', isBool: true, getValue: () => null, isIncluded: p => p.has_discord_integration },
  { label: 'Telegram Bot', isBool: true, getValue: () => null, isIncluded: p => p.has_telegram_integration },
  { label: 'API Access', isBool: true, getValue: () => null, isIncluded: p => p.has_api_access },
  { label: 'Chatrooms', isBool: true, getValue: () => null, isIncluded: p => p.has_live_chat },
  { label: 'Custom Domain', isBool: true, getValue: () => null, isIncluded: p => p.has_custom_domain },
  { label: 'White Label', isBool: true, getValue: () => null, isIncluded: p => p.has_white_label },
  { label: 'Priority Support', isBool: true, getValue: () => null, isIncluded: p => p.has_priority_support },
  { label: 'SSL Support', isBool: true, getValue: () => null, isIncluded: p => p.has_ssl },
]

export default function PlanCard({ plan, isYearly, onSelect }: Props) {
  const Icon = PLAN_ICONS[plan.icon] || Sparkles
  const price = isYearly && plan.price_yearly > 0 ? plan.price_yearly : plan.price_monthly
  const period = isYearly && plan.price_yearly > 0 ? '/year' : '/month'

  const planFeatures = FEATURES.filter(f => {
    const val = f.getValue(plan)
    if (!f.isBool && val) return true
    return f.isBool
  })

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-7 backdrop-blur-xl ${
        plan.is_recommended
          ? 'border-[var(--accent-opacity-20)] bg-[var(--glass-bg)] shadow-lg shadow-[var(--accent-opacity-15)]'
          : 'border-[var(--border)] bg-[var(--glass-bg)]'
      }`}
    >
      {plan.is_recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--primary-foreground)] shadow-sm">
            <Sparkles className="w-3 h-3" />
            Most Popular
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            plan.is_recommended
              ? 'bg-[var(--accent-opacity-15)] text-[var(--primary)]'
              : 'bg-[var(--accent-opacity-8)] text-[var(--primary)]'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[var(--foreground)]">{plan.name}</h3>
          {plan.description && (
            <p className="text-[11px] leading-tight text-[var(--muted-foreground)] mt-0.5">
              {plan.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-4xl font-bold tracking-tight text-[var(--foreground)]">
          {price <= 0 ? 'Free' : `$${(price / 100).toFixed(2).replace(/\.00$/, '')}`}
        </span>
        {price > 0 && (
          <span className="text-xs font-medium text-[var(--muted-foreground)]">
            {period}
          </span>
        )}
      </div>

      {isYearly && plan.price_yearly > 0 && plan.price_monthly > 0 && (() => {
        const s = calcYearlySavings(plan.price_monthly, plan.price_yearly)
        if (s <= 0) return null
        const monthlyTotal = plan.price_monthly * 12
        const saved = monthlyTotal - plan.price_yearly
        return (
          <div className="mb-4 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-[11px] font-bold text-emerald-400">
              Save {s}% · ${(saved / 100).toFixed(2)}/year
            </p>
          </div>
        )
      })()}

      <div className="flex-1 mb-6">
        <div className="space-y-2.5">
          {planFeatures.map((feat, i) => {
            const included = feat.isIncluded(plan)
            const val = feat.getValue(plan)
            return (
              <div key={i} className="flex items-center gap-2.5">
                {included ? (
                  <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" strokeWidth={3} />
                ) : (
                  <X className="w-3.5 h-3.5 shrink-0 text-[var(--muted-foreground)]/30" strokeWidth={2} />
                )}
                <span className={`text-[11px] font-medium ${included ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]/40'}`}>
                  {val || feat.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => onSelect(plan)}
        className={`w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-[0.06em] transition-all duration-150 active:scale-[0.98] ${
          plan.is_recommended
            ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm hover:brightness-110'
            : 'border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent-opacity-20)] hover:bg-[var(--accent-opacity-8)]'
        }`}
      >
        {plan.button_text || (price <= 0 ? 'Get Started' : 'Choose Plan')}
      </button>
    </div>
  )
}
