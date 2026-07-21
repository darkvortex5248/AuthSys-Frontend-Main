'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { isFeatureLocked } from '@/lib/plan-access';
import { useDeveloperMe } from '@/hooks/use-developer-queries';
import PremiumLocked from '@/components/PremiumLocked';

function formatSize(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

export default function BackupsPage() {
  const { data: profile } = useDeveloperMe(true);
  const locked = isFeatureLocked('developer', profile?.subscription_tier);

  const [bups, setBups] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ app_id: 0, name: '' });
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    Promise.all([api.get('/developer/backups'), api.get('/developer/apps')])
      .then(([b, a]) => { setBups(b.data); setApps(a.data); })
      .catch(() => toast.error('Failed to load backups'))
      .finally(() => setLoading(false));
  }, []);

  if (locked) return <PremiumLocked feature="Backups" tier="Developer" />;

  const handleCreate = async () => {
    if (!form.app_id || !form.name.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/developer/backups', form);
      toast.success('Backup created');
      setForm({ app_id: 0, name: '' });
      setBups(prev => [res.data, ...prev]);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (id: number) => {
    if (confirmRestore !== id) {
      setConfirmRestore(id);
      setTimeout(() => setConfirmRestore(null), 4000);
      return;
    }
    setRestoringId(id);
    try {
      await api.post(`/developer/backups/${id}/restore`);
      toast.success('Backup restored successfully');
    } catch {
      toast.error('Failed to restore backup');
    } finally {
      setRestoringId(null);
      setConfirmRestore(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 4000);
      return;
    }
    setDeletingId(id);
    try {
      await api.delete(`/developer/backups/${id}`);
      toast.success('Backup deleted');
      setBups(prev => prev.filter(x => x.id !== id));
    } catch {
      toast.error('Failed to delete backup');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  // Group by app
  const grouped = bups.reduce((acc, b) => {
    const key = b.app_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {} as Record<string, any[]>);

  const totalSize = bups.reduce((sum, b) => sum + (b.size_bytes || 0), 0);

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="premium-card p-8 md:p-10 space-y-6">
          <div className="sk h-6 w-32 rounded-lg" />
          <div className="sk h-4 w-56 rounded" />
          <div className="flex gap-4 mt-4">
            <div className="sk h-10 flex-1 rounded-xl" />
            <div className="sk h-10 w-32 rounded-xl" />
          </div>
          <div className="space-y-3">
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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] tracking-tight">Backups</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Snapshot and restore your app configurations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {bups.length > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-white/5 text-[var(--muted-foreground)] text-xs font-medium">
              {formatSize(totalSize)} total
            </span>
          )}
          <span className="px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold tabular-nums">
            {bups.length} {bups.length === 1 ? 'backup' : 'backups'}
          </span>
        </div>
      </div>

      {/* Create form */}
      <div className="premium-card p-4 border border-[var(--primary)]/20 space-y-3">
        <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">New backup</p>
        <div className="flex gap-2.5 flex-wrap sm:flex-nowrap">

          {/* App select */}
          <div className="relative flex-1 min-w-[150px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[var(--muted-foreground)]">grid_view</span>
            <select
              value={form.app_id}
              onChange={e => setForm({ ...form, app_id: parseInt(e.target.value) })}
              className="w-full pl-9 pr-3 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--primary)]/40 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value={0} disabled>Select app…</option>
              {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Name input */}
          <div className="relative flex-1 min-w-[150px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[var(--muted-foreground)]">label</span>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. pre-deploy-v2"
              className="w-full pl-9 pr-4 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 focus:border-[var(--primary)]/40 outline-none transition-all"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={!form.app_id || !form.name.trim() || creating}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            {creating
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <span className="material-symbols-outlined text-[16px]">backup</span>
            }
            Backup
          </button>
        </div>
      </div>

      {/* Backup list */}
      {bups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--card)] border border-white/8 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-[var(--muted-foreground)]/60">backup</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">No backups yet</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Create your first backup to protect your app config</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([appId, appBups]) => {
            const app = apps.find(a => a.id === parseInt(appId));
            const groupSize = (appBups as any[]).reduce((s, b) => s + (b.size_bytes || 0), 0);

            return (
              <div key={appId}>
                {/* App group header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[13px] text-blue-400">grid_view</span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{app?.name || `App #${appId}`}</p>
                  <span className="text-[10px] text-[var(--muted-foreground)] px-1.5 py-0.5 bg-white/5 rounded-md">
                    {(appBups as any[]).length} snapshot{(appBups as any[]).length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)] px-1.5 py-0.5 bg-white/5 rounded-md">
                    {formatSize(groupSize)}
                  </span>
                </div>

                <div className="space-y-2">
                  {(appBups as any[]).map(b => (
                    <div key={b.id} className="premium-card p-4 flex items-center gap-4 border border-white/5 hover:border-white/10 transition-all">

                      {/* Icon */}
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-lg text-blue-400">backup</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--foreground)] truncate">{b.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-[var(--muted-foreground)]">{formatSize(b.size_bytes)}</span>
                          <span className="text-[var(--muted-foreground)]/30 text-[10px]">•</span>
                          <span className="text-[11px] text-[var(--muted-foreground)]">{timeAgo(b.created_at)}</span>
                          <span className="text-[var(--muted-foreground)]/30 text-[10px]">•</span>
                          <span className="text-[11px] text-[var(--muted-foreground)]" title={new Date(b.created_at).toLocaleString()}>
                            {new Date(b.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleRestore(b.id)}
                          disabled={restoringId === b.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
                            confirmRestore === b.id
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-[var(--primary)]/10 hover:bg-[var(--primary)]/15 text-[var(--primary)]'
                          }`}
                        >
                          {restoringId === b.id
                            ? <span className="w-3 h-3 border border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                            : <span className="material-symbols-outlined text-[13px]">settings_backup_restore</span>
                          }
                          {confirmRestore === b.id ? 'Confirm?' : <span className="hidden sm:inline">Restore</span>}
                        </button>

                        <button
                          onClick={() => handleDelete(b.id)}
                          disabled={deletingId === b.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                            confirmDelete === b.id
                              ? 'bg-red-500 text-white'
                              : 'hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400'
                          }`}
                        >
                          {deletingId === b.id
                            ? <span className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                            : <span className="material-symbols-outlined text-[13px]">delete</span>
                          }
                          {confirmDelete === b.id ? 'Sure?' : <span className="hidden sm:inline">Delete</span>}
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </section>
  );
}