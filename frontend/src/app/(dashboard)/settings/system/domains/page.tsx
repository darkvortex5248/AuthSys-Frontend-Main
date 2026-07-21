'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { isFeatureLocked } from '@/lib/plan-access';
import { useDeveloperMe } from '@/hooks/use-developer-queries';
import PremiumLocked from '@/components/PremiumLocked';

export default function DomainsPage() {
  const { data: profile } = useDeveloperMe(true);
  const locked = isFeatureLocked('developer', profile?.subscription_tier);

  const [doms, setDoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [newDom, setNewDom] = useState('');
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (locked) return;
    api.get('/developer/domains')
      .then(r => setDoms(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (locked) return <PremiumLocked feature="Custom Domains" tier="Developer" />;

  const handleAdd = async () => {
    if (!newDom.trim()) return;
    setAdding(true);
    try {
      const res = await api.post('/developer/domains', { domain: newDom.trim() });
      toast.success('Domain added');
      setNewDom('');
      setDoms(prev => [res.data, ...prev]);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add domain');
    } finally {
      setAdding(false);
    }
  };

  const handleVerify = async (id: string) => {
    setVerifying(id);
    try {
      await api.post(`/developer/domains/${id}/verify`);
      toast.success('Domain verified');
      setDoms(prev => prev.map(x => x.id === id ? { ...x, is_verified: true } : x));
    } catch {
      toast.error('Verification failed — check your DNS records');
    } finally {
      setVerifying(null);
    }
  };

  const handleToggleSSL = async (id: string, current: boolean) => {
    try {
      await api.put(`/developer/domains/${id}/ssl`);
      setDoms(prev => prev.map(x => x.id === id ? { ...x, ssl_enabled: !current } : x));
      toast.success(current ? 'SSL disabled' : 'SSL enabled');
    } catch {
      toast.error('Failed to update SSL');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await api.delete(`/developer/domains/${id}`);
      toast.success('Domain removed');
      setDoms(prev => prev.filter(x => x.id !== id));
    } catch {
      toast.error('Failed to remove domain');
    }
  };

  const copyToken = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="premium-card p-8 md:p-10 space-y-6">
          <div className="sk h-6 w-36 rounded-lg" />
          <div className="sk h-4 w-60 rounded" />
          <div className="flex gap-3 mt-4">
            <div className="sk h-10 flex-1 rounded-xl" />
            <div className="sk h-10 w-24 rounded-xl" />
          </div>
          <div className="space-y-3">
            {[1,2].map(i => <div key={i} className="sk h-20 w-full rounded-xl" />)}
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
          <h3 className="text-xl font-semibold text-[var(--foreground)] tracking-tight">Custom Domains</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Host your auth pages on your own domain for a seamless white-label experience
          </p>
        </div>
        <span className="shrink-0 px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold tabular-nums">
          {doms.length} {doms.length === 1 ? 'domain' : 'domains'}
        </span>
      </div>

      {/* Add domain */}
      <div className="flex gap-2.5 items-center">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[var(--muted-foreground)]">language</span>
          <input
            value={newDom}
            onChange={e => setNewDom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="auth.yourdomain.com"
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 focus:border-[var(--primary)]/40 focus:ring-1 focus:ring-[var(--primary)]/20 outline-none transition-all"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!newDom.trim() || adding}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {adding
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <span className="material-symbols-outlined text-[16px]">add</span>
          }
          Add
        </button>
      </div>

      {/* Domain list */}
      {doms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--card)] border border-white/8 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-[var(--muted-foreground)]/60">dns</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">No custom domains</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Add a domain above to get started</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {doms.map(d => (
            <div key={d.id} className="premium-card p-4 space-y-3">

              {/* Domain row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${d.is_verified ? 'bg-emerald-500/10' : 'bg-yellow-500/10'}`}>
                    <span className={`material-symbols-outlined text-[16px] ${d.is_verified ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {d.is_verified ? 'verified' : 'pending'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)] truncate">{d.domain}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">Added {new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {d.ssl_enabled && (
                    <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-semibold">
                      <span className="material-symbols-outlined text-[11px]">lock</span> SSL
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${d.is_verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    {d.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>

              {/* TXT record */}
              {!d.is_verified && (
                <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-3 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[15px] text-yellow-400 mt-0.5 shrink-0">info</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-yellow-300/80 mb-1.5 font-medium">Add this TXT record to your DNS to verify ownership</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-[11px] text-yellow-300 bg-black/25 px-2.5 py-1.5 rounded-lg font-mono truncate">{d.verification_token}</code>
                      <button
                        onClick={() => copyToken(d.verification_token, d.id)}
                        className="shrink-0 p-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px] text-yellow-400">
                          {copiedToken === d.id ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 pt-0.5">
                {!d.is_verified && (
                  <button
                    onClick={() => handleVerify(d.id)}
                    disabled={verifying === d.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 hover:bg-[var(--primary)]/15 text-[var(--primary)] text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {verifying === d.id
                      ? <span className="w-3 h-3 border border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                      : <span className="material-symbols-outlined text-[13px]">verified</span>
                    }
                    Verify
                  </button>
                )}

                <button
                  onClick={() => handleToggleSSL(d.id, d.ssl_enabled)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-xs font-medium transition-colors"
                >
                  <span className="material-symbols-outlined text-[13px]">{d.ssl_enabled ? 'lock_open' : 'lock'}</span>
                  {d.ssl_enabled ? 'Disable SSL' : 'Enable SSL'}
                </button>

                <button
                  onClick={() => handleRemove(d.id)}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 text-xs font-medium transition-colors"
                >
                  <span className="material-symbols-outlined text-[13px]">delete</span>
                  Remove
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </section>
  );
}