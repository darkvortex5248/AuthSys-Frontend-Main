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
  useVariables,
  useCreateVariable,
  useDeleteVariable,
} from '@/hooks/use-developer-queries';

const statConfig = [
  { label: 'Total Variables', icon: 'code', color: 'var(--primary)', bg: 'rgba(var(--primary),0.1)', key: 'total' },
  { label: 'Global',          icon: 'public', color: 'var(--success)', bg: 'rgba(var(--success),0.1)', key: 'global' },
  { label: 'Scoped',          icon: 'lock', color: 'var(--ring)', bg: 'rgba(var(--ring),0.1)', key: 'scoped' },
  { label: 'Per-App',         icon: 'apps', color: 'var(--warning)', bg: 'rgba(var(--warning),0.1)', key: 'perapp' },
];

export default function VariablesPage() {
  const { selectedAppId } = useAuthStore();
  const confirm = useConfirm();
  const { data: variables = [], isLoading: loading } = useVariables(selectedAppId);
  const createMutation = useCreateVariable();
  const deleteMutation = useDeleteVariable();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVars = useMemo(() => {
    if (!searchTerm) return variables;
    const term = searchTerm.toLowerCase();
    return variables.filter(v => v.key_name?.toLowerCase().includes(term) || v.key_value?.toLowerCase().includes(term));
  }, [variables, searchTerm]);

  const stats = useMemo(() => ({
    total: variables.length,
    global: variables.filter(v => v.is_global).length,
    scoped: variables.filter(v => !v.is_global).length,
    perapp: variables.filter(v => v.app_id).length,
  }), [variables]);

  const handleCreate = async (data: any) => {
    if (!selectedAppId) return;
    try {
      await createMutation.mutateAsync({ ...data, app_id: selectedAppId });
      setShowModal(false);
      toast.success('Variable created');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create variable');
    }
  };

  const handleDelete = async (id: number) => {
    if (!selectedAppId) return;
    const ok = await confirm({
      title: 'Delete variable?',
      message: 'This will permanently remove the variable from your application.',
      confirmLabel: 'Yes, delete', cancelLabel: 'No, cancel', variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync({ id, appId: selectedAppId });
      toast.success('Variable deleted');
    } catch { toast.error('Failed to delete variable'); }
  };

  if (!selectedAppId) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-[var(--accent-opacity-8)] border border-[var(--border)] flex items-center justify-center">
        <span className="material-symbols-outlined text-[28px] text-[var(--muted-foreground)]">code</span>
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
        .vr-row { animation:rowIn 0.3s ease-out both; will-change:transform,opacity; }
        .vr-row:hover td { background:rgba(255,255,255,0.02); }
        .action-btn { transition:all 0.15s ease; }
        .action-btn:hover { transform:scale(1.12); }
      `}</style>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-5">
        <div>
          <nav className="breadcrumb mb-2">
            <span>Configuration</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="breadcrumb-active">Variables</span>
          </nav>
          <h1 className="page-title leading-none">Variables</h1>
          <p className="text-white/35 mt-2 text-sm font-medium">
            App ID: <span className="font-mono text-[var(--primary)]/70 text-xs">{selectedAppId}</span>
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create Variable
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
            <span className="material-symbols-outlined text-[18px] text-[var(--primary)]/60">code</span>
            <h3 className="section-title">Variables</h3>
            {filteredVars.length !== variables.length && (
              <span className="text-[9px] bg-[var(--primary)]/10 text-[var(--primary)] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                {filteredVars.length} of {variables.length}
              </span>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-white/25">search</span>
              <input
                type="text"
                placeholder="Search variables..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full sm:w-52 pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-xs text-white/75 focus:outline-none focus:border-[var(--primary)]/45 transition-all placeholder:text-white/20"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                {[
                  { label: 'Name',        w: '' },
                  { label: 'Scope',       w: 'w-28' },
                  { label: 'Value',       w: 'w-48' },
                  { label: 'Created',     w: 'w-32' },
                  { label: 'Actions',     w: 'w-20 text-right' },
                ].map(h => (
                  <th key={h.label} className={`px-6 py-4 stat-label border-b border-white/5 ${h.w}`}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredVars.map((v, i) => (
                <VarRow key={v.id} v={v} index={i} onDelete={() => handleDelete(v.id)} />
              ))}
              {filteredVars.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/8">
                        <span className="material-symbols-outlined text-[24px] text-white/20">code_off</span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-white/40 mb-1">No variables found</p>
                        <p className="text-xs text-white/20 max-w-xs mx-auto leading-relaxed">
                          {searchTerm ? 'No variables match your search.' : 'No variables defined for this app yet.'}
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

      {/* ── Create Modal ── */}
      <AnimatePresence>
        {showModal && <CreateModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
      </AnimatePresence>
    </div>
  );
}

function VarRow({ v, index, onDelete }: any) {
  const [revealed, setRevealed] = useState(false);
  return (
    <tr
      className="vr-row group cursor-default"
      style={{ animationDelay: `${index * 25}ms` }}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[16px] text-[var(--primary)]">code</span>
          </div>
          <div>
            <p className="text-sm font-black text-white/85 group-hover:text-[var(--primary)] transition-colors">
              {v.key_name}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
          v.is_global
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        }`}>
          <span className="material-symbols-outlined text-[12px]">{v.is_global ? 'public' : 'lock'}</span>
          {v.is_global ? 'Global' : 'Scoped'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div
          className="flex items-center gap-2 font-mono text-[11px] text-white/50 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 max-w-[180px] cursor-pointer select-none transition-all hover:border-white/15 w-fit"
          onClick={() => setRevealed(r => !r)}
        >
          <span className="truncate">
            {revealed ? v.key_value : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
          </span>
          <span className={`material-symbols-outlined text-[12px] text-white/30 transition-transform ${revealed ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-[11px] font-bold text-white/60 tabular-nums">
          {new Date(v.created_at).toLocaleDateString()}
        </p>
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-end">
          <button
            onClick={onDelete}
            className="action-btn w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-400/15 text-white/30 hover:text-red-400"
            title="Delete Variable"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

function CreateModal({ onClose, onCreate }: any) {
  const [formData, setFormData] = useState({ key_name: '', key_value: '', is_global: true });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try { await onCreate(formData); } finally { setSubmitting(false); }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="New Variable" onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-7 space-y-5">
        <div>
          <FieldLabel>Variable Name</FieldLabel>
          <GlassInput
            required
            placeholder="e.g. SERVER_IP"
            value={formData.key_name}
            onChange={e => setFormData(f => ({ ...f, key_name: e.target.value.toUpperCase() }))}
          />
        </div>
        <div>
          <FieldLabel>Scope</FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: true, label: 'Global', desc: 'All users', icon: 'public', color: '#10b981' },
              { val: false, label: 'Scoped', desc: 'Specific users', icon: 'lock', color: '#60a5fa' },
            ].map(({ val, label, desc, icon, color }) => (
              <button
                key={String(val)} type="button"
                onClick={() => setFormData(f => ({ ...f, is_global: val }))}
                className="flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200"
                style={formData.is_global === val ? {
                  background: `${color}15`, borderColor: `${color}35`, color,
                } : {
                  background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)',
                  color: 'var(--muted-foreground)',
                }}
              >
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                <div>
                  <p className="text-xs font-black">{label}</p>
                  <p className="text-[9px] opacity-60 uppercase tracking-widest">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>Value</FieldLabel>
          <GlassTextarea
            required rows={3}
            placeholder="Enter variable content..."
            value={formData.key_value}
            onChange={e => setFormData(f => ({ ...f, key_value: e.target.value }))}
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/8 text-white/40 hover:text-white/70 hover:bg-white/5 font-black text-[11px] uppercase tracking-widest transition-all">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2">
            {submitting
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
              : <><span className="material-symbols-outlined text-[16px]">add</span> Create Variable</>
            }
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
