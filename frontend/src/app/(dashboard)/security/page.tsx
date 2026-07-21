'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function SecurityPage() {
  const [tab, setTab] = useState<'ipwhitelist' | 'apikeys'>('ipwhitelist');
  const [rules, setRules] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRule, setShowNewRule] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState<any>(null);
  const [form, setForm] = useState({ app_id: 0, rule_type: 'ip', value: '', note: '', is_blocklist: false });
  const [keyForm, setKeyForm] = useState({ name: '', scopes: [] as string[] });
  const [scopes, setScopes] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetch = async () => {
    try {
      const [rulesRes, keysRes, appsRes] = await Promise.all([
        api.get('/developer/security/ipwhitelist'),
        api.get('/developer/security/apikeys'),
        api.get('/developer/apps'),
      ]);
      setRules(rulesRes.data); setKeys(keysRes.data); setApps(appsRes.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to load');
    } finally { setLoading(false); }
  };
  useEffect(() => {
    fetch();
    api.get('/developer/security/apikeys/scopes').then(r => setScopes(r.data)).catch(() => {});
  }, []);

  const addRule = async () => {
    try {
      await api.post('/developer/security/ipwhitelist', form);
      toast.success('Rule added');
      setShowNewRule(false);
      setForm({ app_id: 0, rule_type: 'ip', value: '', note: '', is_blocklist: false });
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const deleteRule = async (id: number) => {
    try { await api.delete(`/developer/security/ipwhitelist/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const toggleRule = async (id: number) => {
    try { await api.put(`/developer/security/ipwhitelist/${id}/toggle`); fetch(); }
    catch { toast.error('Failed'); }
  };

  const createKey = async () => {
    try {
      const res = await api.post('/developer/security/apikeys', keyForm);
      setNewKeyResult(res.data);
      toast.success('API key created - copy it now!');
      setShowNewKey(false);
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const deleteKey = async (id: number) => {
    try { await api.delete(`/developer/security/apikeys/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const toggleKey = async (id: number) => {
    try { await api.put(`/developer/security/apikeys/${id}/toggle`); fetch(); }
    catch { toast.error('Failed'); }
  };

  if (!mounted) return null;

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-10 w-52 bg-[var(--accent-opacity-8)] rounded-xl" />
        <div className="h-4 w-72 bg-[var(--accent-opacity-8)] rounded-xl" />
      </div>
      <div className="h-10 w-64 bg-[var(--accent-opacity-8)] rounded-xl" />
      <div className="space-y-3">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-[var(--accent-opacity-8)] rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="page-wrapper pt-6">
      <style>{`
        @keyframes rowIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .sec-item { animation:rowIn 0.3s ease-out both; }
      `}</style>
      <div className="mb-6">
        <h1 className="page-title">Security</h1>
        <p className="text-white/35 mt-1 text-sm font-medium">IP whitelist, geo-fencing, and API keys</p>
      </div>
      <div className="flex gap-2 p-1 bg-[var(--card)]/50 rounded-xl w-fit border border-white/5 mb-8">
        <button onClick={() => setTab('ipwhitelist')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'ipwhitelist' ? 'bg-primary/20 text-primary' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}>IP Whitelist</button>
        <button onClick={() => setTab('apikeys')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'apikeys' ? 'bg-primary/20 text-primary' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}>API Keys</button>
      </div>

      {tab === 'ipwhitelist' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowNewRule(true)} className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm font-bold text-primary hover:bg-primary/20 transition-all">+ Add Rule</button>
          </div>
          {showNewRule && (
            <div className="glass-card rounded-xl p-5 space-y-4 border border-primary/20">
              <h3 className="text-sm font-bold text-[var(--foreground)]">New IP Rule</h3>
              <div className="grid grid-cols-2 gap-4">
                <select value={form.app_id} onChange={e => setForm({...form, app_id: parseInt(e.target.value)})} className="col-span-2 bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]">
                  <option value={0}>Select app...</option>
                  {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select value={form.rule_type} onChange={e => setForm({...form, rule_type: e.target.value})} className="bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]">
                  <option value="ip">IP Address</option>
                  <option value="cidr">CIDR Range</option>
                  <option value="country">Country Code</option>
                </select>
                <input value={form.value} onChange={e => setForm({...form, value: e.target.value})} placeholder={form.rule_type === 'country' ? 'US, GB, DE...' : '192.168.1.1'} className="bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]" />
                <input value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="Note (optional)" className="bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_blocklist} onChange={e => setForm({...form, is_blocklist: e.target.checked})} className="w-4 h-4 rounded border-white/20 text-red-500" />
                  <span className="text-sm text-red-400">Block rule (instead of allow)</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={addRule} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold">Add Rule</button>
                <button onClick={() => setShowNewRule(false)} className="px-4 py-2 border border-white/10 rounded-xl text-sm text-[var(--muted-foreground)]">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {rules.map((r, i) => (
              <div key={r.id} className="glass-card rounded-xl p-4 flex items-center justify-between sec-item" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.is_blocklist ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                    <span className="material-symbols-outlined text-sm">{r.is_blocklist ? 'block' : 'check_circle'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{r.value} <span className="text-[10px] text-[var(--muted-foreground)] font-mono">({r.rule_type})</span></p>
                    <p className="text-xs text-[var(--muted-foreground)]">{r.note || 'No note'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleRule(r.id)} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${r.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{r.is_active ? 'Active' : 'Inactive'}</button>
                  <button onClick={() => deleteRule(r.id)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-400"><span className="material-symbols-outlined text-sm">delete</span></button>
                </div>
              </div>
            ))}
            {rules.length === 0 && <div className="text-center py-8 text-sm text-[var(--muted-foreground)]">No IP rules configured</div>}
          </div>
        </div>
      )}

      {tab === 'apikeys' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setShowNewKey(true); setNewKeyResult(null); }} className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm font-bold text-primary hover:bg-primary/20 transition-all">+ Create API Key</button>
          </div>
          {newKeyResult && (
            <div className="glass-card rounded-xl p-5 border border-yellow-500/30 bg-yellow-500/5 space-y-3">
              <div className="flex items-center gap-2 text-yellow-400"><span className="material-symbols-outlined">warning</span><span className="text-sm font-bold">Save this key - it won't be shown again!</span></div>
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-xs text-[var(--muted-foreground)] mb-1">Your API Key:</p>
                <p className="text-sm font-mono text-yellow-300 select-all break-all">{newKeyResult.raw_key}</p>
              </div>
              <button onClick={() => { setNewKeyResult(null); }} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Dismiss</button>
            </div>
          )}
          {showNewKey && !newKeyResult && (
            <div className="glass-card rounded-xl p-5 space-y-4 border border-primary/20">
              <h3 className="text-sm font-bold text-[var(--foreground)]">New API Key</h3>
              <input value={keyForm.name} onChange={e => setKeyForm({...keyForm, name: e.target.value})} placeholder="Key name (e.g. Production CI)" className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]" />
              <div>
                <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Scopes</p>
                <div className="grid grid-cols-2 gap-2">
                  {scopes.map(s => (
                    <label key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--card)]/30 border border-white/5 cursor-pointer hover:bg-[var(--card)]/50">
                      <input type="checkbox" checked={keyForm.scopes.includes(s.id)} onChange={e => setKeyForm({...keyForm, scopes: e.target.checked ? [...keyForm.scopes, s.id] : keyForm.scopes.filter(x => x !== s.id)})} className="w-3.5 h-3.5 rounded border-white/20 text-primary" />
                      <span className="text-xs text-[var(--foreground)]">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={createKey} disabled={!keyForm.name} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50">Create Key</button>
                <button onClick={() => setShowNewKey(false)} className="px-4 py-2 border border-white/10 rounded-xl text-sm text-[var(--muted-foreground)]">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {keys.map((k, i) => (
              <div key={k.id} className="glass-card rounded-xl p-4 flex items-center justify-between sec-item" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><span className="material-symbols-outlined text-sm text-primary">key</span></div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{k.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Prefix: {k.key_prefix}... · Scopes: {k.scopes?.length || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleKey(k.id)} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${k.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{k.is_active ? 'Active' : 'Inactive'}</button>
                  <button onClick={() => deleteKey(k.id)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-400"><span className="material-symbols-outlined text-sm">delete</span></button>
                </div>
              </div>
            ))}
            {keys.length === 0 && <div className="text-center py-8 text-sm text-[var(--muted-foreground)]">No API keys created yet</div>}
          </div>
        </div>
      )}
    </div>
  );
}
