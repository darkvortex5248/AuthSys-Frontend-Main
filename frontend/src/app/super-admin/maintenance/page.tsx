'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';

export default function MaintenancePage() {
  const [mode, setMode] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminApi.get<any>('/admin/maintenance');
        const data = res.data || {};
        setMode(data.enabled || false);
        setMessage(data.message || '');
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.put('/admin/maintenance', { enabled: mode, message });
      toast.success(`Maintenance mode ${mode ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Maintenance Mode</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Enable or disable platform-wide maintenance mode</p>
      </div>

      <div className="glass-card rounded-2xl p-8 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">Maintenance Mode</h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">When enabled, only admins can access the platform. All other users will see the maintenance page.</p>
          </div>
          <button onClick={() => setMode(!mode)}
            className={`relative w-14 h-8 rounded-full transition-all ${mode ? 'bg-[var(--primary)]' : 'bg-white/10'}`}>
            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${mode ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {mode && (
          <div className="space-y-4 mt-6 pt-6 border-t border-white/5">
            <div>
              <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Maintenance Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-[var(--foreground)] resize-none"
                placeholder="We are currently undergoing scheduled maintenance. Please check back shortly." />
            </div>
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <p className="text-xs text-amber-400 font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">warning</span>
                All API requests from non-admin users will receive a 503 Service Unavailable response.
              </p>
            </div>
          </div>
        )}

        <button onClick={handleSave} disabled={saving}
          className="mt-6 px-6 py-3 rounded-xl bg-[var(--primary)] text-[#131313] font-bold text-xs uppercase tracking-widest disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
