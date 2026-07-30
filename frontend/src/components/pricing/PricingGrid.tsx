'use client'

import { motion } from 'framer-motion'
import type { Plan } from '@/types/pricing'
import PlanCard from './PlanCard'
import PricingToggle from './PricingToggle'

interface Props {
  plans: Plan[]
  isYearly: boolean
  onToggleYearly: (v: boolean) => void
  onSelectPlan: (plan: Plan) => void
}

export default function PricingGrid({
  plans,
  isYearly,
  onToggleYearly,
  onSelectPlan,
}: Props) {
  return (
    <div className="flex flex-col items-center">
      {/* Toggle — centered with breathing room */}
      <div className="mb-14 flex justify-center">
        <PricingToggle isYearly={isYearly} onChange={onToggleYearly} plans={plans} />
      </div>

      {/* Cards — equal height grid with generous gaps */}
      <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan, i) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isYearly={isYearly}
            onSelect={onSelectPlan}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}
