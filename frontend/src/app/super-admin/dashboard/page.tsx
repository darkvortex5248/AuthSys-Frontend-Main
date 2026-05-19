'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminApi.get<Record<string, unknown>>('/admin/platform-stats');
        setStats(res.data);
      } catch (err) {
        toast.error('Failed to load platform stats');
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#d97757]/20 border-t-[#d97757] rounded-full animate-spin"></div>
    </div>
  );

  const statCards = [
    { name: 'Total Developers', value: stats?.total_developers, icon: 'engineering', color: '#d97757' },
    { name: 'Total Applications', value: stats?.total_apps, icon: 'apps', color: '#e8a87c' },
    { name: 'Total End Users', value: stats?.total_end_users, icon: 'group', color: '#34d399' },
    { name: 'Platform Revenue', value: `$${((stats?.total_revenue_cents || 0) / 100).toFixed(2)}`, icon: 'payments', color: '#d97757' },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="glass-card rounded-xl p-5 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 blur-3xl rounded-full opacity-10" style={{ backgroundColor: stat.color }}></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
              </div>
            </div>
            <h3 className="text-[#8e8ea0] text-[12px] font-bold uppercase tracking-widest">{stat.name}</h3>
            <p className="text-[28px] font-bold text-[#e5e2e1] mt-1">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-6 glass-card rounded-xl p-6">
           <h3 className="text-lg font-bold text-[#e5e2e1] mb-6 flex items-center gap-2">
             <span className="material-symbols-outlined text-[#d97757]">bolt</span>
             Quick Management
           </h3>
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
             {[
               { name: 'Add Plan', icon: 'add_card' },
               { name: 'SDKs', icon: 'upload_file' },
               { name: 'Status', icon: 'settings_suggest' },
               { name: 'Broadcast', icon: 'campaign' },
             ].map(action => (
               <button key={action.name} className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#d97757]/30 transition-all group">
                 <span className="material-symbols-outlined text-2xl text-[#8e8ea0] group-hover:text-[#d97757] transition-colors">{action.icon}</span>
                 <span className="text-[10px] font-bold text-[#8e8ea0] group-hover:text-[#e5e2e1] uppercase tracking-widest">{action.name}</span>
               </button>
             ))}
           </div>
        </div>
        <div className="lg:col-span-4 glass-card rounded-xl p-6">
           <h3 className="text-lg font-bold text-[#e5e2e1] mb-6 flex items-center gap-2">
             <span className="material-symbols-outlined text-emerald-400">health_and_safety</span>
             System Health
           </h3>
           <div className="space-y-5">
             {[
               { name: 'Auth API Gateway', status: 'Optimal', health: 99 },
               { name: 'Database Cluster', status: 'Stable', health: 95 },
               { name: 'CDN & Downloads', status: 'Optimal', health: 100 },
             ].map(system => (
               <div key={system.name} className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-bold text-[#e5e2e1]">{system.name}</p>
                   <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{system.status}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-xs font-mono text-[#8e8ea0]">{system.health}%</p>
                   <div className="w-24 h-1.5 bg-white/5 rounded-full mt-1 overflow-hidden">
                     <div className="h-full bg-[#d97757]" style={{ width: `${system.health}%` }}></div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
