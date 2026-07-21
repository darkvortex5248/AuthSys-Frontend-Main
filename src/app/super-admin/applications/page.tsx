'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';

export default function AppOversightPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 50;

  useEffect(() => {
    const fetch = async () => {
      try {
        const params = `?page=${page}&per_page=${perPage}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
        const res = await adminApi.get<{ items: any[]; total: number }>(`/admin/applications${params}`);
        setApps(res.data.items || []);
        setTotal(res.data.total || 0);
      } catch (err: any) {
        toast.error(err.response?.data?.detail || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page, search]);

  const totalPages = Math.ceil(total / perPage);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Application Oversight</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Browse and manage all applications on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            const headers = ['ID','Name','Owner','Users','Keys','Version','Status','Created'];
            const rows = apps.map((a: any) => [a.id, a.name, a.owner||'', a.user_count||0, a.key_count||0, a.version||'', a.status||'', a.created_at?new Date(a.created_at).toLocaleString():'']);
            const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
            const blob = new Blob([csv], {type:'text/csv'});
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'applications.csv';
            a.click(); URL.revokeObjectURL(a.href);
          }} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--muted-foreground)] hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>CSV
          </button>
        <div className="relative w-full sm:w-auto">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-sm">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-[var(--card)]/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)]"
            placeholder="Search by name, ID, or owner..." />
        </div>
        </div>
      </div>

      <div className="glass-card rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">App ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Owner</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Users</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Keys</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Created</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {apps.map((app: any) => (
                <tr key={app.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-[var(--primary)]">{app.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{app.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[var(--muted-foreground)]">{app.owner || app.owner_id || '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-[var(--foreground)]">{app.user_count || app.total_users || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-[var(--foreground)]">{app.key_count || app.total_keys || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-[var(--muted-foreground)]">{app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => setSelectedApp(app)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-[var(--foreground)] hover:bg-white/10 transition-all">View</button>
                  </td>
                </tr>
              ))}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-[var(--muted-foreground)] text-sm italic">No applications found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
            <span className="text-xs text-[var(--muted-foreground)]">{total} total applications</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold disabled:opacity-30">Previous</button>
              <span className="px-3 py-1.5 text-xs text-[var(--muted-foreground)]">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>

      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[var(--card)] border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--foreground)]">{selectedApp.name}</h2>
              <button onClick={() => setSelectedApp(null)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'App ID', value: selectedApp.id },
                { label: 'Owner', value: selectedApp.owner || selectedApp.owner_id || '—' },
                { label: 'Total Users', value: selectedApp.user_count || selectedApp.total_users || 0 },
                { label: 'Total Keys', value: selectedApp.key_count || selectedApp.total_keys || 0 },
                { label: 'Version', value: selectedApp.version || '—' },
                { label: 'Created', value: selectedApp.created_at ? new Date(selectedApp.created_at).toLocaleString() : '—' },
                { label: 'Updated', value: selectedApp.updated_at ? new Date(selectedApp.updated_at).toLocaleString() : '—' },
              ].map(f => (
                <div key={f.label} className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                  <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">{f.label}</span>
                  <span className="text-sm font-mono text-[var(--foreground)]">{f.value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedApp(null)} className="w-full mt-6 py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-xs uppercase tracking-widest text-[var(--foreground)]">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
