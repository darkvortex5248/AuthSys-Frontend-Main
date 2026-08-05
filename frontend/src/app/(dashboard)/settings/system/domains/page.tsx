'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { isFeatureLocked } from '@/lib/plan-access';
import { useDeveloperMe } from '@/hooks/use-developer-queries';
import PremiumLocked from '@/components/PremiumLocked';
import {
  SystemPageShell,
  SystemFormPanel,
  SystemEmptyState,
  SystemChip,
  SystemIconBox,
  SystemDataRow,
  SystemActionButton,
  SystemSectionHeader,
} from '@/components/shells/SystemPageShell';

type DomainFilter = 'all' | 'verified' | 'pending' | 'ssl';

export default function DomainsPage() {
  const { data: profile } = useDeveloperMe(true);
  const locked = isFeatureLocked('developer', profile?.subscription_tier);

  const [doms, setDoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [newDom, setNewDom] = useState('');
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [filter, setFilter] = useState<DomainFilter>('all');
  const [query, setQuery] = useState('');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (locked) return;
    setError(null);
    api.get('/developer/domains')
      .then(r => setDoms(r.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load domains'))
      .finally(() => setLoading(false));
  }, [locked]);

  if (locked) return <PremiumLocked feature="Custom Domains" tier="Developer" />;

  const handleAdd = async () => {
    const domain = newDom.trim();
    if (!domain) { toast.error('Domain is required'); return; }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$/.test(domain)) {
      toast.error('Please enter a valid domain name');
      return;
    }
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

  // Derived stats
  const verifiedCount = doms.filter(d => d.is_verified).length;
  const pendingCount = doms.length - verifiedCount;
  const sslCount = doms.filter(d => d.ssl_enabled).length;

  // Filtered + searched list
  const filtered = useMemo(() => {
    return doms.filter(d => {
      if (filter === 'verified' && !d.is_verified) return false;
      if (filter === 'pending' && d.is_verified) return false;
      if (filter === 'ssl' && !d.ssl_enabled) return false;
      if (query && !d.domain.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [doms, filter, query]);

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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <SystemIconBox icon="error" tone="danger" size="lg" />
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            api.get('/developer/domains')
              .then(r => setDoms(r.data))
              .catch((err) => setError(err.response?.data?.detail || 'Failed to load domains'))
              .finally(() => setLoading(false));
          }}
          className="px-4 py-2 bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/30 transition-colors text-sm font-semibold"
        >
          Try again
        </button>
      </div>
    );
  }

  const filterTabs: { id: DomainFilter; label: string; count: number }[] = [
    { id: 'all',      label: 'All',      count: doms.length },
    { id: 'verified', label: 'Verified', count: verifiedCount },
    { id: 'pending',  label: 'Pending',  count: pendingCount },
    { id: 'ssl',      label: 'SSL',      count: sslCount },
  ];

  return (
    <SystemPageShell
      crumbs={[{ label: 'System' }, { label: 'Domains' }]}
      title="Custom Domains"
      subtitle="Host your auth pages on your own domain for a seamless white-label experience."
      accent={
        <span className="px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-black uppercase tracking-widest">
          {doms.length} {doms.length === 1 ? 'domain' : 'domains'}
        </span>
      }
      stats={[
        { label: 'Total',    value: doms.length,           icon: 'language',     tone: 'default' },
        { label: 'Verified', value: verifiedCount,         icon: 'verified',     tone: 'success' },
        { label: 'Pending',  value: pendingCount,          icon: 'pending',      tone: 'warning' },
        { label: 'SSL',      value: sslCount,              icon: 'lock',         tone: 'muted' },
      ]}
    >

      {/* Add domain */}
      <SystemFormPanel
        title="Add a new domain"
        footer={
          <span className="text-[10px] text-[var(--muted-foreground)]/70">TXT verification required</span>
        }
      >
        <div className="flex gap-2.5 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[var(--muted-foreground)]">language</span>
            <input
              value={newDom}
              onChange={e => setNewDom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="auth.yourdomain.com"
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 focus:border-[var(--primary)]/40 focus:ring-1 focus:ring-[var(--primary)]/20 outline-none transition-[background-color,box-shadow,border-color] duration-200 ease-out"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newDom.trim() || adding}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-[background-color,box-shadow,border-color] duration-200 ease-out"
          >
            {adding
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <span className="material-symbols-outlined text-[16px]">add</span>
            }
            Add domain
          </button>
        </div>
      </SystemFormPanel>

      {/* Filter / Search bar — only when there's data */}
      {doms.length > 0 && (
        <div className="space-y-3">
          <SystemSectionHeader
            title="Configured domains"
            count={`${filtered.length} / ${doms.length}`}
            action={
              <div className="relative w-full sm:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[15px] text-[var(--muted-foreground)]">search</span>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search domain…"
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

      {/* Domain list */}
      {doms.length === 0 ? (
        <SystemEmptyState
          icon="dns"
          title="No custom domains yet"
          hint="Add a domain above to start serving auth pages from your own URL."
        />
      ) : filtered.length === 0 ? (
        <SystemEmptyState
          icon="search_off"
          title="No domains match your filter"
          hint="Try changing the filter or search query above."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map(d => {
            const isVerified = !!d.is_verified;
            return (
              <SystemDataRow
                key={d.id}
                accent={isVerified ? 'bg-emerald-400/60' : 'bg-amber-400/60'}
                left={
                  <SystemIconBox
                    icon={isVerified ? 'verified' : 'pending'}
                    tone={isVerified ? 'emerald' : 'amber'}
                  />
                }
                center={
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <p className="text-sm font-semibold text-[var(--foreground)] truncate">{d.domain}</p>
                      {d.ssl_enabled && (
                        <SystemChip tone="primary" className="!normal-case !tracking-normal">
                          <span className="material-symbols-outlined text-[10px]">lock</span>
                          SSL
                        </SystemChip>
                      )}
                      <SystemChip
                        tone={isVerified ? 'success' : 'warning'}
                        className="!normal-case !tracking-normal"
                      >
                        {isVerified ? 'Verified' : 'Pending'}
                      </SystemChip>
                    </div>
                    <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                      Added {new Date(d.created_at).toLocaleDateString()} · <span className="font-mono">ID {d.id}</span>
                    </p>

                    {/* TXT record (only when unverified) */}
                    {!isVerified && d.verification_token && (
                      <div className="mt-3 bg-amber-500/5 border border-amber-500/15 rounded-lg p-3 flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[15px] text-amber-400 mt-0.5 shrink-0">info</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-amber-300/80 mb-1.5 font-medium">Add this TXT record to your DNS to verify ownership</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-[11px] text-amber-300 bg-black/25 px-2.5 py-1.5 rounded-lg font-mono truncate">{d.verification_token}</code>
                            <button
                              onClick={() => copyToken(d.verification_token, d.id)}
                              className="shrink-0 p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[14px] text-amber-400">
                                {copiedToken === d.id ? 'check' : 'content_copy'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                }
                right={
                  <>
                    {!isVerified && (
                      <SystemActionButton
                        variant="primary"
                        icon="verified"
                        onClick={() => handleVerify(d.id)}
                        loading={verifying === d.id}
                      >
                        Verify
                      </SystemActionButton>
                    )}
                    <SystemActionButton
                      icon={d.ssl_enabled ? 'lock_open' : 'lock'}
                      onClick={() => handleToggleSSL(d.id, d.ssl_enabled)}
                    >
                      <span className="hidden sm:inline">{d.ssl_enabled ? 'Disable SSL' : 'Enable SSL'}</span>
                    </SystemActionButton>
                    <SystemActionButton
                      variant="danger"
                      icon="delete"
                      onClick={() => handleRemove(d.id)}
                    >
                      <span className="hidden sm:inline">Remove</span>
                    </SystemActionButton>
                  </>
                }
              />
            );
          })}
        </div>
      )}

    </SystemPageShell>
  );
}
