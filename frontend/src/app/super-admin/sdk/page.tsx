'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function SDKManagementPage() {
  const [sdks, setSdks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSdk, setEditingSdk] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchSdks();
  }, []);

  const fetchSdks = async () => {
    try {
      const res = await api.get('/admin/sdks');
      setSdks(res.data);
    } catch (err) {
      console.error("Failed to fetch SDKs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    try {
      if (isAdding) {
        await api.post('/admin/sdks', editingSdk, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await api.put(`/admin/sdks/${editingSdk.id}`, editingSdk, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setEditingSdk(null);
      setIsAdding(false);
      fetchSdks();
    } catch (err) {
      console.error("Failed to save SDK", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this SDK from distribution?")) return;
    const token = localStorage.getItem('admin_token');
    try {
      await api.delete(`/admin/sdks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSdks();
    } catch (err) {
      console.error("Failed to delete SDK", err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#d97757]/20 border-t-[#d97757] rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e5e2e1] tracking-tight">SDK Distribution</h1>
          <p className="text-[#8e8ea0] mt-1">Manage global download links for all supported platforms</p>
        </div>
        <button 
          onClick={() => { setEditingSdk({ name: '', version: '1.0.0', download_url: '', icon_name: 'deployed_code', is_active: true }); setIsAdding(true); }}
          className="px-6 py-2.5 rounded-lg bg-[#d97757] text-[#00285d] font-bold transition-all flex items-center gap-2 shadow-lg shadow-[#d97757]/10 hover:opacity-90"
        >
          <span className="material-symbols-outlined">add</span>
          New SDK Binary
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sdks.map((sdk) => (
          <div key={sdk.id} className="glass-card rounded-xl p-6 hover:bg-white/5 transition-all group">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-[#d97757]/10 flex items-center justify-center text-[#d97757]">
                <span className="material-symbols-outlined text-2xl">{sdk.icon_name}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <h3 className="text-sm font-bold text-[#e5e2e1]">{sdk.name}</h3>
                   <span className="px-1.5 py-0.5 rounded bg-white/5 text-[#8e8ea0] text-[9px] font-mono">v{sdk.version}</span>
                </div>
                <p className="text-[10px] text-[#8e8ea0] truncate max-w-[200px]">{sdk.download_url}</p>
              </div>
              <div className="flex flex-col gap-2">
                 <button onClick={() => { setEditingSdk(sdk); setIsAdding(false); }} className="p-2 rounded-lg hover:bg-[#d97757]/10 text-[#d97757] transition-colors">
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
              <h2 className="text-xl font-bold text-[#e5e2e1] mb-6">{isAdding ? 'Add New SDK' : 'Edit SDK Link'}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                 <div>
                   <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-1.5">Platform Name</label>
                   <input 
                    type="text" 
                    value={editingSdk.name}
                    onChange={e => setEditingSdk({...editingSdk, name: e.target.value})}
                    placeholder="e.g. C++, Rust, Go"
                    className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[#e5e2e1] focus:ring-2 focus:ring-[#d97757]/50 outline-none text-sm"
                    required
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-1.5">Version</label>
                      <input 
                        type="text" 
                        value={editingSdk.version}
                        onChange={e => setEditingSdk({...editingSdk, version: e.target.value})}
                        className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[#e5e2e1] focus:ring-2 focus:ring-[#d97757]/50 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-1.5">Icon ID</label>
                      <input 
                        type="text" 
                        value={editingSdk.icon_name}
                        onChange={e => setEditingSdk({...editingSdk, icon_name: e.target.value})}
                        className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[#e5e2e1] focus:ring-2 focus:ring-[#d97757]/50 outline-none text-sm font-mono"
                      />
                    </div>
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-1.5">Download URL</label>
                   <input 
                    type="url" 
                    value={editingSdk.download_url}
                    onChange={e => setEditingSdk({...editingSdk, download_url: e.target.value})}
                    className="w-full bg-[#0b0e15]/50 border border-white/5 rounded-xl py-2.5 px-4 text-[#d97757] focus:ring-2 focus:ring-[#d97757]/50 outline-none text-xs font-mono"
                    required
                   />
                 </div>
                 <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setEditingSdk(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-[#8e8ea0] font-bold text-xs uppercase">Cancel</button>
                    <button type="submit" className="flex-1 py-3 rounded-xl bg-[#d97757] text-[#00285d] font-black text-xs uppercase shadow-xl shadow-[#d97757]/10">Save Configuration</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
