'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';

const emptyPlan = {
  name: '',
  price_monthly: 0,
  price_yearly: 0,
  max_apps: 5,
  max_users_per_app: 100,
  max_keys_per_month: 1000,
  features_json: '',
  ai_agent_access: false,
};

export default function PlansManagementPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchPlans = async () => {
    try {
      const res = await adminApi.get<any[]>('/admin/plans');
      setPlans(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await adminApi.post<{ created: number; plans: any[] }>('/admin/plans/seed');
      setPlans(res.data.plans || []);
      toast.success(
        res.data.created
          ? `Created ${res.data.created} default plan(s)`
          : 'All default plans already exist',
      );
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to seed plans');
    } finally {
      setSeeding(false);
    }
  };

  const openCreate = () => {
    setIsCreating(true);
    setEditingPlan({ ...emptyPlan });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...editingPlan,
        features_json:
          typeof editingPlan.features_json === 'string'
            ? editingPlan.features_json
                .split('\n')
                .map((f: string) => f.trim())
                .filter(Boolean)
            : editingPlan.features_json,
      };

      if (isCreating) {
        await adminApi.post('/admin/plans', payload);
        toast.success('Plan created');
      } else {
        await adminApi.put(`/admin/plans/${editingPlan.id}`, payload);
        toast.success('Plan updated');
      }
      setEditingPlan(null);
      setIsCreating(false);
      fetchPlans();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save plan');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this plan? Developers on this plan must be reassigned first.')) return;
    try {
      await adminApi.delete(`/admin/plans/${id}`);
      toast.success('Plan deleted');
      fetchPlans();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Cannot delete plan');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#d97757]/20 border-t-[#d97757] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#e5e2e1] tracking-tight">Subscription Architecture</h1>
          <p className="text-[#8e8ea0] mt-1">Configure pricing tiers and system quotas</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[#e5e2e1] font-bold text-xs uppercase tracking-widest hover:bg-white/10 disabled:opacity-50"
          >
            {seeding ? 'Seeding…' : 'Load defaults'}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="px-6 py-2.5 rounded-lg bg-[#d97757] text-[#131313] font-bold transition-all flex items-center gap-2 shadow-lg shadow-[#d97757]/10 hover:opacity-90"
          >
            <span className="material-symbols-outlined">add</span>
            New Plan
          </button>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center border border-dashed border-white/10">
          <span className="material-symbols-outlined text-5xl text-[#8e8ea0] mb-4">card_membership</span>
          <p className="text-lg font-bold text-[#e5e2e1] mb-2">No subscription plans yet</p>
          <p className="text-sm text-[#8e8ea0] mb-6 max-w-md mx-auto">
            Load default tiers (Free, Tester, Developer, Seller, Enterprise) or create a custom plan.
          </p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-8 py-3 rounded-xl bg-[#d97757] text-[#131313] font-bold text-xs uppercase tracking-widest"
          >
            Create default plans
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="glass-card rounded-[2rem] p-8 flex flex-col relative overflow-hidden group border border-white/5 hover:border-[#d97757]/30 transition-all"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#d97757]/5 blur-3xl -mr-10 -mt-10" />
              <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-black text-[#e5e2e1]">{plan.name}</h3>
                  <span className="p-2 rounded-lg bg-white/5 text-[#d97757]">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      card_membership
                    </span>
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#d97757]">
                    ${(plan.price_monthly / 100).toFixed(2)}
                  </span>
                  <span className="text-[#8e8ea0] font-bold text-xs">/mo</span>
                </div>
              </div>

              <div className="space-y-2 mb-6 flex-1">
                <p className="text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-3">
                  Key Features
                </p>
                {(plan.features_json || []).map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#e5e2e1]/70">
                    <span className="material-symbols-outlined text-green-500 text-sm">
                      check_circle
                    </span>
                    {f}
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 pt-4 border-t border-white/5">
                {[
                  { label: 'Applications', value: plan.max_apps },
                  { label: 'Users per App', value: plan.max_users_per_app },
                  { label: 'Monthly Keys', value: plan.max_keys_per_month },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1.5">
                    <span className="text-[9px] font-bold text-[#8e8ea0] uppercase tracking-widest">
                      {item.label}
                    </span>
                    <span className="text-xs font-black text-[#e5e2e1]">
                      {Number(item.value).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPlan({
                      ...plan,
                      features_json: (plan.features_json || []).join('\n'),
                    });
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/5 text-[#e5e2e1] font-bold hover:bg-[#d97757]/10 text-xs uppercase tracking-widest"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(plan.id)}
                  className="px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold uppercase"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0b0e15]/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#1d2027] border border-white/10 rounded-[2rem] p-10 shadow-2xl relative my-auto">
            <button
              type="button"
              onClick={() => {
                setEditingPlan(null);
                setIsCreating(false);
              }}
              className="absolute top-8 right-8 text-[#8e8ea0] hover:text-[#e5e2e1]"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>

            <h2 className="text-2xl font-black text-[#e5e2e1] mb-8">
              {isCreating ? 'Create plan' : `Edit ${editingPlan.name}`}
            </h2>

            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
              {isCreating && (
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-1.5">
                    Plan name
                  </label>
                  <input
                    required
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[#e5e2e1] text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase mb-1.5">
                  Monthly (cents)
                </label>
                <input
                  type="number"
                  value={editingPlan.price_monthly}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, price_monthly: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[#e5e2e1] text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase mb-1.5">
                  Yearly (cents)
                </label>
                <input
                  type="number"
                  value={editingPlan.price_yearly}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, price_yearly: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[#e5e2e1] text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase mb-1.5">
                  Max apps
                </label>
                <input
                  type="number"
                  value={editingPlan.max_apps}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, max_apps: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[#e5e2e1] text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase mb-1.5">
                  Max users/app
                </label>
                <input
                  type="number"
                  value={editingPlan.max_users_per_app}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      max_users_per_app: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[#e5e2e1] text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase mb-1.5">
                  Max keys/month
                </label>
                <input
                  type="number"
                  value={editingPlan.max_keys_per_month}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      max_keys_per_month: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[#e5e2e1] text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase mb-1.5">
                  Features (one per line)
                </label>
                <textarea
                  value={editingPlan.features_json}
                  onChange={(e) => setEditingPlan({ ...editingPlan, features_json: e.target.value })}
                  className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-3 px-4 text-[#e5e2e1] text-sm h-28 resize-none"
                />
              </div>
              <div className="col-span-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditingPlan({ ...editingPlan, ai_agent_access: !editingPlan.ai_agent_access })
                  }
                  className={`w-full py-2.5 rounded-xl border text-xs font-bold uppercase ${
                    editingPlan.ai_agent_access
                      ? 'bg-[#d97757]/10 border-[#d97757]/30 text-[#d97757]'
                      : 'bg-[#0b0e15]/50 border-white/5 text-[#8e8ea0]'
                  }`}
                >
                  AI Agent: {editingPlan.ai_agent_access ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-[#d97757] text-[#131313] font-black uppercase tracking-widest text-xs"
                >
                  {isCreating ? 'Create plan' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
