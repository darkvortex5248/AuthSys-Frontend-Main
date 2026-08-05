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

const ENV_CONFIG = {
  production: { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     dot: 'bg-red-400',     rail: 'bg-red-400/60',     label: 'Production', icon: 'public'     },
  staging:    { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   dot: 'bg-amber-400',   rail: 'bg-amber-400/60',   label: 'Staging',    icon: 'science'    },
  dev:        { color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    dot: 'bg-blue-400',    rail: 'bg-blue-400/60',    label: 'Dev',        icon: 'code'       },
} as const;

type EnvName = keyof typeof ENV_CONFIG;

function getEnvConfig(name: string) {
  return ENV_CONFIG[name as EnvName] ?? {
    color: 'text-[var(--muted-foreground)]', bg: 'bg-white/5', border: 'border-white/10',
    dot: 'bg-white/30', rail: 'bg-white/30', label: name, icon: 'layers',
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
    try {
      await api.delete(`/developer/environments/${id}`);
      toast.success('Environment deleted');
      setEnvs(prev => prev.filter(x => x.id !== id));
    } catch {
      toast.error('Failed to delete');
    } finally {
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

  // Stats
  const productionCount = envs.filter(e => e.name === 'production').length;
  const stagingCount    = envs.filter(e => e.name === 'staging').length;
  const devCount        = envs.filter(e => e.name === 'dev').length;
  const appCount        = Object.keys(grouped).length;

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="premium-card p-8 md:p-10 space-y-6">
          <div className="sk h-6 w-36 rounded-lg" />
          <div className="sk h-4 w-60 rounded" />
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
      crumbs={[{ label: 'System' }, { label: 'Environments' }]}
      title="Environments"
      subtitle="Manage dev, staging, and production environments per app — each with its own secrets and routing."
      accent={
        <SystemChip tone="primary">
          {envs.length} {envs.length === 1 ? 'environment' : 'environments'}
        </SystemChip>
      }
      stats={[
        { label: 'Apps',       value: appCount,        icon: 'grid_view',  tone: 'default' },
        { label: 'Production', value: productionCount, icon: 'public',     tone: 'danger'  },
        { label: 'Staging',    value: stagingCount,    icon: 'science',    tone: 'warning' },
        { label: 'Dev',        value: devCount,        icon: 'code',       tone: 'success' },
      ]}
    >
      {/* Create form */}
      <SystemFormPanel
        title="New environment"
        footer={
          <span className="text-[10px] text-[var(--muted-foreground)]/70">Auto-provisioned per app</span>
        }
      >
        <div className="flex gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[160px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[var(--muted-foreground)]">grid_view</span>
            <select
              value={form.parent_app_id}
              onChange={e => setForm({ ...form, parent_app_id: parseInt(e.target.value) })}
              className="w-full pl-9 pr-3 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--primary)]/40 outline-none transition-[background-color,box-shadow,border-color] duration-200 ease-out appearance-none cursor-pointer"
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
              className="pl-9 pr-3 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--primary)]/40 outline-none transition-[background-color,box-shadow,border-color] duration-200 ease-out appearance-none cursor-pointer"
            >
              <option value="dev">Dev</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>

          <button
            onClick={handleCreate}
            disabled={!form.parent_app_id || creating}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-[background-color,box-shadow,border-color] duration-200 ease-out shrink-0"
          >
            {creating
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <span className="material-symbols-outlined text-[16px]">add</span>
            }
            Create
          </button>
        </div>
      </SystemFormPanel>

      {/* Environment list */}
      {envs.length === 0 ? (
        <SystemEmptyState
          icon="layers"
          title="No environments yet"
          hint="Create a dev, staging, or production environment for one of your apps above."
        />
      ) : (
        <div className="space-y-7">
          {Object.entries(grouped).map(([appId, appEnvs]) => {
            const app = apps.find(a => a.id === parseInt(appId));
            const list = appEnvs as any[];
            return (
              <div key={appId}>
                <SystemGroupHeader
                  icon="grid_view"
                  iconClassName="bg-[var(--primary)]/10"
                  title={app?.name || `App #${appId}`}
                  badges={[
                    <SystemChip key="c" tone="muted" className="!normal-case !tracking-normal">
                      {list.length} env{list.length !== 1 ? 's' : ''}
                    </SystemChip>,
                  ]}
                />

                <div className="space-y-2">
                  {list.map(e => {
                    const cfg = getEnvConfig(e.name);
                    return (
                      <SystemDataRow
                        key={e.id}
                        accent={cfg.rail}
                        left={
                          <SystemIconBox
                            icon={cfg.icon}
                            tone={e.name === 'production' ? 'red' : e.name === 'staging' ? 'amber' : 'blue'}
                          />
                        }
                        center={
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                              <p className="text-sm font-semibold text-[var(--foreground)]">{cfg.label}</p>
                              <SystemChip tone="muted" className="!normal-case !tracking-normal">
                                {e.name}
                              </SystemChip>
                              {/* Health dot indicator */}
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Healthy
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--muted-foreground)] mt-1 font-mono">
                              ID: {e.owner_id ?? e.id}
                            </p>
                          </div>
                        }
                        right={
                          <>
                            <SystemActionButton
                              icon="refresh"
                              onClick={() => handleRegen(e.id)}
                              loading={regenId === e.id}
                              title="Regenerate secret"
                            >
                              <span className="hidden sm:inline">Regen</span>
                            </SystemActionButton>

                            <SystemActionButton
                              variant="danger"
                              icon="delete"
                              onClick={() => handleDelete(e.id)}
                              className={confirmDelete === e.id ? '!bg-red-500/15 !text-red-400 !border-red-500/30' : ''}
                            >
                              {confirmDelete === e.id ? 'Confirm?' : <span className="hidden sm:inline">Delete</span>}
                            </SystemActionButton>
                          </>
                        }
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </SystemPageShell>
  );
}
