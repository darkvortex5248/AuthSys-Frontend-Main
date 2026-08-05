'use client';
import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SystemPageShell,
  SystemEmptyState,
  SystemChip,
  SystemIconBox,
  SystemDataRow,
  SystemActionButton,
  SystemSectionHeader,
} from '@/components/shells/SystemPageShell';

const ACTION_META: Record<string, { tone: 'primary' | 'success' | 'warning' | 'danger' | 'muted'; icon: string; label: string }> = {
  bulk_expire:  { tone: 'danger',  icon: 'event_busy',   label: 'Bulk Expire'  },
  bulk_suspend: { tone: 'warning', icon: 'block',        label: 'Bulk Suspend' },
  notify:       { tone: 'primary', icon: 'campaign',     label: 'Notify'       },
};

const STATUS_META: Record<string, { tone: 'primary' | 'success' | 'warning' | 'danger' | 'muted'; icon: string; label: string; pulse: boolean }> = {
  pending:   { tone: 'primary', icon: 'schedule',     label: 'Scheduled', pulse: true  },
  running:   { tone: 'warning', icon: 'progress_activity', label: 'Running', pulse: true  },
  completed: { tone: 'success', icon: 'check_circle',  label: 'Completed', pulse: false },
  failed:    { tone: 'danger',  icon: 'error',         label: 'Failed',    pulse: false },
};

const TARGET_LABEL: Record<string, string> = {
  license_key: 'License Keys',
  end_user:    'End Users',
};

