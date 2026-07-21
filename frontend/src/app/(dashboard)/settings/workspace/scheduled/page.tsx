'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function WorkspaceScheduledPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    app_id: 0, action_type: 'bulk_expire', target_type: 'license_key',
    target_filter: '{}', payload: '{}', scheduled_at: '',
  });

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

  const createAction = async () => {
    try {
      await api.post('/developer/scheduled', {
        ...form,
        app_id: form.app_id || undefined,
        target_filter: JSON.parse(form.target_filter || '{}'),
        payload: JSON.parse(form.payload || '{}'),
      });
      toast.success('Scheduled action created!');
      setShowCreate(false);
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const deleteAction = async (id: number) => {
    if (!confirm('Cancel this scheduled action?')) return;
    try { await api.delete(`/developer/scheduled/${id}`); toast.success('Cancelled'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const executeNow = async (id: number) => {
    if (!confirm('Execute this action immediately?')) return;
    try {
      const res = await api.post(`/developer/scheduled/${id}/execute`);
      toast.success(`Executed: ${JSON.stringify(res.data.result)}`);
      fetch();
    } catch { toast.error('Failed'); }
  };

  if (!mounted) {
    return (
      <div className="max-w-4xl space-y-6 animate-pulse">
        <div className="flex justify-between">
          <div><div className="sk h-7 w-44 rounded-lg" /><div className="sk h-4 w-56 rounded mt-1" /></div>
          <div className="sk h-10 w-36 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="premium-card p-4 space-y-3"><div className="sk h-5 w-32 rounded" /><div className="sk h-3 w-48 rounded" /></div>)}
        </div>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Scheduled Actions</h1><p className="text-sm text-[var(--muted-foreground)] mt-1">Schedule bulk license/user operations for later execution</p></div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm font-bold text-primary hover:bg-primary/20 transition-all">+ Schedule Action</button>
      </div>

      {showCreate && (
        <div className="premium-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[var(--foreground)]">New Scheduled Action</h3>
          <div className="grid grid-cols-2 gap-4">
            <select value={form.action_type} onChange={e => setForm({...form, action_type: e.target.value})} className="bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]">
              <option value="bulk_expire">Bulk Expire</option>
              <option value="bulk_suspend">Bulk Suspend</option>
              <option value="notify">Notify</option>
            </select>
            <select value={form.target_type} onChange={e => setForm({...form, target_type: e.target.value})} className="bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]">
              <option value="license_key">License Keys</option>
              <option value="end_user">End Users</option>
            </select>
            <select value={form.app_id} onChange={e => setForm({...form, app_id: parseInt(e.target.value)})} className="bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]">
              <option value={0}>All apps</option>
              {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({...form, scheduled_at: e.target.value})} className="bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]" />
          </div>
          <input value={form.target_filter} onChange={e => setForm({...form, target_filter: e.target.value})} placeholder='Filter: {"key_type": "time"}' className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] font-mono" />
          <div className="flex gap-3">
            <button onClick={createAction} disabled={!form.scheduled_at} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50">Schedule</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-white/10 rounded-xl text-sm text-[var(--muted-foreground)]">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {actions.map(a => (
          <div key={a.id} className="premium-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                a.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                a.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                a.status === 'running' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-blue-500/10 text-blue-400'
              }`}>
                <span className="material-symbols-outlined text-sm">schedule</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)] capitalize">{a.action_type.replace('_', ' ')} · {a.target_type}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Scheduled: {new Date(a.scheduled_at).toLocaleString()}{a.executed_at ? ` · Executed: ${new Date(a.executed_at).toLocaleString()}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                a.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                a.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                a.status === 'running' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-blue-500/10 text-blue-400'
              }`}>{a.status}</span>
              {a.status === 'pending' && (
                <>
                  <button onClick={() => executeNow(a.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20">Execute Now</button>
                  <button onClick={() => deleteAction(a.id)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-400"><span className="material-symbols-outlined text-sm">delete</span></button>
                </>
              )}
            </div>
          </div>
        ))}
        {actions.length === 0 && <div className="text-center py-8 text-sm text-[var(--muted-foreground)]">No scheduled actions. Create one to automate bulk operations.</div>}
      </div>
    </div>
  );
}
