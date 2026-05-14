'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function AnalyticsPage() {
  const { selectedAppId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchAnalytics = async () => {
    if (!selectedAppId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/developer/analytics/${selectedAppId}`);
      setStats(res.data);
    } catch (err: any) {
      console.error("Failed to fetch analytics", err);
      setError(err.response?.data?.detail || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (selectedAppId) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [selectedAppId]);

  if (!mounted) return null;

  if (!selectedAppId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-[var(--vault-on-surface-variant)]">
        <span className="material-symbols-outlined text-6xl mb-4 opacity-20">apps</span>
        <p className="text-xl font-bold">Please select an application first</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-[var(--vault-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <span className="material-symbols-outlined text-6xl text-red-400 mb-4 opacity-50">error</span>
        <h3 className="text-xl font-bold text-white mb-2">Analytics Error</h3>
        <p className="text-[var(--vault-on-surface-variant)] text-sm mb-6 max-w-md">{error}</p>
        <button 
          onClick={fetchAnalytics}
          className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest"
        >
          Retry Load
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-[var(--vault-on-surface)]">Analytics & Insights</h2>
          <p className="text-[var(--vault-on-surface-variant)] font-medium mt-1">Real-time performance for {stats.app_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Users', val: stats.total_users, icon: 'group', color: 'var(--vault-primary)' },
          { label: 'Active Sessions', val: stats.active_sessions, icon: 'bolt', color: 'var(--vault-secondary)', isLive: true },
          { label: 'Active Keys', val: stats.active_keys, icon: 'vpn_key', color: 'var(--vault-tertiary)' },
          { label: 'Banned Users', val: stats.banned_users, icon: 'block', color: 'red-400' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <span className="p-2 rounded-lg bg-white/5" style={{ color: stat.color }}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </span>
              {stat.isLive && (
                <span className="px-2 py-0.5 rounded bg-[var(--vault-primary)]/20 text-[var(--vault-primary)] font-bold flex items-center gap-2 uppercase tracking-tighter text-[10px]">
                  <span className="w-1.5 h-1.5 bg-[var(--vault-primary)] rounded-full animate-pulse"></span> Live
                </span>
              )}
            </div>
            <p className="text-[var(--vault-on-surface-variant)] text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-[var(--vault-on-surface)]">{stat.val}</h3>
          </div>
        ))}
      </div>

      <div className="glass-card p-8 rounded-xl mb-8 shadow-2xl">
        <h4 className="text-xl font-bold text-[var(--vault-on-surface)] mb-2">Authentication Trends</h4>
        <p className="text-[var(--vault-on-surface-variant)] text-sm font-medium mb-10">Daily logins over the last 7 days</p>
        
        <div className="h-80 relative flex items-end gap-2 pt-6">
          <div className="flex-1 h-full flex items-end justify-around pl-10 pr-4 border-l border-b border-white/5">
            {stats.chart_data.map((d: any, i: number) => {
              const maxVal = Math.max(...stats.chart_data.map((x: any) => x.logins), 10);
              const height = (d.logins / maxVal) * 100;
              return (
                <div key={i} className="group relative w-full flex flex-col items-center gap-0.5 cursor-pointer max-w-[40px]">
                  <div 
                    className={`w-full rounded-t transition-all duration-300 bg-[var(--vault-primary)]/40 hover:bg-[var(--vault-primary)]`} 
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] mt-2 uppercase">{d.name}</div>
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-[var(--vault-surface)] p-2 rounded text-[10px] border border-white/10 shadow-2xl z-10 whitespace-nowrap font-bold text-[var(--vault-primary)] transition-opacity">
                    {d.logins} Logins
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="glass-card p-8 rounded-xl shadow-2xl">
          <h4 className="text-xl font-bold text-[var(--vault-on-surface)] mb-8">Geographic Distribution</h4>
          <div className="space-y-6">
            {stats.top_countries.map((r: any, i: number) => (
              <div key={r.name} className="flex items-center gap-6">
                <span className="w-32 text-sm font-bold text-[var(--vault-on-surface)]">{r.name}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[var(--vault-primary)] transition-all duration-1000" 
                    style={{ width: `${(r.count / stats.total_users) * 100}%`, opacity: 1 - (i * 0.15) }}
                  ></div>
                </div>
                <span className="w-16 text-right text-[10px] font-bold text-[var(--vault-primary)] uppercase">{r.count} users</span>
              </div>
            ))}
            {stats.top_countries.length === 0 && (
              <p className="text-center py-10 text-[var(--vault-on-surface-variant)]">No geographic data available.</p>
            )}
          </div>
        </div>

        <div className="glass-card p-8 rounded-xl shadow-2xl">
          <h4 className="text-xl font-bold text-[var(--vault-on-surface)] mb-8">License Type Distribution</h4>
          <div className="space-y-6">
            {stats.key_usage.map((u: any, i: number) => (
              <div key={u.type} className="flex justify-between items-center px-4 py-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[var(--vault-primary)]">vpn_key</span>
                  <span className="text-sm font-bold text-[var(--vault-on-surface)] uppercase">{u.type}</span>
                </div>
                <span className="text-sm font-bold text-[var(--vault-primary)]">{u.count} keys</span>
              </div>
            ))}
            {stats.key_usage.length === 0 && (
              <p className="text-center py-10 text-[var(--vault-on-surface-variant)]">No keys generated yet.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
