'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';

export default function RateLimitsPage() {
  const [limits, setLimits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [editRate, setEditRate] = useState(0);
  const [editBurst, setEditBurst] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminApi.get<any[]>('/admin/rate-limits');
        setLimits(res.data || []);
      } catch {
        setLimits([
          { id: 1, name: 'API Requests', route: '/api/v1/*', rate: 100, burst: 200, unit: 'minute' },
          { id: 2, name: 'Auth Endpoints', route: '/api/v1/auth/*', rate: 20, burst: 40, unit: 'minute' },
          { id: 3, name: 'AI Chat', route: '/api/v1/ai/chat', rate: 30, burst: 60, unit: 'minute' },
          { id: 4, name: 'License Validation', route: '/api/v1/license/verify', rate: 200, burst: 400, unit: 'minute' },
          { id: 5, name: 'Admin API', route: '/admin/*', rate: 300, burst: 500, unit: 'minute' },
        ]);
      } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await adminApi.put(`/admin/rate-limits/${editing.id}`, { rate: editRate, burst: editBurst });
      toast.success('Rate limit updated');
      setLimits(prev => prev.map(l => l.id === editing.id ? { ...l, rate: editRate, burst: editBurst } : l));
      setEditing(null);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update rate limit');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Rate Limiting</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Configure API rate limits for all platform endpoints</p>
      </div>

      <div className="grid gap-4">
        {limits.map((l: any) => (
          <div key={l.id} className="glass-card rounded-xl p-6 border border-white/5">
            {editing?.id === l.id ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--foreground)]">{l.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)] font-mono">{l.route}</p>
                  </div>
                  <button onClick={() => setEditing(null)} className="text-xs text-[var(--muted-foreground)] hover:text-white">Cancel</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Rate (requests/{l.unit})</label>
                    <input type="number" value={editRate} onChange={e => setEditRate(parseInt(e.target.value) || 0)}
                      className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-[var(--foreground)]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Burst Limit</label>
                    <input type="number" value={editBurst} onChange={e => setEditBurst(parseInt(e.target.value) || 0)}
                      className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-[var(--foreground)]" />
                  </div>
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-[#131313] font-bold text-xs uppercase tracking-widest disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--foreground)]">{l.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)] font-mono mt-0.5">{l.route}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest font-bold">Rate</p>
                    <p className="text-sm font-mono text-[var(--foreground)]">{l.rate}/{l.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest font-bold">Burst</p>
                    <p className="text-sm font-mono text-[var(--foreground)]">{l.burst}</p>
                  </div>
                  <button onClick={() => { setEditing(l); setEditRate(l.rate); setEditBurst(l.burst); }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-[var(--foreground)] hover:bg-white/10">Edit</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
