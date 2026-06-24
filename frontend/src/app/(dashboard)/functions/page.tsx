'use client';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';
import { useDeveloperMe } from '@/hooks/use-developer-queries';
import { isFeatureLocked } from '@/lib/plan-access';
import PremiumLocked from '@/components/PremiumLocked';

const ACCENT = 'var(--primary)';

export default function FunctionsPage() {
  const { selectedAppId } = useAuthStore();
  const { data: profile } = useDeveloperMe(true);
  const locked = isFeatureLocked('developer', profile?.subscription_tier);
  const [variables, setVariables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  if (locked) return <PremiumLocked feature="Cloud Functions" tier="Developer" />;
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isGlobal, setIsGlobal] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterScope, setFilterScope] = useState<'all' | 'global' | 'scoped'>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sparkles, setSparkles] = useState<{ x: number; y: number; id: number }[]>([]);
  const sparkleId = useRef(0);
  const formRef = useRef<HTMLDivElement>(null);

  const fetchVariables = async () => {
    if (!selectedAppId) return;
    try {
      setLoading(true);
      const res = await api.get(`/developer/variables/${selectedAppId}`);
      setVariables(res.data);
    } catch (err) {
      console.error('Failed to fetch variables', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVariables(); }, [selectedAppId]);

  const spawnSparkle = (e: React.MouseEvent) => {
    const rect = formRef.current?.getBoundingClientRect();
    if (!rect) return;
    const id = sparkleId.current++;
    setSparkles(s => [...s, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);
    setTimeout(() => setSparkles(s => s.filter(sp => sp.id !== id)), 800);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return toast.error('Select an app first');
    if (!newKey || !newValue) return toast.error('Fill all fields');
    try {
      setIsCreating(true);
      await api.post('/developer/variables/create', {
        app_id: selectedAppId,
        key_name: newKey,
        key_value: newValue,
        is_global: isGlobal,
      });
      toast.success('Variable injected successfully!');
      setNewKey('');
      setNewValue('');
      fetchVariables();
    } catch {
      toast.error('Failed to create variable');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      await api.delete(`/developer/variables/${id}`);
      toast.success('Variable deleted');
      setVariables(v => v.filter(x => x.id !== id));
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = variables.filter(v => {
    const matchSearch = v.key_name.toLowerCase().includes(search.toLowerCase());
    const matchScope = filterScope === 'all' || (filterScope === 'global' ? v.is_global : !v.is_global);
    return matchSearch && matchScope;
  });

  const globalCount = variables.filter(v => v.is_global).length;
  const scopedCount = variables.filter(v => !v.is_global).length;

  if (!selectedAppId) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-[28px] text-[var(--primary)]/60">apps</span>
      </div>
      <div className="text-center">
        <p className="text-white/50 font-medium text-sm">No application selected</p>
        <p className="text-white/25 text-xs mt-1">Choose an app from the top menu to manage functions</p>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper pt-6 space-y-6 overflow-visible">
      <style>{`
        @keyframes shimmerFn {
          0%   { background-position:-200% center; }
          100% { background-position:200% center; }
        }
        @keyframes sparkUp {
          0%   { transform:translate(-50%,-50%) scale(1) rotate(0deg); opacity:0.9; }
          100% { transform:translate(-50%,-250%) scale(0) rotate(45deg); opacity:0; }
        }
        @keyframes slideIn {
          from { opacity:0; transform:translateY(12px) scale(0.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes deleteOut {
          to { opacity:0; transform:scale(0.95) translateX(8px); max-height:0; padding:0; margin:0; }
        }
        @keyframes glowPulse {
          0%,100% { box-shadow:0 0 0 0 transparent; }
          50%     { box-shadow:0 0 20px 4px color-mix(in srgb, var(--primary) 15%, transparent); }
        }
        @keyframes typingDot {
          0%,80%,100% { transform:scale(0.6); opacity:0.4; }
          40%         { transform:scale(1); opacity:1; }
        }
        .shimmer-fn {
          color: var(--foreground);
          background:linear-gradient(90deg,#fff 0%,var(--primary) 35%,color-mix(in srgb, var(--primary) 70%, #fff) 50%,#fff 65%);
          background-size:200% auto;
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          animation:shimmerFn 5s linear infinite;
        }
        .var-card { animation:slideIn 0.35s ease-out; transition:all 0.25s cubic-bezier(.4,0,.2,1); }
        .var-card:hover { transform:translateY(-2px); }
        .glow-card { animation:glowPulse 3s ease-in-out infinite; }
        .dot1 { animation:typingDot 1.4s ease-in-out infinite 0s; }
        .dot2 { animation:typingDot 1.4s ease-in-out infinite 0.2s; }
        .dot3 { animation:typingDot 1.4s ease-in-out infinite 0.4s; }
      `}</style>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[9px] font-black text-white/25 uppercase tracking-[0.2em]">Server-side</span>
            <span className="material-symbols-outlined text-[12px] text-white/15">chevron_right</span>
            <span className="text-[9px] font-black text-[var(--primary)]/70 uppercase tracking-[0.2em]">Variable & Logic Injections</span>
          </div>
          <h2 className="text-5xl font-black tracking-tight leading-none shimmer-fn">Cloud Functions</h2>
          <p className="text-sm text-white/35 mt-2">
            <span className="text-[var(--primary)] font-bold">{variables.length}</span> variable{variables.length !== 1 ? 's' : ''} configured
            {globalCount > 0 && <span className="ml-2 text-white/20">· {globalCount} global · {scopedCount} scoped</span>}
          </p>
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-2xl">
            <span className="material-symbols-outlined text-[14px] text-[var(--primary)]">public</span>
            <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest">{globalCount} Global</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <span className="material-symbols-outlined text-[14px] text-amber-400">lock</span>
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">{scopedCount} Scoped</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left: Form ── */}
        <div className="lg:col-span-4">
          <div
            ref={formRef}
            className="relative rounded-3xl overflow-hidden border border-white/8 bg-white/[0.03] backdrop-blur-xl glow-card"
            onClick={spawnSparkle}
          >
            {/* Sparkles */}
            {sparkles.map(s => (
              <span
                key={s.id}
                className="pointer-events-none absolute text-[var(--primary)] text-xs z-50"
                style={{ left: s.x, top: s.y, animation: 'sparkUp 0.8s ease-out forwards' }}
              >✦</span>
            ))}

            {/* Glow */}
            <div className="absolute -right-16 -top-16 w-56 h-56 bg-[var(--primary)]/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-orange-600/5 blur-[80px] rounded-full pointer-events-none" />

            {/* Form Header */}
            <div className="px-7 pt-7 pb-5 border-b border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/25 flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] text-[var(--primary)]">add_circle</span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white">New Variable</h4>
                <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Inject key-value pair</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="px-7 py-6 space-y-5 relative z-10">
              {/* Key Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[10px] font-black text-white/35 uppercase tracking-[0.15em]">
                  <span className="material-symbols-outlined text-[12px] text-[var(--primary)]">label</span>
                  Key Name
                </label>
                <div className={`rounded-xl border transition-all duration-300 ${activeField === 'key' ? 'border-[var(--primary)]/55' : 'border-white/8'}`}
                  style={activeField === 'key' ? { boxShadow: '0 0 14px color-mix(in srgb, var(--primary) 15%, transparent)' } : undefined}>
                  <input
                    type="text"
                    value={newKey}
                    onChange={e => setNewKey(e.target.value)}
                    onFocus={() => setActiveField('key')}
                    onBlur={() => setActiveField(null)}
                    placeholder="e.g. API_ENDPOINT"
                    className="w-full bg-white/4 rounded-xl px-4 py-3.5 text-sm font-mono text-white/85 focus:outline-none transition-all placeholder:text-white/15"
                  />
                </div>
                {newKey && !/^[A-Z0-9_]+$/.test(newKey) && (
                  <p className="text-[9px] text-amber-400/70 ml-1 animate-in fade-in duration-200">
                    ⚠ Convention: use UPPER_SNAKE_CASE
                  </p>
                )}
              </div>

              {/* Secret Value */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[10px] font-black text-white/35 uppercase tracking-[0.15em]">
                  <span className="material-symbols-outlined text-[12px] text-[var(--primary)]">lock</span>
                  Secret Value
                </label>
                <div className={`rounded-xl border transition-all duration-300 ${activeField === 'val' ? 'border-[var(--primary)]/55' : 'border-white/8'}`}
                  style={activeField === 'val' ? { boxShadow: '0 0 14px color-mix(in srgb, var(--primary) 15%, transparent)' } : undefined}>
                  <textarea
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    onFocus={() => setActiveField('val')}
                    onBlur={() => setActiveField(null)}
                    placeholder="Enter sensitive data or value..."
                    rows={3}
                    className="w-full bg-white/4 rounded-xl px-4 py-3 text-sm font-mono text-white/85 focus:outline-none transition-all placeholder:text-white/20 resize-none leading-relaxed"
                  />
                </div>
                {newValue && (
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] text-white/20">{newValue.length} chars</span>
                    <span className="text-[9px] text-[var(--primary)]/50 font-bold">ENCRYPTED AT REST</span>
                  </div>
                )}
              </div>

              {/* Global Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/3 rounded-xl border border-white/5">
                <div>
                  <p className="text-[11px] font-black text-white uppercase tracking-widest">Global Access</p>
                  <p className="text-[9px] text-white/30 mt-0.5">
                    {isGlobal ? 'Accessible from all app contexts' : 'Scoped to specific context only'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGlobal(v => !v)}
                  style={isGlobal ? { boxShadow: '0 0 12px color-mix(in srgb, var(--primary) 30%, transparent)' } : undefined}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 border ${isGlobal
                      ? 'bg-[var(--primary)] border-[var(--primary)]/50'
                      : 'bg-white/8 border-white/10'
                    }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${isGlobal ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isCreating || !newKey || !newValue}
                className="relative w-full overflow-hidden py-4 bg-[var(--primary)] text-white rounded-xl text-sm font-black tracking-wide shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/45 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-200" />
                {isCreating ? (
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm">Injecting</span>
                    <span className="flex gap-0.5 items-end">
                      <span className="w-1 h-1 rounded-full bg-white dot1" />
                      <span className="w-1 h-1 rounded-full bg-white dot2" />
                      <span className="w-1 h-1 rounded-full bg-white dot3" />
                    </span>
                  </span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">upload</span>
                    Inject Variable
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── Right: Variable List ── */}
        <div className="lg:col-span-8 space-y-4">

          {/* Search + Filter bar */}
          {variables.length > 0 && (
            <div className="flex gap-3 flex-wrap animate-in fade-in duration-300">
              <div className={`flex-1 min-w-[180px] relative rounded-xl border transition-all duration-300 ${activeField === 'search' ? 'border-[var(--primary)]/45' : 'border-white/8'}`}>
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[16px] text-white/25">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setActiveField('search')}
                  onBlur={() => setActiveField(null)}
                  placeholder="Search variables..."
                  className="w-full bg-white/4 rounded-xl pl-10 pr-4 py-3 text-sm text-white/75 focus:outline-none placeholder:text-white/20"
                />
              </div>
              <div className="flex gap-1.5">
                {(['all', 'global', 'scoped'] as const).map(scope => (
                  <button
                    key={scope}
                    onClick={() => setFilterScope(scope)}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${filterScope === scope
                        ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/25'
                        : 'bg-white/5 text-white/35 hover:bg-white/10 border border-white/8'
                      }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 shrink-0">
                  <div className="absolute inset-0 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/25 animate-pulse" />
                  <div className="absolute inset-0 rounded-xl border border-[var(--primary)]/40 animate-ping" />
                  <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-[16px] text-[var(--primary)]">code</span>
                </div>
                <p className="text-white/30 text-sm">Loading variables...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-3xl border border-white/5 bg-white/[0.015]">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px] text-white/20">
                  {search ? 'search_off' : 'add_box'}
                </span>
              </div>
              <div className="text-center">
                <p className="text-white/35 font-medium text-sm">
                  {search ? `No results for "${search}"` : 'No variables configured yet'}
                </p>
                <p className="text-white/20 text-xs mt-1">
                  {search ? 'Try a different search term' : 'Use the form to inject your first variable'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((v, i) => (
                <div
                  key={v.id}
                  className="var-card relative rounded-2xl border border-white/6 bg-white/[0.025] backdrop-blur-sm hover:border-white/12 hover:bg-white/[0.04] overflow-hidden group"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Side accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-300 group-hover:w-1 ${v.is_global ? 'bg-[var(--primary)]' : 'bg-amber-500'}`} />

                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${v.is_global
                          ? 'bg-[var(--primary)]/12 border border-[var(--primary)]/20 group-hover:bg-[var(--primary)]/20'
                          : 'bg-amber-500/12 border border-amber-500/20 group-hover:bg-amber-500/20'
                        }`}>
                        <span className={`material-symbols-outlined text-[16px] ${v.is_global ? 'text-[var(--primary)]' : 'text-amber-400'}`}>
                          {v.is_global ? 'public' : 'lock'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-white font-mono tracking-wide">{v.key_name}</h4>
                          <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest ${v.is_global
                              ? 'bg-[var(--primary)]/12 text-[var(--primary)]'
                              : 'bg-amber-500/12 text-amber-400'
                            }`}>
                            {v.is_global ? 'Global' : 'Scoped'}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/25 font-mono mt-0.5 truncate max-w-[200px] sm:max-w-[300px]">
                          {'•'.repeat(Math.min(v.key_value?.length || 0, 24))}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`material-symbols-outlined text-[16px] text-white/20 transition-transform duration-200 ${expandedId === v.id ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(v.id); }}
                        disabled={deletingId === v.id}
                        className="p-2 rounded-xl bg-red-500/0 text-red-400/0 opacity-0 group-hover:opacity-100 group-hover:bg-red-500/10 group-hover:text-red-400 hover:!bg-red-500/25 transition-all duration-200"
                      >
                        {deletingId === v.id
                          ? <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                          : <span className="material-symbols-outlined text-[16px]">delete</span>
                        }
                      </button>
                    </div>
                  </div>

                  {/* Expanded value reveal */}
                  {expandedId === v.id && (
                    <div className="px-5 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="p-3.5 bg-black/30 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black text-white/25 uppercase tracking-widest">Stored Value</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(v.key_value);
                              toast.success('Value copied!');
                            }}
                            className="flex items-center gap-1 text-[9px] text-white/25 hover:text-[var(--primary)] transition-colors"
                          >
                            <span className="material-symbols-outlined text-[12px]">content_copy</span>
                            copy
                          </button>
                        </div>
                        <p className="text-xs text-white/60 font-mono break-all leading-relaxed">{v.key_value}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {filtered.length < variables.length && (
                <p className="text-center text-[10px] text-white/20 py-2">
                  Showing {filtered.length} of {variables.length} variables
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}