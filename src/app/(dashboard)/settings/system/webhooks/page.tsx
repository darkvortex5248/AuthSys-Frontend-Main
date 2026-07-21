'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useAuthStore } from '@/store/auth';
import { useDeveloperMe } from '@/hooks/use-developer-queries';
import { isFeatureLocked } from '@/lib/plan-access';
import PremiumLocked from '@/components/PremiumLocked';
import { ArrowLeft, Plus, Trash2, TestTube, RefreshCw, Globe, Webhook } from 'lucide-react';
import Link from 'next/link';

type WebhookEndpoint = {
  id: number;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  description: string;
  last_sent_at: string | null;
  last_status: string | null;
  created_at: string;
};

const EVENT_OPTIONS = [
  { value: 'license.created', label: 'License Created' },
  { value: 'license.revoked', label: 'License Revoked' },
  { value: 'license.verified', label: 'License Verified' },
  { value: 'license.expired', label: 'License Expired' },
  { value: 'user.registered', label: 'User Registered' },
  { value: 'user.banned', label: 'User Banned' },
  { value: 'user.deleted', label: 'User Deleted' },
  { value: 'threat.detected', label: 'Threat Detected' },
  { value: 'threat.blocked', label: 'Threat Blocked' },
  { value: 'billing.payment', label: 'Payment Received' },
  { value: 'billing.subscription', label: 'Subscription Changed' },
  { value: 'app.created', label: 'App Created' },
  { value: 'app.deleted', label: 'App Deleted' },
  { value: 'key.generated', label: 'Key Generated' },
];

