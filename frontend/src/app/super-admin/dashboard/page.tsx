'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const res = await api.get('/admin/platform-stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#adc6ff]/20 border-t-[#adc6ff] rounded-full animate-spin"></div>
    </div>
  );

  const statCards = [
    { name: 'Total Developers', value: stats?.total_developers, icon: 'engineering', color: '#adc6ff' },
    { name: 'Total Applications', value: stats?.total_apps, icon: 'apps', color: '#d0bcff' },
    { name: 'Total End Users', value: stats?.total_end_users, icon: 'group', color: '#ffb786' },
    { name: 'Platform Revenue', value: `$${((stats?.total_revenue_cents || 0) / 100).toFixed(2)}`, icon: 'payments', color: '#adc6ff' },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="glass-card rounded-xl p-5 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 blur-3xl rounded-full opacity-10" style={{ backgroundColor: stat.color }}></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2 rounded-lg bg-surface-container-highest/50 text-[#adc6ff]" style={{ color: stat.color }}>
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
              </div>
              <span className="text-[#adc6ff] text-[12px] font-bold" style={{ color: stat.color }}>+12% ↑</span>
            </div>
            <h3 className="text-[#c2c6d6] text-[12px] font-bold uppercase tracking-widest">{stat.name}</h3>
            <p className="text-[28px] font-bold text-[#e1e2ec] mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-6 glass-card rounded-xl p-6">
           <h3 className="text-lg font-bold text-[#e1e2ec] mb-6 flex items-center gap-2">
             <span className="material-symbols-outlined text-[#adc6ff]">bolt</span>
             Quick Management
           </h3>
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
             {[
               { name: 'Add Plan', icon: 'add_card', link: '/super-admin/plans' },
               { name: 'SDKs', icon: 'upload_file', link: '/super-admin/sdk' },
               { name: 'Status', icon: 'settings_suggest', link: '/super-admin/settings' },
               { name: 'Broadcast', icon: 'campaign', link: '/super-admin/settings' },
             ].map(action => (
               <button key={action.name} className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#adc6ff]/30 transition-all group">
                 <span className="material-symbols-outlined text-2xl text-[#8c909f] group-hover:text-[#adc6ff] transition-colors">{action.icon}</span>
                 <span className="text-[10px] font-bold text-[#8c909f] group-hover:text-[#e1e2ec] uppercase tracking-widest">{action.name}</span>
               </button>
             ))}
           </div>
        </div>

        {/* System Health */}
        <div className="lg:col-span-4 glass-card rounded-xl p-6">
           <h3 className="text-lg font-bold text-[#e1e2ec] mb-6 flex items-center gap-2">
             <span className="material-symbols-outlined text-[#ffb786]">health_and_safety</span>
             System Health
           </h3>
           <div className="space-y-5">
             {[
               { name: 'Auth API Gateway', status: 'Optimal', health: 99, color: 'text-green-500' },
               { name: 'Database Cluster', status: 'Stable', health: 95, color: 'text-green-500' },
               { name: 'CDN & Downloads', status: 'Optimal', health: 100, color: 'text-green-500' },
             ].map(system => (
               <div key={system.name} className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-bold text-[#e1e2ec]">{system.name}</p>
                   <p className={`text-[10px] font-bold ${system.color} uppercase tracking-widest`}>{system.status}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-xs font-mono text-[#8c909f]">{system.health}%</p>
                   <div className="w-24 h-1.5 bg-white/5 rounded-full mt-1 overflow-hidden">
                     <div className="h-full bg-[#adc6ff]" style={{ width: `${system.health}%` }}></div>
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
