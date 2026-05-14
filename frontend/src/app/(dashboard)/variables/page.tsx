'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function VariablesPage() {
  const { selectedAppId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [variables, setVariables] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ key_name: '', key_value: '', is_global: true });
  const [mounted, setMounted] = useState(false);

  const fetchVariables = async () => {
    if (!selectedAppId) return;
    setLoading(true);
    try {
      const res = await api.get(`/developer/variables/${selectedAppId}`);
      setVariables(res.data);
    } catch (err) {
      console.error("Failed to fetch variables", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchVariables();
  }, [selectedAppId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return;
    try {
      await api.post('/developer/variables/create', { ...formData, app_id: selectedAppId });
      setShowModal(false);
      setFormData({ key_name: '', key_value: '', is_global: true });
      fetchVariables();
    } catch (err) {
      alert("Failed to create variable");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this variable?")) return;
    try {
      await api.delete(`/developer/variables/${id}`);
      fetchVariables();
    } catch (err) {
      alert("Failed to delete variable");
    }
  };

  if (!mounted) return null;

  if (!selectedAppId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-[var(--vault-on-surface-variant)]">
        <span className="material-symbols-outlined text-6xl mb-4 opacity-20">apps</span>
        <p className="text-xl font-bold">Please select an application first</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-bold text-[var(--vault-on-surface)] tracking-tight">Global Variables</h2>
          <p className="text-sm text-[var(--vault-on-surface-variant)] font-medium mt-2 max-w-2xl leading-relaxed">Managing environment parameters for App ID: {selectedAppId}</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[var(--vault-primary)] text-[var(--vault-on-primary)] px-6 py-3 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(173,198,255,0.4)] transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Create Variable
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Total Variables', val: variables.length, icon: 'data_object', color: 'var(--vault-primary)' },
          { label: 'Global', val: variables.filter(v => v.is_global).length, icon: 'public', color: 'var(--vault-secondary)' },
          { label: 'Scoped', val: variables.filter(v => !v.is_global).length, icon: 'lock', color: 'red-400' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl flex items-center justify-between group">
            <div>
              <p className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] mb-1 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-bold text-[var(--vault-on-surface)]">{stat.val}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-[var(--vault-primary)]/30 transition-all">
              <span className="material-symbols-outlined" style={{ color: stat.color }}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] text-[var(--vault-on-surface-variant)] uppercase tracking-widest font-bold border-b border-white/5 bg-white/[0.01]">
                {['Name', 'Scope', 'Value', 'Created', 'Actions'].map((h, i) => (
                  <th key={h} className={`px-6 py-4 ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {variables.map((v, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[var(--vault-primary)]/60 text-[18px]">data_object</span>
                      <span className="font-bold text-[var(--vault-on-surface)]">{v.key_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit uppercase tracking-widest ${v.is_global ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-blue-400/10 text-blue-400 border-blue-400/20'}`}>
                      {v.is_global ? 'Global' : 'Scoped'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 font-mono text-xs text-[var(--vault-on-surface-variant)] bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                      <span className="truncate max-w-[200px]">{v.key_value}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs text-[var(--vault-on-surface-variant)] font-medium">
                    {new Date(v.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDelete(v.id)}
                        className="p-2 hover:bg-red-400/5 rounded-lg text-red-400"
                      ><span className="material-symbols-outlined text-[18px]">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
              {variables.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[var(--vault-on-surface-variant)] text-sm">No variables defined for this application.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[var(--vault-surface)]/80 backdrop-blur-sm transition-all duration-300">
          <div className="glass-card w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-xl font-bold text-[var(--vault-on-surface)]">New Variable</h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--vault-on-surface-variant)] hover:text-red-400 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Variable Name</label>
                <input 
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm" 
                  placeholder="e.g. SERVER_IP" type="text" required
                  value={formData.key_name} onChange={(e) => setFormData({...formData, key_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Scope</label>
                <select 
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm appearance-none"
                  value={formData.is_global ? 'true' : 'false'} onChange={(e) => setFormData({...formData, is_global: e.target.value === 'true'})}
                >
                  <option value="true">Global (All Users)</option>
                  <option value="false">Scoped (Specific Users)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Value</label>
                <textarea 
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm font-mono h-24 resize-none" 
                  placeholder="Enter variable content here..." required
                  value={formData.key_value} onChange={(e) => setFormData({...formData, key_value: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 border border-white/5 rounded-xl font-bold text-xs uppercase">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 bg-[var(--vault-primary)] text-[var(--vault-on-primary)] rounded-xl font-bold shadow-lg shadow-[var(--vault-primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs uppercase">Create Variable</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
