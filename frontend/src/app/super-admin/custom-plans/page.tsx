'use client';
import { useState, useEffect } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';

export default function CustomPlansPage() {
  const [overrides, setOverrides] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingOverride, setEditingOverride] = useState<any | null>(null);
  const [form, setForm] = useState({ developer_id: 0, feature_key: 'max_apps', feature_value: '10', label: '' });

  const fetch = async () => {
    try {
      const [oRes, dRes, fRes] = await Promise.all([
        adminApi.get<any[]>('/admin/custom-plans/overrides'),
        adminApi.get<any[]>('/admin/developers'),
        adminApi.get<any[]>('/admin/custom-plans/available-features'),
      ]);
      setOverrides(oRes.data); setDevelopers(dRes.data); setAvailableFeatures(fRes.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const createOverride = async () => {
    try {
      const feature = availableFeatures.find(f => f.key === form.feature_key);
      const val = feature?.type === 'boolean' ? form.feature_value === 'true' : parseInt(form.feature_value) || form.feature_value;
      await adminApi.post('/admin/custom-plans/overrides', {
        developer_id: form.developer_id,
        feature_key: form.feature_key,
        feature_value: val,
        label: form.label || undefined,
      });
      toast.success('Override created!');
      setShowCreate(false);
      setForm({ developer_id: 0, feature_key: 'max_apps', feature_value: '10', label: '' });
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const updateOverride = async () => {
    if (!editingOverride) return;
    try {
      const feature = availableFeatures.find(f => f.key === form.feature_key);
      const val = feature?.type === 'boolean' ? form.feature_value === 'true' : parseInt(form.feature_value) || form.feature_value;
      await adminApi.put(`/admin/custom-plans/overrides/${editingOverride.id}`, {
        developer_id: form.developer_id,
        feature_key: form.feature_key,
        feature_value: val,
        label: form.label || undefined,
      });
      toast.success('Override updated!');
      setEditingOverride(null);
      setForm({ developer_id: 0, feature_key: 'max_apps', feature_value: '10', label: '' });
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const deleteOverride = async (id: number) => {
    if (!confirm('Delete this override?')) return;
    try { await adminApi.delete(`/admin/custom-plans/overrides/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const toggleOverride = async (id: number) => {
    try { await adminApi.put(`/admin/custom-plans/overrides/${id}/toggle`); fetch(); }
    catch { toast.error('Failed'); }
  };

  const startEdit = (o: any) => {
    setEditingOverride(o);
    setForm({
      developer_id: o.developer_id,
      feature_key: o.feature_key,
      feature_value: typeof o.feature_value === 'boolean' ? String(o.feature_value) : String(o.feature_value ?? ''),
      label: o.label || '',
    });
    setShowCreate(false);
  };

  const FeatureInput = ({ featureKey, value, onChange }: { featureKey: string; value: string; onChange: (v: string) => void }) => {
    const feature = availableFeatures.find(f => f.key === featureKey);
    if (!feature) return <input value={value} onChange={e => onChange(e.target.value)} className="bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] w-full" />;
    if (feature.type === 'boolean') {
      return (
        <div className="flex gap-2">
          <button type="button" onClick={() => onChange('true')} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${value === 'true' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-[var(--card)]/50 border border-white/10 text-[var(--muted-foreground)]'}`}>True</button>
          <button type="button" onClick={() => onChange('false')} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${value === 'false' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[var(--card)]/50 border border-white/10 text-[var(--muted-foreground)]'}`}>False</button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(String(Math.max(0, (parseInt(value) || 0) - 1)))} className="w-10 h-10 rounded-xl bg-[var(--card)]/50 border border-white/10 flex items-center justify-center text-[var(--muted-foreground)] hover:text-white">−</button>
        <input type="number" min={0} value={value} onChange={e => onChange(e.target.value)} className="bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] w-24 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        <button type="button" onClick={() => onChange(String((parseInt(value) || 0) + 1))} className="w-10 h-10 rounded-xl bg-[var(--card)]/50 border border-white/10 flex items-center justify-center text-[var(--muted-foreground)] hover:text-white">+</button>
      </div>
    );
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const activeForm = editingOverride || showCreate;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Custom Plan Builder</h1><p className="text-sm text-[var(--muted-foreground)] mt-1">Override plan features per developer</p></div>
        <button onClick={() => { setShowCreate(true); setEditingOverride(null); setForm({ developer_id: 0, feature_key: 'max_apps', feature_value: '10', label: '' }); }} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all">+ Add Override</button>
      </div>

      {(showCreate || editingOverride) && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-widest">{editingOverride ? 'Edit Override' : 'New Override'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <select value={form.developer_id} onChange={e => setForm({...form, developer_id: parseInt(e.target.value)})} className="bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]">
              <option value={0}>Select developer...</option>
              {developers.map((d: any) => <option key={d.id} value={d.id}>{d.username} ({d.email})</option>)}
            </select>
            <select value={form.feature_key} onChange={e => setForm({...form, feature_key: e.target.value, feature_value: availableFeatures.find(f => f.key === e.target.value)?.type === 'boolean' ? 'true' : '10' })} className="bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]">
              {availableFeatures.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Value</p>
              <FeatureInput featureKey={form.feature_key} value={form.feature_value} onChange={v => setForm({...form, feature_value: v})} />
            </div>
            <input value={form.label} onChange={e => setForm({...form, label: e.target.value})} placeholder="Label (optional)" className="bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] col-span-2" />
          </div>
          <div className="flex gap-3">
            {editingOverride ? (
              <button onClick={updateOverride} disabled={!form.developer_id || !form.feature_key} className="px-4 py-2 bg-amber-500 text-black rounded-xl text-sm font-bold disabled:opacity-50">Update</button>
            ) : (
              <button onClick={createOverride} disabled={!form.developer_id || !form.feature_key} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50">Create</button>
            )}
            <button onClick={() => { setShowCreate(false); setEditingOverride(null); }} className="px-4 py-2 border border-white/10 rounded-xl text-sm text-[var(--muted-foreground)]">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {overrides.map(o => {
          const dev = developers.find((d: any) => d.id === o.developer_id);
          const feature = availableFeatures.find(f => f.key === o.feature_key);
          return (
            <div key={o.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><span className="material-symbols-outlined text-sm text-primary">tune</span></div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{feature?.label || o.feature_key} <span className="text-primary">= {JSON.stringify(o.feature_value)}</span></p>
                  <p className="text-xs text-[var(--muted-foreground)]">{dev?.username || `Dev #${o.developer_id}`} · {o.label || 'No label'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleOverride(o.id)} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${o.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{o.is_active ? 'Active' : 'Inactive'}</button>
                <button onClick={() => startEdit(o)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-[var(--muted-foreground)] hover:text-white"><span className="material-symbols-outlined text-sm">edit</span></button>
                <button onClick={() => deleteOverride(o.id)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-400"><span className="material-symbols-outlined text-sm">delete</span></button>
              </div>
            </div>
          );
        })}
        {overrides.length === 0 && <div className="text-center py-12 text-sm text-[var(--muted-foreground)]">No custom overrides yet. Override specific plan features for individual developers.</div>}
      </div>
    </div>
  );
}