export default function WebhooksPage() {
  const { data: profile } = useDeveloperMe(true);
  const locked = isFeatureLocked('developer', profile?.subscription_tier);

  const router = useRouter();
  const confirm = useConfirm();
  const selectedAppId = useAuthStore((s) => s.selectedAppId);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WebhookEndpoint | null>(null);
  const [formUrl, setFormUrl] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<number | null>(null);
  const [deliveryLog, setDeliveryLog] = useState<any[]>([]);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (locked) return <PremiumLocked feature="Webhooks" tier="Developer" />;

  const fetchWebhooks = async () => {
    try {
      const res = await api.get<WebhookEndpoint[]>('/developer/webhooks');
      setWebhooks(res.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWebhooks(); }, []);

  const handleSave = async () => {
    if (!formUrl.trim()) { toast.error('Webhook URL is required'); return; }
    if (!selectedAppId) { toast.error('Please select an application first'); return; }
    setSaving(true);
    try {
      const payload = { app_id: selectedAppId, url: formUrl, description: formDesc, events: formEvents, is_active: true };
      if (editing) {
        await api.put(`/developer/webhooks/${editing.id}`, { url: formUrl, description: formDesc, events: formEvents });
        toast.success('Webhook updated');
      } else {
        await api.post('/developer/webhooks', payload);
        toast.success('Webhook created');
      }
      setShowModal(false);
      setEditing(null);
      setFormUrl('');
      setFormDesc('');
      setFormEvents([]);
      fetchWebhooks();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save webhook');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Delete webhook?',
      message: 'This webhook endpoint will be permanently removed.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/developer/webhooks/${id}`);
      toast.success('Webhook deleted');
      fetchWebhooks();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete webhook');
    }
  };

  const handleTest = async (id: number) => {
    setTesting(id);
    try {
      const res = await api.post(`/developer/webhooks/${id}/test`);
      toast.success(res.data?.message || 'Test event sent');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Test failed');
    } finally {
      setTesting(null);
    }
  };

  const handleToggle = async (wh: WebhookEndpoint) => {
    try {
      await api.put(`/developer/webhooks/${wh.id}`, { is_active: !wh.is_active });
      toast.success(`Webhook ${wh.is_active ? 'disabled' : 'enabled'}`);
      fetchWebhooks();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to toggle webhook');
    }
  };

  const openEdit = (wh: WebhookEndpoint) => {
    setEditing(wh);
    setFormUrl(wh.url);
    setFormDesc(wh.description || '');
    setFormEvents(wh.events || []);
    setShowModal(true);
  };

  const fetchLog = async (id: number) => {
    try {
      const res = await api.get<any[]>(`/developer/webhooks/${id}/logs`);
      setDeliveryLog(res.data || []);
      setShowLog(true);
    } catch {
      toast.error('Failed to load delivery log');
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse pb-20">
        <div className="flex items-center gap-4">
          <div className="sk h-9 w-9 rounded-xl" />
          <div className="space-y-2">
            <div className="sk h-7 w-32 rounded-lg" />
            <div className="sk h-4 w-56 rounded" />
          </div>
        </div>
        <div className="flex justify-between">
          <div className="sk h-10 w-64 rounded-xl" />
          <div className="sk h-10 w-28 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="premium-card p-5 space-y-3"><div className="sk h-5 w-48 rounded" /><div className="sk h-4 w-full rounded" /><div className="flex gap-2"><div className="sk h-6 w-20 rounded-full" /><div className="sk h-6 w-24 rounded-full" /></div></div>)}
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings/system" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Webhooks</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Receive real-time events via HTTP callbacks</p>
          </div>
        </div>
        <button onClick={() => { setEditing(null); setFormUrl(''); setFormDesc(''); setFormEvents([]); setShowModal(true); }}
          className="h-10 px-5 bg-[var(--primary)] text-black font-bold text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> Add Webhook
        </button>
      </div>

      {webhooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
            <Webhook className="w-8 h-8 text-[var(--primary)]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No webhooks configured</h3>
          <p className="text-sm text-[var(--muted-foreground)] max-w-md mb-6">
            Create webhook endpoints to receive real-time events about licenses, users, threats, and more.
          </p>
          <button onClick={() => { setEditing(null); setFormUrl(''); setFormDesc(''); setFormEvents([]); setShowModal(true); }}
            className="h-10 px-5 bg-[var(--primary)] text-black font-bold text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Create Your First Webhook
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map(wh => (
            <div key={wh.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${wh.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <span className="text-sm font-bold text-white truncate">{wh.description || wh.url}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${wh.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {wh.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[var(--muted-foreground)] truncate max-w-xl">{wh.url}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(wh.events || []).slice(0, 4).map(ev => (
                      <span key={ev} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold text-[var(--muted-foreground)]">{ev}</span>
                    ))}
                    {(wh.events || []).length > 4 && (
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold text-[var(--primary)]">+{wh.events.length - 4}</span>
                    )}
                  </div>
                  {wh.last_sent_at && (
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-2">
                      Last sent: {new Date(wh.last_sent_at).toLocaleString()} 
                      {wh.last_status && <span className={`ml-2 font-bold ${wh.last_status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{wh.last_status}</span>}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <button onClick={() => handleTest(wh.id)} disabled={testing === wh.id}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-[var(--primary)] hover:border-[var(--primary)]/30 transition-all disabled:opacity-40"
                    title="Send test event">
                    {testing === wh.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleToggle(wh)}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    title={wh.is_active ? 'Disable' : 'Enable'}>
                    <span className="material-symbols-outlined text-sm">{wh.is_active ? 'pause' : 'play_arrow'}</span>
                  </button>
                  <button onClick={() => openEdit(wh)}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    title="Edit">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button onClick={() => handleDelete(wh.id)}
                    className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all"
                    title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => fetchLog(wh.id)}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    title="Delivery log">
                    <span className="material-symbols-outlined text-sm">history</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[var(--card)] border border-white/10 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">{editing ? 'Edit Webhook' : 'Create Webhook'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Payload URL</label>
                <input value={formUrl} onChange={e => setFormUrl(e.target.value)}
                  className="w-full bg-[var(--background)] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white"
                  placeholder="https://your-server.com/webhook" type="url" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Description (optional)</label>
                <input value={formDesc} onChange={e => setFormDesc(e.target.value)}
                  className="w-full bg-[var(--background)] border border-white/10 rounded-xl py-3 px-4 text-sm text-white"
                  placeholder="e.g. Discord notification channel" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-3">Subscribe to Events</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {EVENT_OPTIONS.map(ev => (
                    <label key={ev.value} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                      formEvents.includes(ev.value)
                        ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-white'
                        : 'bg-white/5 border-white/10 text-[var(--muted-foreground)] hover:bg-white/10'
                    }`}>
                      <input type="checkbox" checked={formEvents.includes(ev.value)}
                        onChange={() => setFormEvents(prev => prev.includes(ev.value) ? prev.filter(e => e !== ev.value) : [...prev, ev.value])}
                        className="sr-only" />
                      <span className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        formEvents.includes(ev.value) ? 'bg-[var(--primary)] border-[var(--primary)]' : 'bg-transparent border-white/20'
                      }`}>
                        {formEvents.includes(ev.value) && <span className="material-symbols-outlined text-[12px] text-black font-bold">check</span>}
                      </span>
                      <span className="text-xs font-medium">{ev.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-black font-bold text-xs uppercase tracking-widest disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update Webhook' : 'Create Webhook'}
              </button>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-xs uppercase tracking-widest text-white">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delivery Log Modal ── */}
      {showLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[var(--card)] border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Delivery Log</h2>
              <button onClick={() => setShowLog(false)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-all">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            {deliveryLog.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-[var(--muted-foreground)]">No delivery attempts yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {deliveryLog.map((log: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-emerald-400' : log.status === 'pending' ? 'bg-amber-400' : 'bg-red-400'}`} />
                      <div>
                        <p className="text-xs font-bold text-white">{log.event || 'Event'}</p>
                        <p className="text-[10px] text-[var(--muted-foreground)] font-mono">{log.url}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${log.status === 'success' ? 'text-emerald-400' : log.status === 'pending' ? 'text-amber-400' : 'text-red-400'}`}>{log.status}</p>
                      <p className="text-[9px] text-[var(--muted-foreground)] mt-0.5">{log.duration ? `${log.duration}ms` : ''} {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowLog(false)} className="w-full mt-4 py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-xs uppercase tracking-widest text-white">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
