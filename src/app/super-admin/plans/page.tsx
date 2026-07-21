'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';

export default function PlansManagementPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await adminApi.get<any[]>('/admin/plans');
      if (res.data.length === 0) {
        const seed = await adminApi.post<{ plans: any[] }>('/admin/plans/seed');
        setPlans(seed.data.plans || []);
      } else {
        setPlans(res.data.sort((a, b) => a.sort_order - b.sort_order));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans() }, [fetchPlans]);

  const toggleActive = async (plan: any) => {
    try {
      await adminApi.put(`/admin/plans/${plan.id}`, { ...plan, is_active: !plan.is_active });
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p));
      toast.success(`${plan.name} ${plan.is_active ? 'disabled' : 'enabled'}`);
    } catch { toast.error('Failed to toggle plan'); }
  };

  const duplicatePlan = async (plan: any) => {
    try {
      const dup = { ...plan, id: undefined, name: `${plan.name} (Copy)`, sort_order: plans.length + 1 };
      const res = await adminApi.post('/admin/plans', dup);
      setPlans(prev => [...prev, res.data].sort((a, b) => a.sort_order - b.sort_order));
      toast.success('Plan duplicated');
    } catch { toast.error('Failed to duplicate'); }
  };

  const deletePlan = async (plan: any) => {
    if (!confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;
    try {
      await adminApi.delete(`/admin/plans/${plan.id}`);
      setPlans(prev => prev.filter(p => p.id !== plan.id));
      toast.success('Plan deleted');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Pricing Plans</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Create, edit, and manage pricing plans</p>
        </div>
        <Link
          href="/super-admin/plans/new"
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Plan
        </Link>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Order</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Plan</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Yearly</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Features</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-4xl text-white/20">inventory_2</span>
                      <p className="text-[var(--muted-foreground)] text-sm">No plans yet. Create your first plan.</p>
                    </div>
                  </td>
                </tr>
              ) : plans.map((plan, idx) => (
                <tr key={plan.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs text-[var(--muted-foreground)] font-mono">#{plan.sort_order}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[var(--primary)]">{plan.icon || 'card_membership'}</span>
                      <div>
                        <p className="text-sm font-bold text-[var(--foreground)]">{plan.name}</p>
                        {plan.description && (
                          <p className="text-[11px] text-[var(--muted-foreground)] truncate max-w-[200px]">{plan.description}</p>
                        )}
                      </div>
                      {plan.is_recommended && (
                        <span className="text-[9px] bg-[var(--primary)]/15 text-[var(--primary)] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Popular</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[var(--foreground)]">${(plan.price_monthly / 100).toFixed(0)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[var(--foreground)]">${(plan.price_yearly / 100).toFixed(0)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-[var(--muted-foreground)]">{(plan.features || []).filter((f: any) => f.included).length} features</span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleActive(plan)}
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-colors ${
                        plan.is_active
                          ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                          : 'text-red-400 border-red-500/20 bg-red-500/10'
                      }`}
                    >
                      {plan.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/super-admin/plans/${plan.id}`}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </Link>
                      <button onClick={() => duplicatePlan(plan)}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                      </button>
                      <button onClick={() => deletePlan(plan)}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/10 flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-400 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
