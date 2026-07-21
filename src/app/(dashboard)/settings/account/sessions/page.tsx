'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

function getDeviceIcon(userAgent: string): string {
  const ua = (userAgent || '').toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'smartphone';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) return 'computer';
  return 'devices';
}

function getDeviceLabel(userAgent: string): string {
  const ua = userAgent || '';
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua) && /Mobile/i.test(ua)) return 'Android Phone';
  if (/Android/i.test(ua)) return 'Android Tablet';
  if (/Windows NT/i.test(ua)) return 'Windows PC';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown device';
}

function getBrowserLabel(userAgent: string): string {
  const ua = userAgent || '';
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera';
  if (/Chrome\//i.test(ua)) return 'Chrome';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Safari\//i.test(ua)) return 'Safari';
  return 'Unknown browser';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [loggingOut, setLoggingOut] = useState<string | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    api.get('/developer/sessions')
      .then(r => setSessions(r.data))
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async (id: string, isCurrent: boolean) => {
    setLoggingOut(id);
    try {
      await api.post(`/developer/sessions/logout/${id}`);
      setSessions(prev => prev.filter(x => x.id !== id));
      toast.success(isCurrent ? 'Logged out of current session' : 'Session ended');
    } catch {
      toast.error('Failed to end session');
    } finally {
      setLoggingOut(null);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirmLogoutAll) {
      setConfirmLogoutAll(true);
      setTimeout(() => setConfirmLogoutAll(false), 4000);
      return;
    }
    setLoggingOutAll(true);
    try {
      await api.post('/developer/sessions/logout-all');
      setSessions(prev => prev.filter(s => s.is_current));
      toast.success('All other sessions ended');
    } catch {
      toast.error('Failed to end sessions');
    } finally {
      setLoggingOutAll(false);
      setConfirmLogoutAll(false);
    }
  };

  const otherSessions = sessions.filter(s => !s.is_current);
  const currentSession = sessions.find(s => s.is_current);

  if (!mounted) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="premium-card p-8 md:p-10 space-y-5">
          <div className="sk h-6 w-44 rounded-lg" />
          <div className="sk h-4 w-72 rounded" />
          <div className="space-y-3 mt-6">
            {[1,2,3].map(i => <div key={i} className="sk h-16 w-full rounded-xl" />)}
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

  return (
    <section className="premium-card p-8 md:p-10 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] tracking-tight">Active Sessions</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Devices currently logged into your account
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold tabular-nums">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
          </span>
          {otherSessions.length > 0 && (
            <button
              onClick={handleLogoutAll}
              disabled={loggingOutAll}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                confirmLogoutAll
                  ? 'bg-red-500 text-white'
                  : 'bg-red-500/10 hover:bg-red-500/15 text-red-400 border border-red-500/20'
              } disabled:opacity-50`}
            >
              {loggingOutAll
                ? <span className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                : <span className="material-symbols-outlined text-[13px]">logout</span>
              }
              {confirmLogoutAll ? 'Confirm?' : `End ${otherSessions.length} other`}
            </button>
          )}
        </div>
      </div>

      {/* Sessions */}
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--card)] border border-white/8 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-[var(--muted-foreground)]/60">devices_off</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">No active sessions</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">You'll see your logged-in devices here</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">

          {/* Current session first */}
          {currentSession && (
            <SessionCard
              session={currentSession}
              loggingOut={loggingOut === currentSession.id}
              onLogout={handleLogout}
            />
          )}

          {/* Divider if there are other sessions */}
          {otherSessions.length > 0 && (
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[10px] text-[var(--muted-foreground)] font-medium uppercase tracking-widest">Other devices</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
          )}

          {otherSessions.map(s => (
            <SessionCard
              key={s.id}
              session={s}
              loggingOut={loggingOut === s.id}
              onLogout={handleLogout}
            />
          ))}

        </div>
      )}

    </section>
  );
}

function SessionCard({ session: s, loggingOut, onLogout }: {
  session: any;
  loggingOut: boolean;
  onLogout: (id: string, isCurrent: boolean) => void;
}) {
  const deviceIcon = getDeviceIcon(s.user_agent);
  const deviceLabel = s.device_name || getDeviceLabel(s.user_agent);
  const browserLabel = getBrowserLabel(s.user_agent);

  return (
    <div className={`premium-card p-4 flex items-center gap-4 border transition-all ${s.is_current ? 'border-[var(--primary)]/25' : 'border-white/5'}`}>

      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.is_current ? 'bg-[var(--primary)]/15' : 'bg-white/5'}`}>
        <span className={`material-symbols-outlined text-xl ${s.is_current ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}>
          {deviceIcon}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-[var(--foreground)] truncate">{deviceLabel}</p>
          {s.is_current && (
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Current</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[11px] text-[var(--muted-foreground)]">{browserLabel}</span>
          <span className="text-[var(--muted-foreground)]/30 text-[10px]">•</span>
          <span className="text-[11px] text-[var(--muted-foreground)] font-mono">{s.ip_address || '—'}</span>
          <span className="text-[var(--muted-foreground)]/30 text-[10px]">•</span>
          <span className="text-[11px] text-[var(--muted-foreground)]">{timeAgo(s.last_activity)}</span>
        </div>
      </div>

      {/* Action */}
      <button
        onClick={() => onLogout(s.id, s.is_current)}
        disabled={loggingOut}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
          s.is_current
            ? 'hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400'
            : 'bg-red-500/8 hover:bg-red-500/15 text-red-400 border border-red-500/15'
        }`}
      >
        {loggingOut
          ? <span className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
          : <span className="material-symbols-outlined text-[13px]">logout</span>
        }
        {s.is_current ? 'Sign out' : 'End'}
      </button>

    </div>
  );
}