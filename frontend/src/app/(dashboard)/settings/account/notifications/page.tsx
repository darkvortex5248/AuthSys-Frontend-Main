'use client';
import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`toggle-switch ${checked ? 'active' : 'inactive'}`}>
      <span className={`toggle-knob ${checked ? 'active' : 'inactive'}`} />
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest flex-shrink-0">{children}</p>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

export default function NotificationsPage() {
  const { selectedAppId } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { setMounted(true); }, []);

  const [notifSecurity, setNotifSecurity] = useState(true);
  const [notifUsage, setNotifUsage] = useState(true);
  const [notifBilling, setNotifBilling] = useState(true);
  const [notifUpdates, setNotifUpdates] = useState(false);
  const [notifToast, setNotifToast] = useState(true);

  useEffect(() => {
    api.get('/developer/notifications')
      .then(res => setNotifications(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get('/developer/auth/preferences').then(res => {
      const p = res.data;
      if (p.notifications) {
        if (p.notifications.security !== undefined) setNotifSecurity(p.notifications.security);
        if (p.notifications.usage !== undefined) setNotifUsage(p.notifications.usage);
        if (p.notifications.billing !== undefined) setNotifBilling(p.notifications.billing);
        if (p.notifications.updates !== undefined) setNotifUpdates(p.notifications.updates);
        if (p.notifications.toast !== undefined) setNotifToast(p.notifications.toast);
      }
    }).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!searchTerm) return notifications;
    const t = searchTerm.toLowerCase();
    return notifications.filter(n =>
      n.title?.toLowerCase().includes(t) || n.message?.toLowerCase().includes(t)
    );
  }, [notifications, searchTerm]);

  const severityColors: Record<string, { dot: string; bg: string; border: string }> = {
    info:     { dot: '#60a5fa', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    warning:  { dot: '#fbbf24', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    critical: { dot: '#f87171', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
    </div>
  );

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="premium-card p-8 md:p-10 space-y-6">
          <div className="sk h-6 w-44 rounded-lg" />
          <div className="sk h-4 w-64 rounded" />
          <div className="space-y-3 mt-4">
            {[1,2,3].map(i => <div key={i} className="sk h-12 w-full rounded-xl" />)}
          </div>
        </div>
        <div className="premium-card p-8 md:p-10 space-y-6">
          <div className="sk h-5 w-28 rounded-lg" />
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="sk h-12 w-full rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="premium-card p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-5">
          <div>
            <h3 className="text-2xl font-bold text-[var(--foreground)] mb-1">Notifications</h3>
            <p className="text-sm text-[var(--muted-foreground)]">Platform announcements and alerts</p>
          </div>
          <div className="relative flex-1 sm:flex-none max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-white/25">search</span>
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-xs text-white/75 focus:outline-none focus:border-[var(--primary)]/45 transition-all placeholder:text-white/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total', icon: 'notifications', color: 'var(--primary)', key: 'total' },
            { label: 'Critical', icon: 'warning', color: 'var(--danger)', key: 'critical' },
            { label: 'Info', icon: 'info', color: 'var(--ring)', key: 'info' },
          ].map((s, i) => (
            <div key={s.key} className="premium-card p-5 flex flex-col gap-4 group cursor-default">
              <div className="stat-icon-circle group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
              </div>
              <div>
                <p className="stat-label mb-1">{s.label}</p>
                <p className="text-3xl font-black text-white tabular-nums" style={{ color: s.color }}>
                  {s.key === 'total' ? notifications.length :
                   s.key === 'critical' ? notifications.filter(n => n.severity === 'critical').length :
                   notifications.filter(n => n.severity === 'info' || n.severity === 'warning').length}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="premium-card overflow-hidden divide-y divide-white/[0.03]">
          {filtered.length > 0 ? (
            filtered.map((n, i) => {
              const sc = severityColors[n.severity] || severityColors.info;
              return (
                <div key={n.id} className="flex items-start gap-4 px-7 py-5 hover:bg-white/[0.015] transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sc.bg} ${sc.border} border`}>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: sc.dot }}>
                      {n.severity === 'critical' ? 'error' : n.severity === 'warning' ? 'warning' : 'info'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-black text-white/90 truncate">{n.title}</p>
                      <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: `${sc.dot}15`, color: sc.dot }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                        {n.severity}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">{n.message}</p>
                  </div>
                  <p className="text-[10px] font-mono text-white/25 flex-shrink-0 mt-1">
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/8">
                <span className="material-symbols-outlined text-[24px] text-white/20">notifications_off</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-white/40 mb-1">No notifications</p>
                <p className="text-xs text-white/20 max-w-xs mx-auto leading-relaxed">
                  {searchTerm ? 'No notifications match your search.' : 'No platform announcements yet.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="premium-card p-8 md:p-10">
        <SectionLabel>Email alerts</SectionLabel>
        <div className="space-y-3 mb-8">
          {[
            { label: 'Security events', sub: 'Login attempts, passkey changes', val: notifSecurity, set: setNotifSecurity },
            { label: 'API usage threshold', sub: 'Notify at 80% of quota', val: notifUsage, set: setNotifUsage },
            { label: 'Billing & renewals', sub: 'Invoice and plan change emails', val: notifBilling, set: setNotifBilling },
            { label: 'Product updates', sub: 'New features and release notes', val: notifUpdates, set: setNotifUpdates },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between p-4 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">{row.label}</p>
                <p className="text-xs text-[var(--muted-foreground)] font-mono mt-0.5">{row.sub}</p>
              </div>
              <ToggleSwitch checked={row.val} onChange={row.set} />
            </div>
          ))}
        </div>

        <SectionLabel>In-app alerts</SectionLabel>
        <div className="space-y-3 mb-8">
          {[
            { label: 'Real-time toast notifications', sub: 'Success, error, and info toasts', val: notifToast, set: setNotifToast },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between p-4 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">{row.label}</p>
                <p className="text-xs text-[var(--muted-foreground)] font-mono mt-0.5">{row.sub}</p>
              </div>
              <ToggleSwitch checked={row.val} onChange={row.set} />
            </div>
          ))}
        </div>

        <button className="btn-primary" onClick={async () => {
          try {
            await api.put('/developer/auth/preferences', {
              notifications: { security: notifSecurity, usage: notifUsage, billing: notifBilling, updates: notifUpdates, toast: notifToast }
            });
            toast.success('Notification preferences saved');
          } catch { toast.error('Failed to save preferences'); }
        }}>
          <span className="material-symbols-outlined text-[16px]">save</span>
          Save preferences
        </button>
      </div>
    </div>
  );
}
