'use client';

import { PLAN_STYLES, getPlanKey } from '@/lib/plan-access';

export function PlanBadge({ tier, planName, className = '' }: { tier?: string | null; planName?: string | null; className?: string }) {
  const key = getPlanKey(planName || tier);
  const s = PLAN_STYLES[key] || PLAN_STYLES.tester;
  return (
    <span suppressHydrationWarning className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.bg} ${s.border} border ${s.color} ${className}`}>
      <span className="material-symbols-outlined text-[12px]">{s.icon}</span>
      {planName || s.label}
    </span>
  );
}
