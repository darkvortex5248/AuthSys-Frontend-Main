'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';

export default function CustomerPanelPage() {
  const { selectedAppId } = useAuthStore();
  const [stats, setStats] = useState({ visits: 0, resets: 0 });
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [panelUrl, setPanelUrl] = useState('');

  const fetchData = async () => {
    if (!selectedAppId) return;
    try {
      setLoading(true);
      const res = await api.get(`/developer/apps/${selectedAppId}/portal-stats`);
      setStats(res.data);
      // Construct real panel URL
      setPanelUrl(`${window.location.origin}/portal/${selectedAppId}`);
    } catch (err) {
      console.error("Failed to fetch portal stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedAppId]);

  if (!selectedAppId) return (
    <div className="flex items-center justify-center h-[60vh] text-zinc-500 italic">
      Please select an application to manage its customer panel.
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-bold text-white tracking-tight">Customer Panel</h2>
        <nav className="flex items-center gap-2 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest mt-2">
          <span>Enterprise</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[var(--vault-primary)]">User Self-Service</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full"></div>
             
             <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <span className="material-symbols-outlined text-3xl">person_search</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Public User Panel</h3>
                    <p className="text-xs text-[var(--vault-on-surface-variant)] font-bold uppercase tracking-widest">Self-Service Portal</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{enabled ? 'Active' : 'Disabled'}</span>
                   <button 
                    onClick={() => setEnabled(!enabled)}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${enabled ? 'bg-emerald-500' : 'bg-white/10'}`}
                   >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${enabled ? 'left-7' : 'left-1'}`}></div>
                   </button>
                </div>
             </div>

             <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] text-[var(--vault-on-surface-variant)] font-bold uppercase tracking-widest ml-1 block">Panel URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      readOnly
                      value={panelUrl}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-emerald-400 focus:outline-none"
                    />
                    <button 
                      onClick={() => { navigator.clipboard.writeText(panelUrl); toast.success("URL Copied!"); }}
                      className="px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-emerald-400"
                    >
                      <span className="material-symbols-outlined text-lg">content_copy</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-[var(--vault-on-surface-variant)] uppercase font-bold mb-2">Total Logins</p>
                      <p className="text-2xl font-bold text-white">{stats.visits.toLocaleString()}</p>
                   </div>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-[var(--vault-on-surface-variant)] uppercase font-bold mb-2">Total HWID Resets</p>
                      <p className="text-2xl font-bold text-white">{stats.resets.toLocaleString()}</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] border border-white/5">
             <h4 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Portal Features</h4>
             <div className="space-y-3">
                {[
                  { icon: 'lock_reset', title: 'HWID Reset', desc: 'Allow users to reset their own hardware lock.' },
                  { icon: 'file_download', title: 'SDK Downloads', desc: 'Host your application files for direct download.' },
                  { icon: 'history', title: 'Login History', desc: 'Users can monitor their own account activity.' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                     <span className="material-symbols-outlined text-emerald-500">{f.icon}</span>
                     <div>
                        <p className="text-sm font-bold text-white">{f.title}</p>
                        <p className="text-xs text-[var(--vault-on-surface-variant)]">{f.desc}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-emerald-500/10 to-transparent">
              <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-widest">Branding</h4>
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 block">Primary Color</label>
                    <div className="flex gap-2">
                       {['#739AFF', '#5865F2', '#10b981', '#f43f5e'].map(c => (
                         <div key={c} className="w-8 h-8 rounded-full border-2 border-white/10 cursor-pointer" style={{ backgroundColor: c }}></div>
                       ))}
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 block">Logo URL</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs" placeholder="https://..." />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
