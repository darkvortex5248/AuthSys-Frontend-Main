'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<any[] | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState('info');
  const [sending, setSending] = useState(false);

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

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await adminApi.get<{ services: any[] }>('/admin/health');
        setHealth(res.data.services || null);
      } catch {
        setHealth(null);
      }
    };
    fetchHealth();
  }, []);

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) {
      toast.error('Please enter both title and message');
      return;
    }
    setSending(true);
    try {
      await adminApi.post('/admin/announcements', {
        title: broadcastTitle,
        message: broadcastMsg,
        severity: broadcastSeverity,
      });
      toast.success('Announcement sent to all users');
      setShowBroadcast(false);
      setBroadcastTitle('');
      setBroadcastMsg('');
      setBroadcastSeverity('info');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send announcement');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
    </div>
  );

  const statCards = [
    { name: 'Total Developers', value: stats?.total_developers, icon: 'engineering', color: 'var(--primary)' },
    { name: 'Total Applications', value: stats?.total_apps, icon: 'apps', color: '#e8a87c' },
    { name: 'Total End Users', value: stats?.total_end_users, icon: 'group', color: '#34d399' },
    { name: 'Platform Revenue', value: `$${((stats?.total_revenue_cents || 0) / 100).toFixed(2)}`, icon: 'payments', color: 'var(--primary)' },
  ];

  const healthServices = health || [
    { name: 'Auth API Gateway', status: 'Optimal', health: 99 },
    { name: 'Database Cluster', status: 'Stable', health: 95 },
    { name: 'CDN & Downloads', status: 'Optimal', health: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Monitor and manage your entire platform from one place</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowBroadcast(true)}
            className="px-4 py-2.5 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">campaign</span>
            Broadcast
          </button>
          <button onClick={() => router.push('/super-admin/status')}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--muted-foreground)] hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">monitor_heart</span>
            System Health
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="glass-card rounded-xl p-5 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 blur-3xl rounded-full opacity-10" style={{ backgroundColor: stat.color }}></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
              </div>
            </div>
            <h3 className="text-[var(--muted-foreground)] text-[10px] font-bold uppercase tracking-widest">{stat.name}</h3>
            <p className="text-2xl font-black text-[var(--foreground)] mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Quick Management + System Health ── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        <div className="lg:col-span-6 glass-card rounded-xl p-6">
           <h3 className="text-sm font-black text-[var(--foreground)] mb-5 flex items-center gap-2 uppercase tracking-widest">
             <span className="material-symbols-outlined text-[var(--primary)] text-lg">bolt</span>
             Quick Actions
           </h3>
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
             {[
               { name: 'SDKs', icon: 'upload_file', path: '/super-admin/sdk' },
               { name: 'Settings', icon: 'settings_suggest', path: '/super-admin/settings' },
               { name: 'Broadcast', icon: 'campaign', path: null },
             ].map(action => (
               <button key={action.name} onClick={() => action.path ? router.push(action.path) : setShowBroadcast(true)}
                 className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[var(--primary)]/30 transition-all group">
                 <span className="material-symbols-outlined text-xl text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors">{action.icon}</span>
                 <span className="text-[9px] font-bold text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] uppercase tracking-widest">{action.name}</span>
               </button>
             ))}
           </div>
        </div>
        <div className="lg:col-span-4 glass-card rounded-xl p-6">
           <h3 className="text-sm font-black text-[var(--foreground)] mb-5 flex items-center gap-2 uppercase tracking-widest">
             <span className="material-symbols-outlined text-emerald-400 text-lg">health_and_safety</span>
             System Health
             {!health && <span className="text-[8px] text-white/20 font-normal ml-auto">(demo data)</span>}
           </h3>
           <div className="space-y-4">
             {healthServices.map(system => (
               <div key={system.name} className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-bold text-[var(--foreground)]">{system.name}</p>
                   <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-0.5">{system.status}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-xs font-mono text-[var(--muted-foreground)]">{system.health}%</p>
                   <div className="w-24 h-1.5 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                     <div className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-emerald-400" style={{ width: `${system.health}%` }}></div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* ── Quick Nav Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { name: 'Developers', icon: 'engineering', path: '/super-admin/developers', color: 'var(--primary)' },
          { name: 'Applications', icon: 'apps', path: '/super-admin/applications', color: '#e8a87c' },
          { name: 'End Users', icon: 'group', path: '/super-admin/end-users', color: '#34d399' },
          { name: 'Audit Logs', icon: 'history', path: '/super-admin/audit-logs', color: '#60a5fa' },
          { name: 'Payments', icon: 'payments', path: '/super-admin/payments', color: '#c084fc' },
          { name: 'AI Control', icon: 'smart_toy', path: '/super-admin/ai', color: '#f472b6' },
          { name: 'Rate Limits', icon: 'speed', path: '/super-admin/rate-limits', color: '#fb923c' },
        ].map(item => (
          <button key={item.name} onClick={() => router.push(item.path)}
            className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-white/[0.07] transition-all border border-transparent hover:border-white/10 group">
            <span className="material-symbols-outlined text-xl" style={{ color: item.color }}>{item.icon}</span>
            <span className="text-[9px] font-bold text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] uppercase tracking-widest text-center">{item.name}</span>
          </button>
        ))}
      </div>

      {/* ── Broadcast Modal ── */}
      {showBroadcast && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-lg glass-card rounded-2xl p-8 border border-white/10 shadow-2xl">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Send Announcement</h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">Broadcast a message to all developers on the platform.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Severity</label>
                <div className="flex gap-2">
                  {['info', 'warning', 'critical'].map(s => (
                    <button key={s} type="button" onClick={() => setBroadcastSeverity(s)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                        broadcastSeverity === s
                          ? s === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : s === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30'
                          : 'bg-white/5 text-[var(--muted-foreground)] border border-white/10 hover:bg-white/10'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Title</label>
                <input value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)}
                  className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-[var(--foreground)]" placeholder="e.g. Scheduled Maintenance" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Message</label>
                <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} rows={4}
                  className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-[var(--foreground)] resize-none"
                  placeholder="Describe the announcement..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleBroadcast} disabled={sending}
                className="flex-1 px-6 py-3 rounded-xl bg-[var(--primary)] text-[#131313] font-bold text-xs uppercase tracking-widest disabled:opacity-50">
                {sending ? 'Sending...' : 'Send Announcement'}
              </button>
              <button onClick={() => setShowBroadcast(false)}
                className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-xs uppercase tracking-widest text-[var(--foreground)]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
