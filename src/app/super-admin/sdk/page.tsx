'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';

export default function SDKManagementPage() {
  const confirm = useConfirm();
  const [sdks, setSdks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSdk, setEditingSdk] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchSdks();
  }, []);

  const fetchSdks = async () => {
    try {
      const res = await adminApi.get<any[]>('/admin/sdks');
      setSdks(res.data);
    } catch (err) {
      console.error("Failed to fetch SDKs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isAdding) {
        await adminApi.post('/admin/sdks', editingSdk);
      } else {
        await adminApi.put(`/admin/sdks/${editingSdk.id}`, editingSdk);
      }
      setEditingSdk(null);
      setIsAdding(false);
      fetchSdks();
      toast.success('SDK saved');
    } catch (err) {
      toast.error('Failed to save SDK');
      console.error("Failed to save SDK", err);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Remove SDK?',
      message: 'Are you sure you want to remove this SDK from distribution?',
      confirmLabel: 'Yes, remove',
      cancelLabel: 'No, cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminApi.delete(`/admin/sdks/${id}`);
      fetchSdks();
      toast.success('SDK removed');
    } catch (err) {
      toast.error('Failed to delete SDK');
      console.error("Failed to delete SDK", err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">SDK Distribution</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Manage global download links for all supported platforms</p>
        </div>
        <button 
          onClick={() => { setEditingSdk({ name: '', version: '1.0.0', download_url: '', icon_name: 'deployed_code', is_active: true }); setIsAdding(true); }}
          className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[#131313] font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-[var(--primary)]/20"
        >
          <span className="material-symbols-outlined">add</span>
          New SDK Binary
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sdks.map((sdk) => (
          <div key={sdk.id} className="glass-card rounded-xl p-6 hover:bg-white/5 transition-all group">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                <span className="material-symbols-outlined text-2xl">{sdk.icon_name}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <h3 className="text-sm font-bold text-[var(--foreground)]">{sdk.name}</h3>
                   <span className="px-1.5 py-0.5 rounded bg-white/5 text-[var(--muted-foreground)] text-[9px] font-mono">v{sdk.version}</span>
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)] truncate max-w-[200px]">{sdk.download_url}</p>
              </div>
              <div className="flex flex-col gap-2">
                 <button onClick={() => { setEditingSdk(sdk); setIsAdding(false); }} className="p-2 rounded-lg hover:bg-[var(--primary)]/10 text-[var(--primary)] transition-colors">
                    <span className="material-symbols-outlined text-sm">edit</span>
                 </button>
                 <button onClick={() => handleDelete(sdk.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
                    <span className="material-symbols-outlined text-sm">delete</span>
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingSdk && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0b0e15]/80 backdrop-blur-sm">
           <div className="w-full max-w-lg bg-[#1d2027] border border-white/10 rounded-3xl p-8 shadow-2xl relative">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">{isAdding ? 'Add New SDK' : 'Edit SDK Link'}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                 <div>
                   <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-1.5">Platform Name</label>
                   <input 
                    type="text" 
                    value={editingSdk.name}
                    onChange={e => setEditingSdk({...editingSdk, name: e.target.value})}
                    placeholder="e.g. C++, Rust, Go"
                    className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)]/50 outline-none text-sm"
                    required
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-1.5">Version</label>
                      <input 
                        type="text" 
                        value={editingSdk.version}
                        onChange={e => setEditingSdk({...editingSdk, version: e.target.value})}
                        className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)]/50 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-1.5">Icon ID</label>
                      <input 
                        type="text" 
                        value={editingSdk.icon_name}
                        onChange={e => setEditingSdk({...editingSdk, icon_name: e.target.value})}
                        className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)]/50 outline-none text-sm font-mono"
                      />
                    </div>
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-1.5">Download URL</label>
                   <input 
                    type="url" 
                    value={editingSdk.download_url}
                    onChange={e => setEditingSdk({...editingSdk, download_url: e.target.value})}
                    className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/50 outline-none text-xs font-mono"
                    required
                   />
                 </div>
                 <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setEditingSdk(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-[var(--muted-foreground)] font-bold text-xs uppercase">Cancel</button>
                    <button type="submit" className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-[#00285d] font-black text-xs uppercase shadow-xl shadow-[var(--primary)]/10">Save Configuration</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
