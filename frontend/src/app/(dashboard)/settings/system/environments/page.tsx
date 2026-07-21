'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { isFeatureLocked } from '@/lib/plan-access';
import { useDeveloperMe } from '@/hooks/use-developer-queries';
import PremiumLocked from '@/components/PremiumLocked';

const ENV_CONFIG = {
  production: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-400', label: 'Production' },
  staging:    { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', dot: 'bg-yellow-400', label: 'Staging' },
  dev:        { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-400', label: 'Dev' },
} as const;

type EnvName = keyof typeof ENV_CONFIG;

function getEnvConfig(name: string) {
  return ENV_CONFIG[name as EnvName] ?? {
    color: 'text-[var(--muted-foreground)]', bg: 'bg-white/5', border: 'border-white/10', dot: 'bg-white/30', label: name,
  };
}

export default function EnvironmentsPage() {
  const { data: profile } = useDeveloperMe(true);
  const locked = isFeatureLocked('developer', profile?.subscription_tier);

  const [envs, setEnvs] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ parent_app_id: 0, name: 'staging' });
  const [creating, setCreating] = useState(false);
  const [regenId, setRegenId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (locked) return <PremiumLocked feature="Environments" tier="Developer" />;

  useEffect(() => {
    Promise.all([api.get('/developer/environments'), api.get('/developer/apps')])
      .then(([e, a]) => { setEnvs(e.data); setApps(a.data); })
      .catch(() => toast.error('Failed to load environments'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.parent_app_id) return;
    setCreating(true);
    try {
      const res = await api.post('/developer/environments', form);
      toast.success('Environment created');
      setForm({ parent_app_id: 0, name: 'staging' });
      setEnvs(prev => [res.data, ...prev]);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create environment');
    } finally {
      setCreating(false);
    }
  };

  const handleRegen = async (id: number) => {
    setRegenId(id);
    try {
      await api.post(`/developer/environments/${id}/regenerate-secret`);
      toast.success('Secret regenerated');
    } catch {
      toast.error('Failed to regenerate secret');
    } finally {
      setRegenId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 4000);
      return;
    }
    setDeleteId(id);
    try {
      await api.delete(`/developer/environments/${id}`);
      toast.success('Environment deleted');
      setEnvs(prev => prev.filter(x => x.id !== id));
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleteId(null);
      setConfirmDelete(null);
    }
  };

  // Group envs by app
  const grouped = envs.reduce((acc, e) => {
    const key = e.parent_app_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {} as Record<string, any[]>);

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="premium-card p-8 md:p-10 space-y-6">
          <div className="sk h-6 w-36 rounded-lg" />
          <div className="sk h-4 w-60 rounded" />
          <div className="flex gap-3 mt-4">
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] tracking-tight">Environments</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Manage dev, staging, and production environments per app
          </p>
        </div>
        <span className="shrink-0 px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold tabular-nums">
          {envs.length} {envs.length === 1 ? 'environment' : 'environments'}
        </span>
      </div>

      {/* Create form */}
      <div className="premium-card p-4 border border-[var(--primary)]/20 space-y-3">
        <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">New environment</p>
        <div className="flex gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[160px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[var(--muted-foreground)]">grid_view</span>
            <select
              value={form.parent_app_id}
              onChange={e => setForm({ ...form, parent_app_id: parseInt(e.target.value) })}
              className="w-full pl-9 pr-3 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--primary)]/40 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value={0} disabled>Select app…</option>
              {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[var(--muted-foreground)]">layers</span>
            <select
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="pl-9 pr-3 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--primary)]/40 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="dev">Dev</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>

          <button
            onClick={handleCreate}
            disabled={!form.parent_app_id || creating}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            {creating
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <span className="material-symbols-outlined text-[16px]">add</span>
            }
            Create
          </button>
        </div>
      </div>

      {/* Environment list */}
      {envs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--card)] border border-white/8 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-[var(--muted-foreground)]/60">layers</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">No environments yet</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Create one above to get started</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([appId, appEnvs]) => {
            const app = apps.find(a => a.id === parseInt(appId));
            return (
              <div key={appId}>
                {/* App group header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[13px] text-[var(--primary)]">grid_view</span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{app?.name || `App #${appId}`}</p>
                  <span className="text-[10px] text-[var(--muted-foreground)] px-1.5 py-0.5 bg-white/5 rounded-md">
                    {(appEnvs as any[]).length} env{(appEnvs as any[]).length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-2 pl-0">
                  {(appEnvs as any[]).map(e => {
                    const cfg = getEnvConfig(e.name);
                    return (
                      <div key={e.id} className={`premium-card p-4 flex items-center gap-4 border ${cfg.border} transition-all`}>

                        {/* Env badge */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                          <span className={`material-symbols-outlined text-lg ${cfg.color}`}>layers</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                            <p className="text-sm font-semibold text-[var(--foreground)] capitalize">{cfg.label}</p>
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                              {e.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5 font-mono">
                            ID: {e.owner_id ?? e.id}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleRegen(e.id)}
                            disabled={regenId === e.id}
                            title="Regenerate secret"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {regenId === e.id
                              ? <span className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                              : <span className="material-symbols-outlined text-[13px]">refresh</span>
                            }
                            <span className="hidden sm:inline">Regen</span>
                          </button>

                          <button
                            onClick={() => handleDelete(e.id)}
                            disabled={deleteId === e.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                              confirmDelete === e.id
                                ? 'bg-red-500 text-white'
                                : 'hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400'
                            }`}
                          >
                            {deleteId === e.id
                              ? <span className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                              : <span className="material-symbols-outlined text-[13px]">delete</span>
                            }
                            {confirmDelete === e.id ? 'Sure?' : <span className="hidden sm:inline">Delete</span>}
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </section>
  );
}