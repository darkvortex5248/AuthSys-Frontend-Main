'use client';
import { useState, useEffect } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';

export default function BackupPage() {
  const confirm = useConfirm();
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminApi.get<any[]>('/admin/backups');
        setBackups(res.data || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await adminApi.post<any>('/admin/backups');
      toast.success('Backup created successfully');
      setBackups(prev => [res.data, ...prev]);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create backup');
    } finally { setCreating(false); }
  };

  const handleRestore = async (id: number) => {
    const ok = await confirm({
      title: 'Restore backup?',
      message: 'This will overwrite current data. This action cannot be undone.',
      confirmLabel: 'Restore',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    setRestoring(id);
    try {
      await adminApi.post(`/admin/backups/${id}/restore`);
      toast.success('Backup restored successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to restore backup');
    } finally { setRestoring(null); }
  };

  const handleDownload = async (id: number) => {
    try {
      const res = await adminApi.get<Blob>(`/admin/backups/${id}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data as unknown as BlobPart], { type: 'application/gzip' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `backup-${id}-${new Date().toISOString().split('T')[0]}.tar.gz`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Backup download started');
    } catch {
      toast.error('Failed to download backup');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Backup & Restore</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Create and manage database backups</p>
        </div>
        <button onClick={handleCreate} disabled={creating}
          className="px-6 py-3 rounded-xl bg-[var(--primary)] text-[#131313] font-bold text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">
          <span className="material-symbols-outlined text-sm">backup</span>
          {creating ? 'Creating...' : 'Create Backup'}
        </button>
      </div>

      <div className="glass-card rounded-xl">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Backup ID</th>
              <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Size</th>
              <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Created</th>
              <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {backups.map((b: any) => (
              <tr key={b.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4"><span className="text-xs font-mono text-[var(--primary)]">#{b.id}</span></td>
                <td className="px-6 py-4"><span className="text-sm text-[var(--foreground)]">{b.size || '—'}</span></td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                    b.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : b.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>{b.status || 'unknown'}</span>
                </td>
                <td className="px-6 py-4"><span className="text-xs text-[var(--muted-foreground)]">{b.created_at ? new Date(b.created_at).toLocaleString() : '—'}</span></td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleDownload(b.id)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-[var(--foreground)] hover:bg-white/10">Download</button>
                    <button onClick={() => handleRestore(b.id)} disabled={restoring === b.id}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400 hover:bg-amber-500/20 disabled:opacity-50">
                      {restoring === b.id ? 'Restoring...' : 'Restore'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {backups.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-20 text-center text-[var(--muted-foreground)] text-sm italic">No backups found. Create your first backup.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
