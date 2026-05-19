'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';

export default function DeveloperManagementPage() {
  const [developers, setDevelopers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [devsRes, plansRes] = await Promise.all([
        adminApi.get<any[]>('/admin/developers'),
        adminApi.get<any[]>('/admin/plans'),
      ]);
      setDevelopers(devsRes.data);
      setPlans(plansRes.data);
      if (plansRes.data.length === 0) {
        const seed = await adminApi.post<{ plans: any[] }>('/admin/plans/seed');
        setPlans(seed.data.plans || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load developers');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (id: number) => {
    try {
      await adminApi.post(`/admin/developers/${id}/ban`, {});
      fetchData();
      toast.success('Developer status updated');
    } catch (err) {
      toast.error('Failed to toggle ban');
      console.error("Failed to toggle ban", err);
    }
  };

  const changePlan = async (devId: number, planId: number | null) => {
    try {
      if (planId === null) {
        await adminApi.delete(`/admin/developers/${devId}/plan`);
      } else {
        await adminApi.post(`/admin/developers/${devId}/plan?plan_id=${planId}`, {});
      }
      await fetchData();
      toast.success(planId === null ? 'Plan removed' : 'Subscription assigned');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update plan');
    }
  };

  const filteredDevs = developers.filter(dev => 
    dev.username.toLowerCase().includes(search.toLowerCase()) || 
    dev.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e5e2e1] tracking-tight">Developer Registry</h1>
          <p className="text-[#8e8ea0] mt-1">Manage platform tiers and access levels</p>
        </div>
        <div className="relative w-72">
           <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8e8ea0] text-sm">search</span>
           <input 
            type="text" 
            placeholder="Search systems or devs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-full py-2.5 pl-12 pr-4 text-[#e5e2e1] text-sm focus:ring-2 focus:ring-blue-500/50 transition-all outline-none placeholder:text-[#424754]"
           />
        </div>
      </div>

      {plans.length === 0 && (
        <div className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-200">No plans in database — assign subscription after creating plans.</p>
          <button
            type="button"
            onClick={async () => {
              const seed = await adminApi.post<{ plans: any[] }>('/admin/plans/seed');
              setPlans(seed.data.plans || []);
              toast.success('Default plans created');
            }}
            className="px-4 py-2 rounded-lg bg-amber-500 text-black text-xs font-bold uppercase"
          >
            Create plans
          </button>
        </div>
      )}

      <div className="glass-card rounded-3xl overflow-hidden shadow-2xl border border-white/5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-8 py-5 text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest">Developer</th>
              <th className="px-8 py-5 text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest">Subscription Tier</th>
              <th className="px-8 py-5 text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest">Joined</th>
              <th className="px-8 py-5 text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest">System Status</th>
              <th className="px-8 py-5 text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredDevs.map((dev) => (
              <tr key={dev.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl border border-white/10 bg-blue-500/10 flex items-center justify-center text-blue-500 font-black text-lg uppercase shadow-lg shadow-blue-500/5">
                      {dev.username.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#e5e2e1] group-hover:text-blue-500 transition-colors">{dev.username}</p>
                      <p className="text-[11px] text-[#8e8ea0] font-medium">{dev.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-3">
                      <select 
                        value={dev.plan_id ?? ''} 
                        onChange={(e) => {
                          const v = e.target.value;
                          changePlan(dev.id, v ? parseInt(v, 10) : null);
                        }}
                        className="min-w-[140px] bg-[#0e0e12] border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#d97757] outline-none focus:border-[#d97757] transition-all cursor-pointer"
                      >
                        <option value="">No Plan</option>
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${dev.plan_id ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {dev.plan_id ? 'Licensed' : 'Unlicensed'}
                      </span>
                   </div>
                </td>
                <td className="px-8 py-6">
                   <p className="text-[11px] text-[#8e8ea0] font-mono">{new Date(dev.created_at).toLocaleDateString()}</p>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${dev.is_banned ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                     <span className={`text-[10px] font-black uppercase tracking-widest ${dev.is_banned ? 'text-red-500' : 'text-green-500'}`}>
                        {dev.is_banned ? 'Blacklisted' : 'Operational'}
                     </span>
                   </div>
                </td>
                <td className="px-8 py-6 text-right">
                   <button 
                    onClick={() => handleBan(dev.id)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dev.is_banned ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}`}
                   >
                     {dev.is_banned ? 'Authorize' : 'Revoke'}
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
