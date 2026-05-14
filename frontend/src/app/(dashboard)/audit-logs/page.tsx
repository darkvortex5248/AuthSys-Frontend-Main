'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function AuditLogsPage() {
  const { selectedAppId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  const fetchLogs = async () => {
    if (!selectedAppId) return;
    setLoading(true);
    try {
      // Reusing the app-specific analytics endpoint which returns recent activity
      const res = await api.get(`/developer/analytics/${selectedAppId}`);
      setLogs(res.data.recent_activity || []);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!selectedAppId) return;
    if (!confirm("Are you sure you want to clear all audit logs? This cannot be undone.")) return;
    try {
      await api.delete(`/developer/analytics/${selectedAppId}/logs`);
      setLogs([]);
      alert("Logs cleared successfully");
    } catch (err) {
      alert("Failed to clear logs");
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchLogs();
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

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="text-4xl font-bold text-[var(--vault-on-surface)] mb-2">Audit Logs</h2>
          <p className="text-[var(--vault-on-surface-variant)] font-medium">Historical activity for App ID: {selectedAppId}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchLogs}
            className="flex items-center gap-2 bg-white/5 text-[var(--vault-on-surface)] px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Refresh
          </button>
          <button 
            onClick={handleClearLogs}
            className="flex items-center gap-2 bg-red-400/5 text-red-400 px-4 py-2 rounded-lg border border-red-400/10 hover:bg-red-400/10 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-lg">delete_sweep</span>
            Clear Logs
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest">Event</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest">Details</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest">IP Address</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {logs.map((log, i) => (
                <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-5 text-xs text-[var(--vault-on-surface-variant)]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-bold text-[var(--vault-on-surface)] uppercase text-xs tracking-wider">{log.action_type}</span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs text-[var(--vault-on-surface-variant)] max-w-xs truncate font-medium">
                      {log.details?.reason || log.details?.note || 'System Event'}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono font-bold text-[var(--vault-on-surface)]">{log.ip_address}</span>
                      <span className="text-[10px] text-[var(--vault-on-surface-variant)] uppercase tracking-tighter">{log.country || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${log.is_suspicious ? 'bg-red-400/10 text-red-400' : 'bg-emerald-400/10 text-emerald-400'}`}>
                      {log.is_suspicious ? 'Suspicious' : 'Safe'}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[var(--vault-on-surface-variant)] text-sm">No activity logs found for this application.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
