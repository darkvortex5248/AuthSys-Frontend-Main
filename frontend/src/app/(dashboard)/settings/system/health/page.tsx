'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { isFeatureLocked } from '@/lib/plan-access';
import { useDeveloperMe } from '@/hooks/use-developer-queries';
import PremiumLocked from '@/components/PremiumLocked';

function StatCard({
  label, value, icon, color = 'text-[var(--foreground)]', bg = 'bg-white/5', sub,
}: {
  label: string; value: string | number; icon: string;
  color?: string; bg?: string; sub?: string;
}) {
  return (
    <div className="premium-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
          <span className={`material-symbols-outlined text-[16px] ${color}`}>{icon}</span>
        </div>
      </div>
      <div>
        <p className={`text-3xl font-black tracking-tight ${color}`}>{value}</p>
        {sub && <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function UptimeBars({ checks }: { checks: any[] }) {
  const recent = checks?.slice(-30) ?? [];
  const upCount = recent.filter(c => c.is_up).length;

  return (
    <div className="premium-card p-5 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Uptime history</p>
          <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">Last {recent.length} checks</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
          upCount === recent.length ? 'bg-emerald-500/10 text-emerald-400' :
          upCount >= recent.length * 0.9 ? 'bg-yellow-500/10 text-yellow-400' :
          'bg-red-500/10 text-red-400'
        }`}>
          {recent.length > 0 ? `${Math.round((upCount / recent.length) * 100)}% up` : '—'}
        </span>
      </div>

      {recent.length > 0 ? (
        <div className="flex items-end gap-1">
          {recent.map((c: any, i: number) => (
            <div
              key={i}
              title={`${c.is_up ? 'Up' : 'Down'} · ${c.status_code ?? '—'} · ${c.response_time_ms ?? '?'}ms`}
              className={`flex-1 rounded-sm transition-all hover:opacity-100 ${
                c.is_up ? 'bg-emerald-500/50 hover:bg-emerald-400' : 'bg-red-500/60 hover:bg-red-400'
              }`}
              style={{ height: c.is_up ? `${Math.min(40, 20 + (c.response_time_ms ?? 100) / 20)}px` : '40px' }}
            />
          ))}
        </div>
      ) : (
        <div className="h-10 flex items-center justify-center text-xs text-[var(--muted-foreground)]">No check data</div>
      )}

      <div className="flex items-center gap-4 mt-3">
        <span className="flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]">
          <span className="w-2 h-2 rounded-sm bg-emerald-500/50" />Up
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]">
          <span className="w-2 h-2 rounded-sm bg-red-500/60" />Down
        </span>
        <span className="ml-auto text-[10px] text-[var(--muted-foreground)]">Bar height = response time</span>
      </div>
    </div>
  );
}

export default function HealthPage() {
  const { data: profile } = useDeveloperMe(true);
  const locked = isFeatureLocked('developer', profile?.subscription_tier);

  const [apps, setApps] = useState<any[]>([]);
  const [selApp, setSelApp] = useState<number | null>(null);
  const [dash, setDash] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [dashLoading, setDashLoading] = useState(false);
  const [retForm, setRetForm] = useState({ retention_days: 30, auto_cleanup: true });
  const [savingRet, setSavingRet] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (locked) return <PremiumLocked feature="Health Monitoring" tier="Developer" />;

  useEffect(() => {
    api.get('/developer/apps')
      .then(r => setApps(r.data))
      .catch(() => toast.error('Failed to load apps'))
      .finally(() => setLoading(false));
  }, []);

  const loadHealth = async (appId: number) => {
    if (selApp === appId) return;
    setSelApp(appId);
    setDash(null);
    setDashLoading(true);
    try {
      const [d, r] = await Promise.all([
        api.get(`/developer/health/dashboard/${appId}`),
        api.get(`/developer/health/retention/${appId}`),
      ]);
      setDash(d.data);
      setRetForm({ retention_days: r.data.retention_days, auto_cleanup: r.data.auto_cleanup });
    } catch {
      toast.error('Failed to load health data');
      setSelApp(null);
    } finally {
      setDashLoading(false);
    }
  };

  const handleSaveRetention = async () => {
    if (!selApp) return;
    if (retForm.retention_days < 1 || retForm.retention_days > 365) {
      toast.error('Retention days must be between 1 and 365');
      return;
    }
    setSavingRet(true);
    try {
      await api.put(`/developer/health/retention/${selApp}`, { app_id: selApp, ...retForm });
      toast.success('Retention settings saved');
    } catch {
      toast.error('Failed to save retention settings');
    } finally {
      setSavingRet(false);
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="premium-card p-8 md:p-10 space-y-6">
          <div className="sk h-6 w-36 rounded-lg" />
          <div className="sk h-4 w-64 rounded" />
          <div className="flex gap-3 mt-4">
            <div className="sk h-10 w-48 rounded-xl" />
            <div className="sk h-10 w-32 rounded-xl" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="premium-card p-5 space-y-3"><div className="sk h-4 w-20 rounded" /><div className="sk h-8 w-16 rounded" /><div className="sk h-3 w-24 rounded" /></div>)}
          </div>
          <div className="premium-card p-5 space-y-4">
            <div className="sk h-5 w-28 rounded-lg" />
            <div className="flex gap-1">{Array.from({length:30}).map((_,i) => <div key={i} className="flex-1 sk h-8 rounded-sm" />)}</div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  const uptimeColor =
    dash?.uptime_percentage >= 99 ? 'text-emerald-400' :
    dash?.uptime_percentage >= 95 ? 'text-yellow-400' : 'text-red-400';

  const uptimeBg =
    dash?.uptime_percentage >= 99 ? 'bg-emerald-500/10' :
    dash?.uptime_percentage >= 95 ? 'bg-yellow-500/10' : 'bg-red-500/10';

  return (
    <section className="premium-card p-8 md:p-10 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] tracking-tight">Health & Logs</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Monitor uptime, usage, and configure log retention per app
          </p>
        </div>
        {selApp && dash && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${uptimeBg} ${uptimeColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              dash.uptime_percentage >= 99 ? 'bg-emerald-400' :
              dash.uptime_percentage >= 95 ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            {dash.uptime_percentage >= 99 ? 'All systems operational' :
             dash.uptime_percentage >= 95 ? 'Degraded performance' : 'Service disruption'}
          </div>
        )}
      </div>

      {/* App selector */}
      {apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--card)] border border-white/8 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-[var(--muted-foreground)]/60">grid_view</span>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">No apps found — create an app first</p>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {apps.map(a => (
            <button
              key={a.id}
              onClick={() => loadHealth(a.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                selApp === a.id
                  ? 'bg-[var(--primary)]/15 border-[var(--primary)]/30 text-[var(--primary)]'
                  : 'bg-[var(--card)]/50 border-white/5 text-[var(--muted-foreground)] hover:border-white/10 hover:text-[var(--foreground)]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">grid_view</span>
              {a.name}
            </button>
          ))}
        </div>
      )}

      {/* Dashboard loading */}
      {dashLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!selApp && !dashLoading && apps.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--card)] border border-white/8 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-[var(--muted-foreground)]/60">monitor_heart</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">Select an app</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Choose an app above to view its health dashboard</p>
          </div>
        </div>
      )}

      {/* Dashboard */}
      {dash && !dashLoading && (
        <div className="space-y-6">

          {/* Stat grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Uptime"
              value={`${dash.uptime_percentage ?? 0}%`}
              icon="monitoring"
              color={uptimeColor}
              bg={uptimeBg}
              sub="All time"
            />
            <StatCard
              label="Logins (24h)"
              value={dash.logins_24h ?? 0}
              icon="login"
              color="text-[var(--primary)]"
              bg="bg-[var(--primary)]/10"
              sub="Successful"
            />
            <StatCard
              label="Active users"
              value={dash.active_users_30d ?? 0}
              icon="group"
              color="text-blue-400"
              bg="bg-blue-500/10"
              sub="Last 30 days"
            />
            <StatCard
              label="Errors (7d)"
              value={dash.login_errors_7d ?? 0}
              icon="error"
              color={dash.login_errors_7d > 10 ? 'text-red-400' : 'text-yellow-400'}
              bg={dash.login_errors_7d > 10 ? 'bg-red-500/10' : 'bg-yellow-500/10'}
              sub={dash.login_errors_7d > 10 ? 'Needs attention' : 'Within threshold'}
            />
          </div>

          {/* Uptime bars */}
          <UptimeBars checks={dash.recent_checks ?? []} />

          {/* Log retention */}
          <div className="premium-card p-5 border border-white/5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] text-[var(--primary)]">history</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Log retention</p>
                <p className="text-xs text-[var(--muted-foreground)]">How long activity logs are stored before deletion</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* Retention days */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Retention period
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={retForm.retention_days}
                    onChange={e => setRetForm({ ...retForm, retention_days: parseInt(e.target.value) || 30 })}
                    className="w-full bg-[var(--card)]/50 border border-white/8 rounded-xl px-4 py-2.5 pr-14 text-sm text-[var(--foreground)] focus:border-[var(--primary)]/40 outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)] pointer-events-none">days</span>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)]/70">Between 1 and 365 days</p>
              </div>

              {/* Auto cleanup toggle */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Auto-cleanup
                </label>
                <button
                  type="button"
                  onClick={() => setRetForm(f => ({ ...f, auto_cleanup: !f.auto_cleanup }))}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    retForm.auto_cleanup
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                      : 'bg-white/5 border-white/8 text-[var(--muted-foreground)]'
                  }`}
                >
                  <div className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${retForm.auto_cleanup ? 'bg-emerald-500' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${retForm.auto_cleanup ? 'left-[calc(100%-18px)]' : 'left-0.5'}`} />
                  </div>
                  {retForm.auto_cleanup ? 'Enabled — logs auto-delete' : 'Disabled — manual only'}
                </button>
                <p className="text-[11px] text-[var(--muted-foreground)]/70">
                  {retForm.auto_cleanup ? 'Logs older than the period will be deleted automatically' : 'Logs will persist until manually removed'}
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveRetention}
              disabled={savingRet}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
            >
              {savingRet
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <span className="material-symbols-outlined text-[16px]">save</span>
              }
              {savingRet ? 'Saving…' : 'Save retention'}
            </button>
          </div>

        </div>
      )}

    </section>
  );
}