function formatDateTime(d: string) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function timeUntil(d: string) {
  const diff = new Date(d).getTime() - Date.now();
  if (diff < 0) return 'Past due';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'in <1m';
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `in ${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `in ${days}d`;
}

type Filter = 'all' | 'pending' | 'running' | 'completed' | 'failed';

export default function WorkspaceScheduledPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    app_id: 0, action_type: 'bulk_expire', target_type: 'license_key',
    target_filter: '{}', payload: '{}', scheduled_at: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [executingId, setExecutingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetch = async () => {
    try {
      const [aRes, appsRes] = await Promise.all([api.get('/developer/scheduled'), api.get('/developer/apps')]);
      setActions(aRes.data); setApps(appsRes.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to load');
    } finally { setLoading(false); }
  };
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { fetch(); }, []);

  const resetForm = () => setForm({
    app_id: 0, action_type: 'bulk_expire', target_type: 'license_key',
    target_filter: '{}', payload: '{}', scheduled_at: '',
  });

  const createAction = async () => {
    if (!form.scheduled_at) { toast.error('Schedule time is required'); return; }
    setSubmitting(true);
    try {
      let targetFilter = {};
      let payload = {};
      try { targetFilter = JSON.parse(form.target_filter || '{}'); }
      catch { toast.error('Invalid target filter JSON'); setSubmitting(false); return; }
      try { payload = JSON.parse(form.payload || '{}'); }
      catch { toast.error('Invalid payload JSON'); setSubmitting(false); return; }
      await api.post('/developer/scheduled', {
        ...form,
        app_id: form.app_id || undefined,
        target_filter: targetFilter,
        payload,
      });
      toast.success('Scheduled action created!');
      setShowCreate(false);
      resetForm();
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const deleteAction = async (id: number) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 4000);
      return;
    }
    try {
      await api.delete(`/developer/scheduled/${id}`);
      toast.success('Cancelled');
      setDeletingId(null);
      fetch();
    } catch { toast.error('Failed'); }
  };

  const executeNow = async (id: number) => {
    setExecutingId(id);
    try {
      const res = await api.post(`/developer/scheduled/${id}/execute`);
      toast.success(`Executed: ${JSON.stringify(res.data.result)}`);
      fetch();
    } catch { toast.error('Failed'); }
    finally { setExecutingId(null); }
  };

  const filtered = useMemo(() => {
    return actions.filter(a => {
      if (filter !== 'all' && a.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.action_type.toLowerCase().includes(q) &&
          !a.target_type.toLowerCase().includes(q) &&
          !String(a.id).includes(q)
        ) return false;
      }
      return true;
    });
  }, [actions, filter, search]);

  // Stats
  const pendingCount   = actions.filter(a => a.status === 'pending').length;
  const runningCount   = actions.filter(a => a.status === 'running').length;
  const completedCount = actions.filter(a => a.status === 'completed').length;
  const failedCount    = actions.filter(a => a.status === 'failed').length;

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="sk h-7 w-44 rounded-lg" />
        <div className="sk h-4 w-56 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="sk h-20 rounded-xl" />)}
        </div>
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="sk h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
    </div>
  );

  const filterTabs: { id: Filter; label: string; count: number }[] = [
    { id: 'all',       label: 'All',       count: actions.length },
    { id: 'pending',   label: 'Scheduled', count: pendingCount },
    { id: 'running',   label: 'Running',   count: runningCount },
    { id: 'completed', label: 'Completed', count: completedCount },
    { id: 'failed',    label: 'Failed',    count: failedCount },
  ];

  return (
    <SystemPageShell
      crumbs={[{ label: 'Workspace' }, { label: 'Scheduled' }]}
      title="Scheduled Actions"
      subtitle="Schedule bulk license/user operations for later or immediate execution."
      accent={
        <SystemChip tone="primary">
          {actions.length} {actions.length === 1 ? 'action' : 'actions'}
        </SystemChip>
      }
      toolbar={
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-[var(--primary)]/10"
        >
          <span className="material-symbols-outlined text-[15px]">add</span>
          Schedule action
        </button>
      }
      stats={[
        { label: 'Total',     value: actions.length,   icon: 'schedule',          tone: 'default' },
        { label: 'Scheduled', value: pendingCount,     icon: 'event_upcoming',    tone: 'default' },
        { label: 'Running',   value: runningCount,     icon: 'progress_activity', tone: 'warning' },
        { label: 'Completed', value: completedCount,   icon: 'check_circle',      tone: 'success' },
      ]}
    >

      {/* Filter / search */}
      {actions.length > 0 && (
        <div className="space-y-3">
          <SystemSectionHeader
            title="Queue"
            count={`${filtered.length} / ${actions.length}`}
            action={
              <div className="relative w-full sm:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[15px] text-[var(--muted-foreground)]">search</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by id, type, target…"
                  className="w-full pl-9 pr-3 py-2 bg-white/[0.02] border border-white/5 rounded-lg text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 focus:border-[var(--primary)]/30 outline-none transition-colors"
                />
              </div>
            }
          />

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.02] border border-white/5 w-fit flex-wrap">
            {filterTabs.map(t => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  filter === t.id
                    ? 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/20'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-transparent'
                }`}
              >
                {t.label}
                <span className={`text-[10px] font-bold tabular-nums ${filter === t.id ? 'text-[var(--primary)]/70' : 'text-[var(--muted-foreground)]/60'}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {actions.length === 0 ? (
        <SystemEmptyState
          icon="event_upcoming"
          title="No scheduled actions"
          hint="Create one to automate bulk operations on license keys, users, and notifications."
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/15 border border-[var(--primary)]/20 text-[var(--primary)] rounded-xl text-sm font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              Schedule your first action
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <SystemEmptyState
          icon="search_off"
          title="No actions match your filter"
          hint="Try changing the filter or search query above."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(a => {
            const actionMeta  = ACTION_META[a.action_type] ?? { tone: 'muted', icon: 'schedule', label: a.action_type };
            const statusMeta  = STATUS_META[a.status]       ?? STATUS_META.pending;
            const isPending   = a.status === 'pending';
            return (
              <SystemDataRow
                key={a.id}
                accent={
                  a.status === 'completed' ? 'bg-emerald-400/60' :
                  a.status === 'failed'    ? 'bg-red-400/60' :
                  a.status === 'running'   ? 'bg-amber-400/60' :
                                              'bg-[var(--primary)]/60'
                }
                left={
                  <SystemIconBox
                    icon={actionMeta.icon}
                    tone={actionMeta.tone}
                  />
                }
                center={
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[var(--foreground)]">{actionMeta.label}</p>
                      <SystemChip tone="muted" className="!normal-case !tracking-normal">
                        {TARGET_LABEL[a.target_type] ?? a.target_type}
                      </SystemChip>
                      <SystemChip tone={statusMeta.tone} className="!normal-case !tracking-normal">
                        {statusMeta.pulse && (
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        )}
                        <span className="material-symbols-outlined text-[10px]">{statusMeta.icon}</span>
                        {statusMeta.label}
                      </SystemChip>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] text-[var(--muted-foreground)]">
                        <span className="font-semibold text-[var(--foreground)]/80">Run:</span> {formatDateTime(a.scheduled_at)}
                      </span>
                      {isPending && (
                        <span className="text-[11px] text-[var(--primary)]/80 font-semibold">
                          ({timeUntil(a.scheduled_at)})
                        </span>
                      )}
                      {a.executed_at && (
                        <span className="text-[11px] text-[var(--muted-foreground)]">
                          · <span className="font-semibold text-[var(--foreground)]/80">Executed:</span> {formatDateTime(a.executed_at)}
                        </span>
                      )}
                    </div>
                  </div>
                }
                right={
                  <>
                    {isPending && (
                      <SystemActionButton
                        variant="primary"
                        icon="play_arrow"
                        onClick={() => executeNow(a.id)}
                        loading={executingId === a.id}
                      >
                        <span className="hidden sm:inline">Run now</span>
                      </SystemActionButton>
                    )}
                    <SystemActionButton
                      variant="danger"
                      icon="delete"
                      onClick={() => deleteAction(a.id)}
                      className={deletingId === a.id ? '!bg-red-500/15 !text-red-400 !border-red-500/30' : ''}
                    >
                      {deletingId === a.id ? 'Sure?' : <span className="hidden sm:inline">{isPending ? 'Cancel' : 'Delete'}</span>}
                    </SystemActionButton>
                  </>
                }
              />
            );
          })}
        </div>
      )}

      {/* === Schedule Modal === */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => !submitting && setShowCreate(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0F141F]/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden"
            >
              {/* Ambient header light */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[420px] h-[200px] rounded-full bg-[var(--primary)]/15 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent"
              />

              {/* Header */}
              <div className="relative px-6 pt-5 pb-4 flex items-start gap-3 border-b border-white/5">
                <SystemIconBox icon="event_upcoming" tone="primary" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] tracking-tight">Schedule a new action</h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                    Choose the action, target and time. It will be queued and executed automatically.
                  </p>
                </div>
                <button
                  onClick={() => !submitting && setShowCreate(false)}
                  className="shrink-0 w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Body */}
              <div className="relative px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

                {/* Action type cards */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Action type</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(ACTION_META).map(([key, meta]) => {
                      const active = form.action_type === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setForm({ ...form, action_type: key })}
                          className={`relative overflow-hidden flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border transition-colors text-center ${
                            active
                              ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]'
                              : 'bg-white/[0.02] border-white/5 text-[var(--muted-foreground)] hover:bg-white/[0.04] hover:border-white/10 hover:text-[var(--foreground)]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">{meta.icon}</span>
                          <span className="text-[11px] font-semibold leading-tight">{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target type + App */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Target</p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[var(--muted-foreground)]">target</span>
                      <select
                        value={form.target_type}
                        onChange={e => setForm({...form, target_type: e.target.value})}
                        className="w-full pl-9 pr-3 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--primary)]/40 outline-none transition-colors appearance-none cursor-pointer"
                      >
                        <option value="license_key">License Keys</option>
                        <option value="end_user">End Users</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-2">App</p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[var(--muted-foreground)]">grid_view</span>
                      <select
                        value={form.app_id}
                        onChange={e => setForm({...form, app_id: parseInt(e.target.value)})}
                        className="w-full pl-9 pr-3 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--primary)]/40 outline-none transition-colors appearance-none cursor-pointer"
                      >
                        <option value={0}>All apps</option>
                        {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Schedule time */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Run at</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[var(--muted-foreground)]">schedule</span>
                    <input
                      type="datetime-local"
                      value={form.scheduled_at}
                      onChange={e => setForm({...form, scheduled_at: e.target.value})}
                      className="w-full pl-9 pr-4 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--primary)]/40 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* JSON fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Target filter</p>
                    <textarea
                      value={form.target_filter}
                      onChange={e => setForm({...form, target_filter: e.target.value})}
                      placeholder='{"key_type": "time"}'
                      rows={3}
                      className="w-full px-3 py-2 bg-[var(--card)]/50 border border-white/8 rounded-xl text-[11px] text-[var(--foreground)] font-mono placeholder:text-[var(--muted-foreground)]/40 focus:border-[var(--primary)]/40 outline-none transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Payload</p>
                    <textarea
                      value={form.payload}
                      onChange={e => setForm({...form, payload: e.target.value})}
                      placeholder='{"reason": "inactivity"}'
                      rows={3}
                      className="w-full px-3 py-2 bg-[var(--card)]/50 border border-white/8 rounded-xl text-[11px] text-[var(--foreground)] font-mono placeholder:text-[var(--muted-foreground)]/40 focus:border-[var(--primary)]/40 outline-none transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="relative px-6 py-4 border-t border-white/5 bg-white/[0.015] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 border border-white/8 hover:bg-white/5 rounded-xl text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={createAction}
                  disabled={!form.scheduled_at || submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[var(--primary)]/10"
                >
                  {submitting
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <span className="material-symbols-outlined text-[16px]">event_upcoming</span>
                  }
                  Schedule action
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </SystemPageShell>
  );
}
