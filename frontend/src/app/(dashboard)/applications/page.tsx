'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', version: '1.0.0', min_version: '0.9.0', hwid_enabled: true });
  const [creating, setCreating] = useState(false);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<number, boolean>>({});

  const toggleSecretVisibility = (id: number) => {
    setVisibleSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const fetchApps = async () => {
    try {
      const res = await api.get('/developer/apps');
      setApps(res.data);
    } catch (err) {
      console.error("Failed to fetch apps", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert("Application name is required");
      return;
    }
    setCreating(true);
    try {
      await api.post('/developer/apps/create', formData);
      setShowModal(false);
      fetchApps();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Failed to create app";
      alert(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await api.put(`/developer/apps/${id}/toggle`);
      fetchApps();
    } catch (err) {
      alert("Failed to toggle app");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this app?")) return;
    try {
      await api.delete(`/developer/apps/${id}`);
      fetchApps();
    } catch (err) {
      alert("Failed to delete app");
    }
  };

  const handleRegenSecret = async (id: number) => {
    try {
      const res = await api.post(`/developer/apps/${id}/regenerate-secret`);
      alert(`New App Secret: ${res.data.app_secret}\n\nPlease copy it now, it won't be shown again.`);
      fetchApps();
    } catch (err) {
      alert("Failed to regenerate secret");
    }
  };

  return (
    <>
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--vault-on-surface)]">My Applications</h1>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 mt-3">
            <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
              <span className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest">Total</span>
              <span className="text-sm font-bold text-[var(--vault-primary)]">{apps.length}</span>
            </div>
            <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
              <span className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest">Users</span>
              <span className="text-sm font-bold text-emerald-400">{apps.reduce((acc, a) => acc + (a.total_users || 0), 0)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest">Inactive</span>
              <span className="text-sm font-bold text-[var(--vault-on-surface-variant)]">{apps.filter(a => a.status !== 'active').length}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[var(--vault-primary)] text-[var(--vault-on-primary)] px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-[var(--vault-primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Create New App
        </button>
      </header>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app, i) => (
          <div key={i} className={`glass-card rounded-2xl overflow-hidden group transition-all duration-300 ${app.status !== 'active' ? 'opacity-80 hover:opacity-100' : ''}`}>
            <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${app.status === 'active' ? 'var(--vault-primary)' : 'gray'}33 0%, transparent 100%)` }}>
              <div className="absolute top-4 right-4 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest" style={{ 
                backgroundColor: app.status === 'active' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                color: app.status === 'active' ? '#34d399' : 'gray',
                borderColor: app.status === 'active' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.1)'
              }}>{app.status}</div>
              <div className="absolute -bottom-3 left-6 w-16 h-16 bg-[var(--vault-surface)] rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl text-[var(--vault-primary)] z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--vault-primary)]/10 to-transparent"></div>
                <span className="material-symbols-outlined text-3xl relative z-10">token</span>
              </div>
            </div>
            <div className="pt-8 px-6 pb-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-[var(--vault-on-surface)] group-hover:text-[var(--vault-primary)] transition-colors">{app.name}</h3>
                  <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] text-[var(--vault-on-surface-variant)] font-bold inline-block border border-white/5 mt-1">{app.version}</span>
                </div>
                <button className="text-[var(--vault-on-surface-variant)] hover:text-[var(--vault-on-surface)]">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[
                  { label: 'Users', val: app.total_users },
                  { label: 'Keys', val: app.total_keys },
                  { label: 'Today', val: app.logins_today, highlight: true },
                ].map((stat, j) => (
                  <div key={j} className="bg-white/[0.02] p-2 rounded-lg border border-white/5 text-center">
                    <p className="text-[10px] text-[var(--vault-on-surface-variant)] uppercase font-bold tracking-widest">{stat.label}</p>
                    <p className={`text-sm font-bold ${stat.highlight ? 'text-[var(--vault-primary)]' : 'text-[var(--vault-on-surface)]'}`}>{stat.val}</p>
                  </div>
                ))}
              </div>
              <div className="bg-black/20 border border-white/5 rounded-xl px-4 py-3 mb-6 flex justify-between items-center group/secret overflow-hidden">
                <code className="text-xs text-[var(--vault-on-surface-variant)] tracking-widest font-mono">
                  {visibleSecrets[app.id] ? app.app_secret : `APP_${"•".repeat(16)}`}
                </code>
                <div className="flex gap-2 opacity-0 group-hover/secret:opacity-100 transition-opacity">
                  <span 
                    onClick={() => toggleSecretVisibility(app.id)}
                    className="material-symbols-outlined text-sm cursor-pointer hover:text-[var(--vault-primary)]"
                  >
                    {visibleSecrets[app.id] ? 'visibility_off' : 'visibility'}
                  </span>
                  <span 
                    onClick={() => copyToClipboard(app.app_secret)}
                    className="material-symbols-outlined text-sm cursor-pointer hover:text-[var(--vault-primary)]"
                  >
                    content_copy
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                   onClick={() => router.push(`/applications/${app.id}`)}
                   className="flex-1 bg-white/5 hover:bg-[var(--vault-primary)]/20 text-[var(--vault-on-surface)] font-bold py-2.5 rounded-lg border border-white/5 transition-all text-xs uppercase tracking-widest"
                >Manage</button>
                <button 
                  onClick={() => handleDelete(app.id)}
                  className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-red-500/20 rounded-lg border border-white/5 transition-all"
                >
                  <span className="material-symbols-outlined text-xl text-red-400">delete</span>
                </button>
                {app.status === 'active' ? (
                  <button 
                    onClick={() => handleToggle(app.id)}
                    className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-amber-400/20 rounded-lg border border-white/5 transition-all"
                  >
                    <span className="material-symbols-outlined text-xl text-amber-400">pause</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => handleToggle(app.id)}
                    className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-emerald-400/20 rounded-lg border border-white/5 transition-all"
                  >
                    <span className="material-symbols-outlined text-xl text-emerald-400">play_arrow</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[var(--vault-surface)]/80 backdrop-blur-md transition-all duration-300">
          <div className="glass-card w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row scale-in-center max-h-[90vh]">
            {/* Left Side: Preview Area */}
            <div className="hidden md:flex w-[380px] bg-[var(--vault-primary)]/5 p-8 border-r border-white/5 flex-col justify-center items-center gap-8 shrink-0">
              <div className="text-center">
                <p className="text-[10px] font-bold text-[var(--vault-primary)] uppercase tracking-[0.2em] mb-2">Live Preview</p>
                <p className="text-[var(--vault-on-surface-variant)] text-[11px] font-medium max-w-[240px] mx-auto leading-relaxed">See how your application card will appear in the main dashboard.</p>
              </div>
              
              {/* Preview Card */}
              <div className="glass-card w-full p-6 rounded-2xl border-[var(--vault-primary)]/20 ring-4 ring-[var(--vault-primary)]/5 shadow-2xl scale-105 bg-[var(--vault-surface)]">
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-xl bg-[var(--vault-primary)]/20 flex items-center justify-center text-[var(--vault-primary)] shadow-lg shadow-[var(--vault-primary)]/10">
                    <span className="material-symbols-outlined text-[36px]">token</span>
                  </div>
                  <span className="bg-[var(--vault-primary)]/20 text-[var(--vault-primary)] px-4 py-1 rounded-full text-[10px] font-bold border border-[var(--vault-primary)]/30 uppercase tracking-widest text-center">Active</span>
                </div>
                <div className="mt-6">
                  <h3 className="text-xl font-bold text-[var(--vault-on-surface)]">New Application</h3>
                  <p className="text-[var(--vault-on-surface-variant)] text-xs mt-2 leading-relaxed line-clamp-2">Enter a description to see it appear here in the preview card...</p>
                </div>
                <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-[9px] text-[var(--vault-on-surface-variant)] uppercase tracking-tighter font-bold">Version</p>
                    <div className="text-xs text-[var(--vault-primary)] font-bold">V {formData.version}</div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-[var(--vault-on-surface-variant)] uppercase tracking-tighter font-bold">HWID Lock</p>
                    <div className={`text-xs font-bold ${formData.hwid_enabled ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formData.hwid_enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-[var(--vault-on-surface-variant)]/40">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span className="text-[10px] italic font-medium">Card styles update in real-time</span>
              </div>
            </div>

            {/* Right Side: Form Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[var(--vault-surface)]/40">
              {/* Header */}
              <div className="p-8 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--vault-on-surface)]">Create New Application</h2>
                  <p className="text-sm text-[var(--vault-on-surface-variant)] font-medium mt-1">Configure security parameters for your new deployment.</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-400/20 transition-colors text-[var(--vault-on-surface-variant)] hover:text-red-400">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Application Name</label>
                    <input 
                       className="glass-input w-full px-4 py-3 rounded-xl text-sm" 
                       placeholder="e.g. Identity Guard" type="text" 
                       value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Version (SemVer)</label>
                    <input 
                       className="glass-input w-full px-4 py-3 rounded-xl text-sm font-mono" 
                       placeholder="1.0.0" type="text" 
                       value={formData.version} onChange={(e) => setFormData({...formData, version: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Minimum Required Version</label>
                    <input 
                       className="glass-input w-full px-4 py-3 rounded-xl text-sm font-mono" 
                       placeholder="0.9.0" type="text" 
                       value={formData.min_version} onChange={(e) => setFormData({...formData, min_version: e.target.value})}
                    />
                  </div>

                {/* HWID Toggle */}
                <div 
                  onClick={() => setFormData({...formData, hwid_enabled: !formData.hwid_enabled})}
                  className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-[var(--vault-primary)]/10 flex items-center justify-center text-[var(--vault-primary)] shadow-inner">
                      <span className="material-symbols-outlined">devices</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--vault-on-surface)]">Hardware Lock (HWID)</h4>
                      <p className="text-[10px] text-[var(--vault-on-surface-variant)] font-bold uppercase tracking-widest leading-tight mt-1">Prevent credential sharing across devices.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer group" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={formData.hwid_enabled}
                      onChange={(e) => setFormData({...formData, hwid_enabled: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-14 h-7 bg-white/10 rounded-full peer peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--vault-primary)] shadow-inner ring-1 ring-white/5"></div>
                  </label>
                </div>
              </div>

              </div>

              {/* Actions */}
              <div className="p-8 pt-4 border-t border-white/5 flex justify-end items-center gap-4">
                <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl text-[var(--vault-on-surface-variant)] font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={creating || !formData.name}
                  className="bg-[var(--vault-primary)] px-8 py-3 rounded-xl text-[var(--vault-on-primary)] font-bold text-xs uppercase tracking-widest shadow-lg shadow-[var(--vault-primary)]/20 hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                  {creating ? 'Launching...' : 'Finalize & Launch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
