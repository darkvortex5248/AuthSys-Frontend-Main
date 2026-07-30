'use client'

import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef } from 'react'
import { Check, X, Sparkles, Zap, Gem, Crown, Rocket, type LucideIcon } from 'lucide-react'
import type { Plan } from '@/types/pricing'
import { calcYearlySavings } from '@/lib/pricing'

interface Props {
  plan: Plan
  isYearly: boolean
  onSelect: (plan: Plan) => void
  index: number
}

interface FeatureDef {
  label: string
  isBool?: boolean
  getValue: (plan: Plan) => string | null
  isIncluded: (plan: Plan) => boolean
}

const PLAN_ICONS: Record<string, LucideIcon> = {
  explore: Zap,
  diamond: Gem,
  workspace_premium: Crown,
  rocket: Rocket,
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

// ─── Animation variants ──────────────────────────────────────────────────────

const priceVariants = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
}

const featureListVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
}

const featureItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
}

const EASING = [0.22, 0.61, 0.36, 1] as const

export default function PlanCard({ plan, isYearly, onSelect, index }: Props) {
  const Icon = PLAN_ICONS[plan.icon] || Sparkles
  const price = isYearly && plan.price_yearly > 0 ? plan.price_yearly : plan.price_monthly
  const period = isYearly && plan.price_yearly > 0 ? 'billed annually' : 'billed monthly'

  const featuresRef = useRef<HTMLDivElement>(null)
  const featuresInView = useInView(featuresRef, { once: true, margin: '0px 0px -50px 0px' })

  const planFeatures = FEATURES.filter(f => {
    const val = f.getValue(plan)
    if (!f.isBool && val) return true
    return f.isBool
  })

  return (
      <motion.div
        className="relative flex h-full flex-col"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: EASING, delay: index * 0.05 }}
      >
      <div
        className="relative flex h-full flex-col rounded-[20px] border border-[var(--border)]/30 bg-[var(--glass-bg)]/15 p-7 backdrop-blur-xl
          transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]
          hover:translate-y-[-8px] hover:border-[var(--border-hover)]/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
      >
        {/* Developer plan: soft cyan ambient glow around the outside */}
        {plan.is_recommended && (
          <div
            className="pointer-events-none absolute -inset-px rounded-[20px]"
            style={{
              boxShadow: '0 0 40px 8px rgba(0, 212, 255, 0.08)',
            }}
          />
        )}

        {/* Most Popular badge — small pill, integrated into card */}
        {plan.is_recommended && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/15 px-3 py-1 text-[9px] font-medium text-[var(--primary)] border border-[var(--primary)]/10 shadow-[0_0_12px_rgba(0,212,255,0.15)]">
              <Sparkles className="w-2.5 h-2.5 fill-current" />
              Most Popular
            </span>
          </div>
        )}

        {/* Icon + Plan Name */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-opacity-8)] border border-[var(--border)]/20">
            <Icon className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--foreground)]">{plan.name}</h3>
            {plan.description && (
              <p className="mt-0.5 text-[12px] leading-tight text-[var(--muted-foreground)]">
                {plan.description}
              </p>
            )}
          </div>
        </div>

        {/* Price — smooth transition on toggle */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1.5">
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                key={isYearly ? 'yearly' : 'monthly'}
                variants={priceVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25, ease: EASING }}
                className="text-4xl font-bold tracking-tight text-[var(--foreground)]"
              >
                {price <= 0 ? 'Free' : `$${(price / 100).toFixed(2).replace(/\.00$/, '')}`}
              </motion.span>
            </AnimatePresence>
            {price > 0 && (
              <AnimatePresence initial={false} mode="wait">
                <motion.span
                  key={isYearly ? 'annual' : 'monthly'}
                  variants={priceVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.25, ease: EASING }}
                  className="text-xs font-medium text-[var(--muted-foreground)]"
                >
                  {period}
                </motion.span>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Feature List — staggered animation on viewport entry */}
        <motion.div
          ref={featuresRef}
          className="mb-6 flex-1"
          initial="hidden"
          animate={featuresInView ? 'visible' : 'hidden'}
          variants={featureListVariants}
        >
          {planFeatures.map((feat) => {
            const included = feat.isIncluded(plan)
            const val = feat.getValue(plan)
            return (
              <motion.div
                key={feat.label}
                className="mb-2.5 flex items-center gap-2.5"
                variants={featureItemVariants}
                transition={{ duration: 0.35, ease: EASING }}
              >
                {included ? (
                  <Check className="h-4 w-4 shrink-0 text-[var(--primary)]" strokeWidth={3} />
                ) : (
                  <X className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]/30" strokeWidth={2} />
                )}
                <span
                  className={`text-sm ${included ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]/40'}`}
                >
                  {val || feat.label}
                </span>
              </motion.div>
            )
          })}
        </motion.div>

        {/* CTA Button — no size change on hover, just brightness */}
        <button
          onClick={() => onSelect(plan)}
          className={`w-full rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wider
            transition-[background-color,box-shadow,border-color] duration-200 ease-out
            ${
              plan.is_recommended
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_4px_16px_rgba(0,212,255,0.15)] hover:brightness-110 hover:shadow-[0_6px_20px_rgba(0,212,255,0.2)]'
                : 'border border-[var(--border)]/40 text-[var(--foreground)] hover:bg-[var(--accent-opacity-8)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]'
            }`}
        >
          {plan.button_text || (price <= 0 ? 'Get Started' : 'Choose Plan')}
        </button>
      </div>
    </motion.div>
  )
}
