'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';

export default function PlansManagementPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await adminApi.get<any[]>('/admin/plans');
      setPlans(res.data);
    } catch (err) {
      console.error("Failed to fetch plans", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...editingPlan,
        features_json: typeof editingPlan.features_json === 'string' 
          ? editingPlan.features_json.split('\n').filter((f: string) => f.trim() !== '') 
          : editingPlan.features_json
      };
      
      await adminApi.put(`/admin/plans/${editingPlan.id}`, payload);
      setEditingPlan(null);
      fetchPlans();
      toast.success('Plan saved');
    } catch (err) {
      toast.error('Failed to update plan');
      console.error("Failed to update plan", err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#d97757]/20 border-t-[#d97757] rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e5e2e1] tracking-tight">Subscription Architecture</h1>
          <p className="text-[#8e8ea0] mt-1">Configure pricing tiers and system quotas</p>
        </div>
        <button className="px-6 py-2.5 rounded-lg bg-[#d97757] text-[#00285d] font-bold transition-all flex items-center gap-2 shadow-lg shadow-[#d97757]/10 hover:opacity-90">
          <span className="material-symbols-outlined">add</span>
          New Architecture
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className="glass-card rounded-[2rem] p-8 flex flex-col relative overflow-hidden group border border-white/5 hover:border-[#d97757]/30 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#d97757]/5 blur-3xl -mr-10 -mt-10"></div>
            
            <div className="mb-6">
              <div className="flex justify-between items-start mb-4">
                 <h3 className="text-2xl font-black text-[#e5e2e1]">{plan.name}</h3>
                 <span className="p-2 rounded-lg bg-white/5 text-[#d97757]">
                   <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>card_membership</span>
                 </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#d97757]">${(plan.price_monthly / 100).toFixed(2)}</span>
                <span className="text-[#8e8ea0] font-bold text-xs">/mo</span>
              </div>
            </div>

            {/* Features Preview */}
            <div className="space-y-2 mb-6">
               <p className="text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-3">Key Features</p>
               {(plan.features_json || []).map((f: string, i: number) => (
                 <div key={i} className="flex items-center gap-2 text-xs text-[#e5e2e1]/70">
                    <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                    {f}
                 </div>
               ))}
               {(!plan.features_json || plan.features_json.length === 0) && (
                 <p className="text-[10px] text-zinc-600 italic">No custom features added.</p>
               )}
            </div>

            <div className="space-y-3 mb-8 pt-4 border-t border-white/5">
              {[
                { label: 'Applications', value: plan.max_apps },
                { label: 'Users per App', value: plan.max_users_per_app },
                { label: 'Monthly Keys', value: plan.max_keys_per_month },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1.5">
                  <span className="text-[9px] font-bold text-[#8e8ea0] uppercase tracking-widest">{item.label}</span>
                  <span className="text-xs font-black text-[#e5e2e1]">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setEditingPlan({
                ...plan,
                features_json: (plan.features_json || []).join('\n')
              })}
              className="w-full py-4 rounded-xl bg-white/5 border border-white/5 text-[#e5e2e1] font-bold hover:bg-[#d97757]/10 hover:border-[#d97757]/30 transition-all text-xs uppercase tracking-widest"
            >
              Configure Tier
            </button>
          </div>
        ))}
      </div>

      {editingPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0b0e15]/80 backdrop-blur-sm overflow-y-auto">
           <div className="w-full max-w-2xl bg-[#1d2027] border border-white/10 rounded-[3rem] p-10 shadow-2xl relative my-auto">
              <button onClick={() => setEditingPlan(null)} className="absolute top-8 right-8 text-[#8e8ea0] hover:text-[#e5e2e1] transition-colors">
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
              
              <h2 className="text-2xl font-black text-[#e5e2e1] mb-8">Edit {editingPlan.name} Tier</h2>
              
              <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-x-8 gap-y-4">
                 <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-1.5 px-1">Monthly Price (Cents)</label>
                      <input 
                        type="number"
                        value={editingPlan.price_monthly}
                        onChange={e => setEditingPlan({...editingPlan, price_monthly: parseInt(e.target.value)})}
                        className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[#e5e2e1] focus:ring-2 focus:ring-[#d97757]/50 outline-none text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-1.5 px-1">Yearly Price (Cents)</label>
                      <input 
                        type="number"
                        value={editingPlan.price_yearly}
                        onChange={e => setEditingPlan({...editingPlan, price_yearly: parseInt(e.target.value)})}
                        className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[#e5e2e1] focus:ring-2 focus:ring-[#d97757]/50 outline-none text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-1.5 px-1">Max Applications</label>
                      <input 
                        type="number"
                        value={editingPlan.max_apps}
                        onChange={e => setEditingPlan({...editingPlan, max_apps: parseInt(e.target.value)})}
                        className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[#e5e2e1] focus:ring-2 focus:ring-[#d97757]/50 outline-none text-sm font-bold"
                      />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-1.5 px-1">Max Users / App</label>
                      <input 
                        type="number"
                        value={editingPlan.max_users_per_app}
                        onChange={e => setEditingPlan({...editingPlan, max_users_per_app: parseInt(e.target.value)})}
                        className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[#e5e2e1] focus:ring-2 focus:ring-[#d97757]/50 outline-none text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-1.5 px-1">Max Keys / Month</label>
                      <input 
                        type="number"
                        value={editingPlan.max_keys_per_month}
                        onChange={e => setEditingPlan({...editingPlan, max_keys_per_month: parseInt(e.target.value)})}
                        className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[#e5e2e1] focus:ring-2 focus:ring-[#d97757]/50 outline-none text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-1.5 px-1">AI Agent Access</label>
                      <div 
                        onClick={() => setEditingPlan({...editingPlan, ai_agent_access: !editingPlan.ai_agent_access})}
                        className={`w-full py-2.5 px-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${editingPlan.ai_agent_access ? 'bg-[#d97757]/10 border-[#d97757]/30 text-[#d97757]' : 'bg-[#0b0e15]/50 border-white/5 text-[#8e8ea0]'}`}
                      >
                        <span className="text-[10px] font-bold">{editingPlan.ai_agent_access ? 'AUTHORIZED' : 'RESTRICTED'}</span>
                        <span className="material-symbols-outlined text-sm">{editingPlan.ai_agent_access ? 'toggle_on' : 'toggle_off'}</span>
                      </div>
                    </div>
                 </div>

                 <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-1.5 px-1">Features List (One per line)</label>
                    <textarea 
                      value={editingPlan.features_json}
                      onChange={e => setEditingPlan({...editingPlan, features_json: e.target.value})}
                      placeholder="e.g. 10,000 Users&#10;Team Management&#10;Custom API"
                      className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-3 px-4 text-[#e5e2e1] focus:ring-2 focus:ring-[#d97757]/50 outline-none text-sm font-medium h-32 resize-none"
                    ></textarea>
                 </div>
                 
                 <div className="col-span-2 pt-4">
                    <button type="submit" className="w-full py-4 rounded-2xl bg-[#d97757] text-[#00285d] font-black shadow-xl shadow-[#d97757]/20 hover:opacity-90 transition-all uppercase tracking-widest text-xs">
                       Update Architecture Tier
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
