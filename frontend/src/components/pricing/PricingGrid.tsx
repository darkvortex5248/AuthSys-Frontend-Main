'use client'

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
    <div>
      <div className="mb-10 flex justify-center">
        <PricingToggle isYearly={isYearly} onChange={onToggleYearly} plans={plans} />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isYearly={isYearly}
            onSelect={onSelectPlan}
          />
        ))}
      </div>
    </div>
  )
}
