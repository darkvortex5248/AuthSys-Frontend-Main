'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

export default function BlacklistPage() {
  const { selectedAppId } = useAuthStore();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ type: 'ip', value: '', reason: '' });
  const [mounted, setMounted] = useState(false);

  const fetchBlacklist = async () => {
    if (!selectedAppId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/developer/blacklist/${selectedAppId}`);
      setBlacklist(res.data);
    } catch (err) {
      console.error("Failed to fetch blacklist", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (selectedAppId) {
      fetchBlacklist();
    } else {
      setLoading(false);
    }
  }, [selectedAppId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return;
    try {
      await api.post('/developer/blacklist/add', { ...formData, app_id: selectedAppId });
      setShowModal(false);
      setFormData({ type: 'ip', value: '', reason: '' });
      fetchBlacklist();
    } catch (err) {
      alert("Failed to add entry");
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Remove from blacklist?',
      message: 'This entry will be removed and will no longer be blocked.',
      confirmLabel: 'Yes, remove',
      cancelLabel: 'No, cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/developer/blacklist/${id}`);
      fetchBlacklist();
    } catch (err) {
      alert("Failed to delete entry");
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--vault-on-surface)] mb-2 tracking-tight">Blacklist Management</h1>
          <p className="text-[var(--vault-on-surface-variant)] text-sm font-medium">Monitoring App ID: {selectedAppId}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-2.5 rounded-lg bg-[var(--vault-primary)] text-[var(--vault-on-primary)] font-bold text-sm shadow-lg shadow-[var(--vault-primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span> Add to Blacklist
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Total Banned', val: blacklist.length, icon: 'lock_person', color: 'var(--vault-primary)' },
          { label: 'IP Bans', val: blacklist.filter(b => b.type === 'ip').length, icon: 'public', color: 'var(--vault-on-surface)' },
          { label: 'HWID Bans', val: blacklist.filter(b => b.type === 'hwid').length, icon: 'computer', color: 'var(--vault-secondary)' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-[64px]">{stat.icon}</span>
            </div>
            <p className="text-[var(--vault-on-surface-variant)] text-[10px] font-bold uppercase tracking-widest mb-2">{stat.label}</p>
            <h3 className="text-4xl font-bold" style={{ color: stat.color }}>{stat.val}</h3>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-left">
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-wider">Target Value</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-wider">Date Added</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {blacklist.map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 font-bold">
                      <span className="material-symbols-outlined p-1.5 rounded text-sm bg-white/5">{row.type === 'ip' ? 'public' : row.type === 'hwid' ? 'computer' : 'person'}</span>
                      <span className="text-sm font-bold text-[var(--vault-on-surface)] uppercase tracking-widest">{row.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-[var(--vault-on-surface)] font-bold">{row.value}</td>
                  <td className="px-6 py-4 text-sm font-medium">{row.reason || 'No reason provided'}</td>
                  <td className="px-6 py-4 text-sm text-[var(--vault-on-surface-variant)] font-medium">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(row.id)}
                      className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-400/10 transition-all"
                    ><span className="material-symbols-outlined text-[20px]">delete</span></button>
                  </td>
                </tr>
              ))}
              {blacklist.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[var(--vault-on-surface-variant)] text-sm">No blacklist entries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[var(--vault-surface)]/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="glass-card w-full max-w-lg rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-[var(--vault-on-surface)]">Blacklist New Target</h2>
                <p className="text-sm text-[var(--vault-on-surface-variant)] font-medium">Restrict access for a specific entity immediately.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[var(--vault-on-surface-variant)] hover:text-[var(--vault-on-surface)]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Target Type</label>
                <select 
                  className="glass-input w-full px-3 py-3 rounded-lg text-sm appearance-none font-bold"
                  value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="ip">IP Address</option>
                  <option value="hwid">Hardware ID (HWID)</option>
                  <option value="username">Username</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Target Value</label>
                <input 
                  className="glass-input w-full px-4 py-3 rounded-lg text-sm font-mono" 
                  placeholder="e.g. 192.168.1.1 or user_name_42" type="text" required
                  value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Reason for Blacklist</label>
                <textarea 
                  className="glass-input w-full px-4 py-3 rounded-lg text-sm min-h-[100px]" 
                  placeholder="Briefly describe the violation..."
                  value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-4 rounded-lg border border-white/5 text-[var(--vault-on-surface)] font-bold hover:bg-white/5 transition-all text-sm uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[1.5] py-3 px-4 rounded-lg bg-[var(--vault-primary)] text-[var(--vault-on-primary)] font-bold shadow-lg shadow-[var(--vault-primary)]/20 hover:brightness-110 active:scale-[0.98] transition-all text-sm uppercase tracking-wider"
                >
                  Add to Blacklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
