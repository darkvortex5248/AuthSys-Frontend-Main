'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useDeveloperMe } from '@/hooks/use-developer-queries';
import { PlanBadge } from '@/components/ui/plan-badge';
import Link from 'next/link';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest flex-shrink-0">{children}</p>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

function UsageBar({ label, current, limit, pct }: { label: string; current: number; limit: number; pct: number }) {
  const color = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-[var(--primary)]';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--foreground)] font-semibold">{label}</span>
        <span className="text-[var(--muted-foreground)] font-mono text-xs">{current.toLocaleString()} / {limit.toLocaleString()}</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PlanPage() {
  const { user } = useAuthStore();
  const { data: profile, refetch: refreshSubscription, isFetching } = useDeveloperMe(true);
  const activeUser = profile ?? user;
  const [usage, setUsage] = useState<any>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    api.get('/developer/usage/current').then(r => setUsage(r.data)).catch(() => {}).finally(() => setUsageLoading(false));
  }, []);

  const limitPct = (cur: number, lim: number) => lim > 0 ? Math.min(100, Math.round((cur / lim) * 100)) : 0;

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="premium-card p-8 md:p-10 space-y-6">
          <div className="sk h-6 w-44 rounded-lg" />
          <div className="sk h-4 w-64 rounded" />
          <div className="space-y-4 mt-6">
            {[1,2,3].map(i => <div key={i} className="space-y-2 p-4 border border-white/5 rounded-xl"><div className="sk h-4 w-32 rounded" /><div className="sk h-2.5 w-full rounded" /></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="premium-card p-8 md:p-10 space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-[var(--foreground)] mb-1">Plan & Usage</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Your current subscription plan and resource consumption.</p>
        </div>
        <PlanBadge tier={activeUser?.subscription_tier} planName={activeUser?.plan?.name} />
      </div>

      {usageLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3 p-4 border border-white/5 rounded-xl">
              <div className="sk h-4 w-32 rounded" />
              <div className="sk h-2.5 w-full rounded" />
            </div>
          ))}
        </div>
      ) : usage ? (
        <>
          <SectionLabel>Current billing period</SectionLabel>
          <div className="space-y-5">
            <UsageBar label="Applications" current={usage.app_count || 0} limit={usage.app_limit || 1} pct={limitPct(usage.app_count, usage.app_limit)} />
            <UsageBar label="Monthly Key Gen" current={usage.key_count || 0} limit={usage.key_limit || 10} pct={limitPct(usage.key_count, usage.key_limit)} />
            <UsageBar label="API Requests (today)" current={usage.api_requests || 0} limit={usage.api_limit || 1000} pct={limitPct(usage.api_requests, usage.api_limit)} />
            <UsageBar label="Team Members" current={usage.team_count || 0} limit={usage.team_limit || 1} pct={limitPct(usage.team_count, usage.team_limit)} />
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-[var(--muted-foreground)]">Unable to load usage data.</div>
      )}

      <div className="pt-6 border-t border-white/5 flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          Need more capacity?{' '}
          <Link href="/settings/billing/payments" className="text-[var(--primary)] font-bold hover:underline">View upgrade options</Link>
        </p>
        <button onClick={() => refreshSubscription()} disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 text-xs font-bold transition-all">
          <span className={`material-symbols-outlined text-[14px] ${isFetching ? 'animate-spin' : ''}`}>refresh</span>
          Refresh
        </button>
      </div>
    </section>
  );
}
