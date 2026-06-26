'use client';
import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';
import {
  useAuditLogs,
  useClearAuditLogs,
} from '@/hooks/use-developer-queries';

const LOG_DISPLAY_LIMIT = 50;

const EVENT_COLORS: Record<string, string> = {
  LOGIN:'#60a5fa', LOGOUT:'#94a3b8', DELETE:'#f87171',
  CREATE:'#34d399', UPDATE:'#fbbf24', ACCESS:'#a78bfa',
};
function getEventColor(action: string) {
  const key = Object.keys(EVENT_COLORS).find(k => action?.toUpperCase().includes(k));
  return key ? EVENT_COLORS[key] : '#94a3b8';
}

export default function AuditLogsPage() {
  const { selectedAppId } = useAuthStore();
  const confirm = useConfirm();
  const { data: logs = [], isLoading: loading, isFetching, refetch } = useAuditLogs(selectedAppId);
  const clearMutation = useClearAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filteredLogs = useMemo(() => {
    let result = logs;
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      result = logs.filter(l =>
        l.action_type?.toLowerCase().includes(t) ||
        l.details?.reason?.toLowerCase().includes(t) ||
        l.details?.note?.toLowerCase().includes(t) ||
        l.ip_address?.toLowerCase().includes(t) ||
        l.country?.toLowerCase().includes(t)
      );
    }
    return showAll ? result : result.slice(0, LOG_DISPLAY_LIMIT);
  }, [logs, searchTerm, showAll]);

  const hasMore = logs.length > LOG_DISPLAY_LIMIT;

  const handleClearLogs = async () => {
    if (!selectedAppId) return;
    const ok = await confirm({
      title: 'Clear audit logs?',
      message: 'Are you sure you want to clear all audit logs? This cannot be undone.',
      confirmLabel: 'Yes, clear all', cancelLabel: 'No, cancel', variant: 'danger',
    });
    if (!ok) return;
    try {
      await clearMutation.mutateAsync(selectedAppId);
      toast.success('Logs cleared successfully');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to clear logs';
      toast.error(msg);
    }
  };

  const stats = useMemo(() => ({
    total: logs.length,
    suspicious: logs.filter(l => l.is_suspicious).length,
    safe: logs.filter(l => !l.is_suspicious).length,
    latest: logs.length > 0 ? new Date(logs[0]?.timestamp).toLocaleDateString() : '\u2014',
  }), [logs]);

  if (!selectedAppId) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-[var(--accent-opacity-8)] border border-[var(--border)] flex items-center justify-center">
        <span className="material-symbols-outlined text-[28px] text-[var(--muted-foreground)]">event_note</span>
      </div>
      <div className="text-center">
        <p className="text-[var(--foreground)]/50 font-bold text-sm">No application selected</p>
        <p className="text-[var(--muted-foreground)] text-xs mt-1">Select an app from the top menu</p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="space-y-6 animate-pulse pt-6">
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <div className="h-10 w-72 bg-[var(--accent-opacity-8)] rounded-xl" />
          <div className="h-4 w-52 bg-[var(--accent-opacity-8)] rounded-xl" />
        </div>
        <div className="h-12 w-44 bg-[var(--accent-opacity-8)] rounded-2xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-[var(--accent-opacity-8)] border border-[var(--border)] rounded-2xl" />)}
      </div>
      <div className="h-72 bg-[var(--accent-opacity-8)] border border-[var(--border)] rounded-2xl" />
    </div>
  );

  return (
    <div className="page-wrapper pt-6 overflow-visible">
      <style>{`
        @keyframes rowIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes statPop {
          0%   { transform:scale(0.9); opacity:0; }
          60%  { transform:scale(1.04); }
          100% { transform:scale(1); opacity:1; }
        }
        .al-row { animation:rowIn 0.3s ease-out both; will-change:transform,opacity; }
        .al-row:hover td { background:rgba(255,255,255,0.02); }
      `}</style>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-5">
        <div>
          <nav className="breadcrumb mb-2">
            <span>Developer</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="breadcrumb-active">Audit Logs</span>
          </nav>
          <h1 className="page-title leading-none">Audit Logs</h1>
          <p className="text-white/35 mt-2 text-sm font-medium">
            App ID: <span className="font-mono text-[var(--primary)]/70 text-xs">{selectedAppId}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => refetch()} disabled={isFetching} className="btn-ghost">
            <span className={`material-symbols-outlined text-[16px]${isFetching ? ' animate-spin' : ''}`}>refresh</span>
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={handleClearLogs} className="btn-danger">
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            Clear Logs
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Events',  icon: 'timeline',      color: 'var(--primary)', key: 'total' },
          { label: 'Suspicious',     icon: 'warning',       color: 'var(--danger)',  key: 'suspicious' },
          { label: 'Safe',           icon: 'verified',      color: 'var(--success)', key: 'safe' },
          { label: 'Latest Event',   icon: 'calendar_today',color: 'var(--ring)',    key: 'latest' },
        ].map((s, i) => (
          <div
            key={s.key}
            className="premium-card p-5 flex flex-col gap-4 group cursor-default"
            style={{ animation: `statPop 0.4s ease-out both ${i * 60}ms` }}
          >
            <div className="stat-icon-circle group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
            </div>
            <div>
              <p className="stat-label mb-1">{s.label}</p>
              <p className="text-3xl font-black text-white tabular-nums" style={{ color: s.color }}>
                {stats[s.key as keyof typeof stats]}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="premium-card overflow-hidden">
        <div className="px-7 py-5 border-b border-white/5 bg-white/[0.015] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px] text-[var(--primary)]/60">event_note</span>
            <h3 className="section-title">Activity Log</h3>
            {filteredLogs.length !== logs.length && (
              <span className="text-[9px] bg-[var(--primary)]/10 text-[var(--primary)] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                {filteredLogs.length} of {logs.length}
              </span>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-white/25">search</span>
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full sm:w-52 pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-xs text-white/75 focus:outline-none focus:border-[var(--primary)]/45 transition-all placeholder:text-white/20"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                {[
                  { label: 'Timestamp', w: 'w-36' },
                  { label: 'Event',     w: 'w-24' },
                  { label: 'Details',   w: '' },
                  { label: 'IP Address',w: 'w-36' },
                  { label: 'Risk',      w: 'w-20' },
                ].map(h => (
                  <th key={h.label} className={`px-6 py-4 stat-label border-b border-white/5 ${h.w}`}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, i) => {
                  const risk = log.is_suspicious
                    ? { label: 'Suspicious', color: '#f87171', dot: '#ef4444', bg: 'rgba(248,113,113,0.1)' }
                    : { label: 'Safe',       color: '#34d399', dot: '#10b981', bg: 'rgba(52,211,153,0.1)' };
                  const evColor = getEventColor(log.action_type);
                  return (
                    <tr key={log.id ?? i} className="al-row group cursor-default" style={{ animationDelay: `${i * 20}ms` }}>
                      <td className="px-6 py-4 align-middle">
                        <p className="text-[12px] font-bold text-white/85 tabular-nums">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] font-mono text-white/40 mt-0.5">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border whitespace-nowrap"
                          style={{ color: evColor, background: `${evColor}14`, borderColor: `${evColor}28` }}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {log.action_type?.toUpperCase().includes('DELETE') ? 'delete' :
                             log.action_type?.toUpperCase().includes('CREATE') ? 'add_circle' :
                             log.action_type?.toUpperCase().includes('UPDATE') ? 'edit' :
                             log.action_type?.toUpperCase().includes('LOGIN')  ? 'login' :
                             log.action_type?.toUpperCase().includes('ACCESS') ? 'key' : 'circle'}
                          </span>
                          {log.action_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <p className="text-xs text-white/70 max-w-[200px] truncate font-medium">
                          {log.details?.reason || log.details?.note || 'System Event'}
                        </p>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <p className="font-mono text-[11px] font-bold text-white/80">{log.ip_address}</p>
                        {log.country && (
                          <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">{log.country}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                          style={{ color: risk.color, background: risk.bg }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: risk.dot }} />
                          {risk.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/8">
                        <span className="material-symbols-outlined text-[24px] text-white/20">event_busy</span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-white/40 mb-1">No activity logs found</p>
                        <p className="text-xs text-white/20 max-w-xs mx-auto leading-relaxed">
                          {searchTerm ? 'No logs match your search.' : 'No activity recorded for this application yet.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Show More ── */}
        {hasMore && !showAll && !searchTerm && (
          <div className="px-7 py-4 border-t border-white/5 flex justify-center">
            <button
              onClick={() => setShowAll(true)}
              className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
              Show all {logs.length} logs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
