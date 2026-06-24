'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';

const EVENT_TYPES = [
  'all', 'admin.login', 'admin.action', 'developer.created', 'developer.banned',
  'plan.created', 'plan.updated', 'plan.deleted', 'payment.completed',
  'payment.failed', 'app.created', 'app.deleted', 'settings.updated',
  'sdk.updated', 'broadcast.sent',
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 25;

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (eventFilter !== 'all') params.set('event', eventFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      params.set('page', page.toString());
      params.set('per_page', perPage.toString());
      const res = await adminApi.get<any>(`/admin/audit-logs?${params}`);
      const data = res.data;
      setLogs(Array.isArray(data) ? data : data?.logs || []);
      setTotal(data?.total || (Array.isArray(data) ? data.length : 0));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [eventFilter, page]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  if (loading && logs.length === 0) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Audit Logs</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Track all administrative actions across the platform</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Event:</span>
          <select value={eventFilter} onChange={e => { setEventFilter(e.target.value); setPage(1); }}
            className="bg-[var(--card)]/50 border border-white/10 rounded-xl py-2 px-3 text-xs text-[var(--foreground)] outline-none">
            {EVENT_TYPES.map(ev => (
              <option key={ev} value={ev} className="bg-[#0b0e15]">{ev === 'all' ? 'All Events' : ev}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">From:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="bg-[var(--card)]/50 border border-white/10 rounded-xl py-2 px-3 text-xs text-[var(--foreground)] outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">To:</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="bg-[var(--card)]/50 border border-white/10 rounded-xl py-2 px-3 text-xs text-[var(--foreground)] outline-none" />
        </div>
        <button onClick={() => { setPage(1); fetchLogs(); }}
          className="px-4 py-2 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[10px] font-bold text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-all">
          Apply Filters
        </button>
      </div>

      <div className="glass-card rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Event</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Admin</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Details</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log: any, i: number) => (
                <tr key={log.id || i} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-[var(--muted-foreground)]">{new Date(log.timestamp || log.created_at).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-black uppercase tracking-widest">{log.event || log.action}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[var(--foreground)]">{log.admin_username || log.admin || 'System'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[var(--muted-foreground)] max-w-xs truncate block">{log.details || log.message || '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-[var(--muted-foreground)]">{log.ip_address || log.ip || '—'}</span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-[var(--muted-foreground)] text-sm italic">No audit log entries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-[var(--foreground)] disabled:opacity-30 hover:bg-white/10 transition-all">
            Previous
          </button>
          <span className="text-xs text-[var(--muted-foreground)]">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-[var(--foreground)] disabled:opacity-30 hover:bg-white/10 transition-all">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
