'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { DEFAULT_PLANS } from '@/lib/pricing';
import PricingGrid from '@/components/pricing/PricingGrid';

export default function PaymentsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    (async () => {
      try {
        const [plansRes, paymentsRes] = await Promise.all([
          api.get('/billing/plans'),
          api.get('/billing/my-payments'),
        ]);
        setPlans(plansRes.data?.length ? plansRes.data.filter((p: any) => (p.is_active ?? true) && p.sort_order >= 1 && p.sort_order <= 4 && !/tester/i.test(p.name)) : DEFAULT_PLANS);
        setPayments(paymentsRes.data);
      } catch { }
      finally { setLoading(false); }
    })();
  }, []);

  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === 'completed').length,
    pending: payments.filter(p => p.status === 'pending').length,
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="premium-card p-8 md:p-10 space-y-6">
          <div className="sk h-6 w-32 rounded-lg" />
          <div className="sk h-4 w-56 rounded" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="premium-card p-5 space-y-3"><div className="sk h-8 w-8 rounded-xl" /><div className="sk h-4 w-16 rounded" /><div className="sk h-7 w-20 rounded" /></div>)}
          </div>
        </div>
        <div className="premium-card p-8 md:p-10">
          <div className="sk h-5 w-36 rounded-lg mb-6" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="premium-card p-6 space-y-4"><div className="sk h-6 w-full rounded" /><div className="space-y-2"><div className="sk h-4 w-3/4 rounded" /><div className="sk h-4 w-1/2 rounded" /></div><div className="sk h-10 w-full rounded-xl" /></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-8">
        <div className="premium-card p-8 md:p-10">
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-[var(--foreground)] mb-1">Payments</h3>
          <p className="text-sm text-[var(--muted-foreground)]">View and manage your subscription and payment history.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total', icon: 'payments', key: 'total', color: 'var(--primary)' },
            { label: 'Completed', icon: 'check_circle', key: 'completed', color: '#10b981' },
            { label: 'Pending', icon: 'schedule', key: 'pending', color: '#f59e0b' },
          ].map(s => (
            <div key={s.key} className="premium-card p-5 flex flex-col gap-4 group cursor-default">
              <div className="stat-icon-circle group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
              </div>
              <div>
                <p className="stat-label mb-1">{s.label}</p>
                <p className="text-3xl font-black text-white tabular-nums" style={{ color: s.color }}>
                  {stats[s.key as keyof typeof stats]}
                </p>
              </div>
            </div>
          ))}
        </div>

        <SectionLabel>Plan options</SectionLabel>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="premium-card p-6 space-y-4">
                <div className="sk h-4 w-20 rounded" />
                <div className="sk h-8 w-24 rounded" />
                <div className="space-y-2">
                  {[1, 2, 3].map(j => <div key={j} className="sk h-3 w-full rounded" />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PricingGrid plans={plans} isYearly={isYearly} onToggleYearly={setIsYearly} onSelectPlan={() => {}} />
        )}
      </div>

      {payments.length > 0 && (
      <div className="premium-card p-8 md:p-10">
          <SectionLabel>Payment history</SectionLabel>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">
                  <th className="text-left py-3 px-2">Date</th>
                  <th className="text-left py-3 px-2">Amount</th>
                  <th className="text-left py-3 px-2">Plan</th>
                  <th className="text-left py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any) => (
                  <tr key={p.id} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                    <td className="py-3 px-2 font-mono text-xs text-[var(--muted-foreground)]">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-2 font-bold">${(p.amount / 100).toFixed(2)}</td>
                    <td className="py-3 px-2 text-[var(--muted-foreground)]">{p.plan_name || '-'}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        p.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                        p.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <p className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest flex-shrink-0">{children}</p>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}
