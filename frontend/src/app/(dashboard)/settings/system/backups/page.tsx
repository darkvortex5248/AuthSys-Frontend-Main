'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { isFeatureLocked } from '@/lib/plan-access';
import { useDeveloperMe } from '@/hooks/use-developer-queries';
import PremiumLocked from '@/components/PremiumLocked';
import {
  SystemPageShell,
  SystemFormPanel,
  SystemGroupHeader,
  SystemEmptyState,
  SystemChip,
  SystemIconBox,
  SystemDataRow,
  SystemActionButton,
} from '@/components/shells/SystemPageShell';

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
    try {
      await api.delete(`/developer/backups/${id}`);
      toast.success('Backup deleted');
      setBups(prev => prev.filter(x => x.id !== id));
    } catch {
      toast.error('Failed to delete backup');
    } finally {
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
  const appCount  = Object.keys(grouped).length;
  const lastBackup = bups[0];
  const lastLabel  = lastBackup ? timeAgo(lastBackup.created_at) : '—';

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="premium-card p-8 md:p-10 space-y-6">
          <div className="sk h-6 w-32 rounded-lg" />
          <div className="sk h-4 w-56 rounded" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="sk h-20 rounded-xl" />)}
          </div>
          <div className="sk h-14 w-full rounded-xl" />
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
    <SystemPageShell
      crumbs={[{ label: 'System' }, { label: 'Backups' }]}
      title="Backups"
      subtitle="Snapshot and restore your app configurations. Each backup is a point-in-time copy of the selected app's data."
      accent={
        <SystemChip tone="primary">
          {bups.length} {bups.length === 1 ? 'backup' : 'backups'}
        </SystemChip>
      }
      stats={[
        { label: 'Total Backups', value: bups.length,                       icon: 'backup',           tone: 'default' },
        { label: 'Apps Covered',  value: appCount,                          icon: 'grid_view',        tone: 'muted'   },
        { label: 'Storage Used',  value: formatSize(totalSize),             icon: 'storage',          tone: 'muted'   },
        { label: 'Last Backup',   value: lastLabel,                         icon: 'schedule',         tone: 'success' },
      ]}
    >

      {/* Create form */}
      <SystemFormPanel
        title="New backup"
        footer={
          <span className="text-[10px] text-[var(--muted-foreground)]/70">Snapshot includes config, users, keys</span>
        }
      >
        <div className="flex gap-2.5 flex-wrap sm:flex-nowrap">

          {/* App select */}
          <div className="relative flex-1 min-w-[150px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[var(--muted-foreground)]">grid_view</span>
            <select
              value={form.app_id}
              onChange={e => setForm({ ...form, app_id: parseInt(e.target.value) })}
              className="w-full pl-9 pr-3 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--primary)]/40 outline-none transition-[background-color,box-shadow,border-color] duration-200 ease-out appearance-none cursor-pointer"
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
              className="w-full pl-9 pr-4 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 focus:border-[var(--primary)]/40 outline-none transition-[background-color,box-shadow,border-color] duration-200 ease-out"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={!form.app_id || !form.name.trim() || creating}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-[background-color,box-shadow,border-color] duration-200 ease-out shrink-0"
          >
            {creating
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <span className="material-symbols-outlined text-[16px]">backup</span>
            }
            Create backup
          </button>
        </div>
      </SystemFormPanel>

      {/* Backup list */}
      {bups.length === 0 ? (
        <SystemEmptyState
          icon="backup"
          title="No backups yet"
          hint="Create your first backup above to protect your app configuration."
        />
      ) : (
        <div className="space-y-7">
          {Object.entries(grouped).map(([appId, appBups]) => {
            const app = apps.find(a => a.id === parseInt(appId));
            const list = appBups as any[];
            const groupSize = list.reduce((s, b) => s + (b.size_bytes || 0), 0);
            return (
              <div key={appId}>
                <SystemGroupHeader
                  icon="grid_view"
                  iconClassName="bg-blue-500/10"
                  title={app?.name || `App #${appId}`}
                  badges={[
                    <SystemChip key="c" tone="muted" className="!normal-case !tracking-normal">
                      {list.length} snapshot{list.length !== 1 ? 's' : ''}
                    </SystemChip>,
                    <SystemChip key="s" tone="primary" className="!normal-case !tracking-normal">
                      {formatSize(groupSize)}
                    </SystemChip>,
                  ]}
                />

                {/* Timeline feel: connect rows with a left rail */}
                <div className="relative pl-5">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-white/8 via-white/5 to-transparent" />
                  <div className="space-y-2">
                    {list.map(b => (
                      <SystemDataRow
                        key={b.id}
                        left={
                          <SystemIconBox icon="backup" tone="blue" />
                        }
                        center={
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--foreground)] truncate">{b.name}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <SystemChip tone="muted" className="!normal-case !tracking-normal">
                                <span className="material-symbols-outlined text-[10px]">storage</span>
                                {formatSize(b.size_bytes)}
                              </SystemChip>
                              <SystemChip tone="muted" className="!normal-case !tracking-normal">
                                <span className="material-symbols-outlined text-[10px]">schedule</span>
                                {timeAgo(b.created_at)}
                              </SystemChip>
                              <span className="text-[11px] text-[var(--muted-foreground)]/70 hidden sm:inline">
                                {new Date(b.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        }
                        right={
                          <>
                            <SystemActionButton
                              variant="primary"
                              icon="settings_backup_restore"
                              onClick={() => handleRestore(b.id)}
                              loading={restoringId === b.id}
                              className={confirmRestore === b.id ? '!bg-[var(--primary)] !text-white' : ''}
                            >
                              {confirmRestore === b.id ? 'Confirm?' : <span className="hidden sm:inline">Restore</span>}
                            </SystemActionButton>

                            <SystemActionButton
                              variant="danger"
                              icon="delete"
                              onClick={() => handleDelete(b.id)}
                              className={confirmDelete === b.id ? '!bg-red-500/15 !text-red-400 !border-red-500/30' : ''}
                            >
                              {confirmDelete === b.id ? 'Sure?' : <span className="hidden sm:inline">Delete</span>}
                            </SystemActionButton>
                          </>
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </SystemPageShell>
  );
}
