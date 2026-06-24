'use client';
import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';
import {
  ModalOverlay,
  ModalHeader,
  GlassInput,
  GlassTextarea,
  FieldLabel,
} from '@/components/ui/glass';
import {
  useBlacklist,
  useAddBlacklistEntry,
  useDeleteBlacklistEntry,
} from '@/hooks/use-developer-queries';

const statConfig = [
  { label: 'Total Banned', icon: 'block', color: 'var(--destructive)', bg: 'rgba(var(--destructive),0.1)', key: 'total' },
  { label: 'IP Bans',      icon: 'language', color: 'var(--primary)', bg: 'rgba(var(--primary),0.1)', key: 'ip' },
  { label: 'HWID Bans',    icon: 'devices', color: 'var(--ring)', bg: 'rgba(var(--ring),0.1)', key: 'hwid' },
  { label: 'User Bans',    icon: 'person_off', color: 'var(--warning)', bg: 'rgba(var(--warning),0.1)', key: 'username' },
];

const typeLabelMap: Record<string, string> = {
  ip: 'IP Address', hwid: 'Hardware ID', username: 'Username', email: 'Email',
};

export default function BlacklistPage() {
  const { selectedAppId } = useAuthStore();
  const confirm = useConfirm();
  const { data: blacklist = [], isLoading: loading } = useBlacklist(selectedAppId);
  const addMutation = useAddBlacklistEntry();
  const deleteMutation = useDeleteBlacklistEntry();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredList = useMemo(() => {
    return blacklist.filter(row => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = row.value?.toLowerCase().includes(term) || row.reason?.toLowerCase().includes(term);
      const matchesType = typeFilter === 'all' || row.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [blacklist, searchTerm, typeFilter]);

  const stats = useMemo(() => ({
    total: blacklist.length,
    ip: blacklist.filter(b => b.type === 'ip').length,
    hwid: blacklist.filter(b => b.type === 'hwid').length,
    username: blacklist.filter(b => b.type === 'username' || b.type === 'email').length,
  }), [blacklist]);

  const handleAdd = async (data: any) => {
    if (!selectedAppId) return;
    try {
      await addMutation.mutateAsync({ ...data, app_id: selectedAppId });
      setShowModal(false);
      toast.success('Target added to blacklist');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to add target');
    }
  };

  const handleDelete = async (id: number) => {
    if (!selectedAppId) return;
    const ok = await confirm({
      title: 'Remove from blacklist?',
      message: 'This entry will be removed and the target will regain access.',
      confirmLabel: 'Yes, remove', cancelLabel: 'No, cancel', variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync({ id, appId: selectedAppId });
      toast.success('Entry removed');
    } catch { toast.error('Failed to delete entry'); }
  };

  if (!selectedAppId) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-[var(--accent-opacity-8)] border border-[var(--border)] flex items-center justify-center">
        <span className="material-symbols-outlined text-[28px] text-[var(--muted-foreground)]">block</span>
      </div>
      <div className="text-center">
        <p className="text-[var(--foreground)]/50 font-bold text-sm">No application selected</p>
        <p className="text-[var(--muted-foreground)] text-xs mt-1">Choose an app from the top menu</p>
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
        .bl-row { animation:rowIn 0.3s ease-out both; will-change:transform,opacity; }
        .bl-row:hover td { background:rgba(255,255,255,0.02); }
        .action-btn { transition:all 0.15s ease; }
        .action-btn:hover { transform:scale(1.12); }
      `}</style>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-5">
        <div>
          <nav className="breadcrumb mb-2">
            <span>Security</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="breadcrumb-active">Blacklist</span>
          </nav>
          <h1 className="page-title leading-none">Blacklist</h1>
          <p className="text-white/35 mt-2 text-sm font-medium">
            App ID: <span className="font-mono text-[var(--primary)]/70 text-xs">{selectedAppId}</span>
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add to Blacklist
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statConfig.map((s, i) => (
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
            <span className="material-symbols-outlined text-[18px] text-[var(--primary)]/60">block</span>
            <h3 className="section-title">Blacklist Entries</h3>
            {filteredList.length !== blacklist.length && (
              <span className="text-[9px] bg-[var(--primary)]/10 text-[var(--primary)] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                {filteredList.length} of {blacklist.length}
              </span>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-white/25">search</span>
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full sm:w-52 pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-xs text-white/75 focus:outline-none focus:border-[var(--primary)]/45 transition-all placeholder:text-white/20"
              />
            </div>
            <div className="flex gap-1">
              {['all', 'ip', 'hwid', 'username', 'email'].map(f => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`filter-tab ${typeFilter === f ? 'filter-tab-active' : ''}`}
                >
                  {f === 'email' ? 'email' : f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                {[
                  { label: 'Type',         w: 'w-28' },
                  { label: 'Target Value', w: '' },
                  { label: 'Reason',       w: 'w-48' },
                  { label: 'Date Added',   w: 'w-32' },
                  { label: 'Actions',      w: 'w-20 text-right' },
                ].map(h => (
                  <th key={h.label} className={`px-6 py-4 stat-label border-b border-white/5 ${h.w}`}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredList.map((row, i) => {
                const typeColor: Record<string, string> = {
                  ip: 'var(--primary)', hwid: 'var(--ring)', username: 'var(--warning)', email: 'var(--success)',
                };
                const typeIcon: Record<string, string> = {
                  ip: 'language', hwid: 'devices', username: 'person', email: 'mail',
                };
                const icon = typeIcon[row.type] || 'block';
                const color = typeColor[row.type] || 'var(--muted-foreground)';
                return (
                  <tr
                    key={row.id}
                    className="bl-row group cursor-default"
                    style={{ animationDelay: `${i * 25}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-[11px] uppercase shrink-0"
                          style={{ background: `${color}15`, border: `1px solid ${color}25`, color }}
                        >
                          <span className="material-symbols-outlined text-[16px]">{icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-black text-white/85">{typeLabelMap[row.type] || row.type}</p>
                          <p className="text-[9px] text-white/25 font-mono uppercase tracking-widest">{row.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-[11px] font-mono text-white/60 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/8">
                        {row.value}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] text-white/50">{row.reason || <span className="italic opacity-30">No reason</span>}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-bold text-white/60 tabular-nums">
                        {new Date(row.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="action-btn w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-400/15 text-white/30 hover:text-red-400"
                          title="Remove"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredList.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/8">
                        <span className="material-symbols-outlined text-[24px] text-white/20">block</span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-white/40 mb-1">No entries found</p>
                        <p className="text-xs text-white/20 max-w-xs mx-auto leading-relaxed">
                          {searchTerm || typeFilter !== 'all'
                            ? 'No entries match your current filters.'
                            : 'No blacklist entries for this app yet.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Modal ── */}
      <AnimatePresence>
        {showModal && <AddModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
      </AnimatePresence>
    </div>
  );
}

function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: any) => Promise<void> }) {
  const [formData, setFormData] = useState({ type: 'ip', value: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try { await onAdd(formData); } finally { setSubmitting(false); }
  };

  const types = [
    { key: 'ip', icon: 'language', label: 'IP' },
    { key: 'hwid', icon: 'devices', label: 'HWID' },
    { key: 'username', icon: 'person', label: 'User' },
    { key: 'email', icon: 'mail', label: 'Email' },
  ];

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="Add to Blacklist" onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-7 space-y-5">
        <div>
          <FieldLabel>Target Type</FieldLabel>
          <div className="grid grid-cols-4 gap-2">
            {types.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setFormData(f => ({ ...f, type: t.key }))}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                  formData.type === t.key
                    ? 'bg-[var(--primary)]/15 border-[var(--primary)]/40 text-[var(--primary)]'
                    : 'bg-white/5 border-white/8 text-white/35 hover:border-white/20 hover:text-white/60'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>Target Value</FieldLabel>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[16px] text-[var(--primary)]/40">
              {types.find(t => t.key === formData.type)?.icon || 'block'}
            </span>
            <input
              required
              type="text"
              value={formData.value}
              onChange={e => setFormData(f => ({ ...f, value: e.target.value }))}
              placeholder={formData.type === 'ip' ? '192.168.1.1' : 'target_value'}
              className="w-full bg-[var(--accent-opacity-8)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-[var(--foreground)]/85 placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]/50 transition-all"
            />
          </div>
        </div>
        <div>
          <FieldLabel>Reason (Optional)</FieldLabel>
          <GlassTextarea
            rows={3}
            placeholder="Briefly describe the violation..."
            value={formData.reason}
            onChange={e => setFormData(f => ({ ...f, reason: e.target.value }))}
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/8 text-white/40 hover:text-white/70 hover:bg-white/5 font-black text-[11px] uppercase tracking-widest transition-all">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-[var(--destructive)] text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[var(--destructive)]/25 hover:shadow-[var(--destructive)]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2">
            {submitting
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding...</>
              : <><span className="material-symbols-outlined text-[16px]">block</span> Add to Blacklist</>
            }
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
