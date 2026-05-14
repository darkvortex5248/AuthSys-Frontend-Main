'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [visibleSecret, setVisibleSecret] = useState(false);

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const res = await api.get('/developer/apps');
        const found = res.data.find((a: any) => a.id === parseInt(id as string));
        if (found) {
          setApp(found);
        } else {
          alert("Application not found");
          router.push('/applications');
        }
      } catch (err) {
        console.error("Failed to fetch app details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [id, router]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-[var(--vault-primary)] font-bold uppercase tracking-widest">Loading Security Context...</div>;
  if (!app) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push('/applications')} className="text-[var(--vault-on-surface-variant)] hover:text-[var(--vault-primary)] flex items-center gap-2 mb-4 transition-colors group">
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Back to Overview</span>
          </button>
          <h1 className="text-4xl font-bold text-[var(--vault-on-surface)] flex items-center gap-4">
            {app.name}
            <span className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase tracking-tighter">
              {app.status}
            </span>
          </h1>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="glass-card rounded-3xl p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--vault-primary)]/5 blur-[100px] -z-10"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column: Core Info */}
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1 opacity-50">Application Identifier</label>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between group">
                <span className="font-mono text-sm text-[var(--vault-on-surface)]">{app.id}</span>
                <span className="text-[9px] font-bold text-[var(--vault-on-surface-variant)] uppercase bg-white/5 px-2 py-0.5 rounded">Primary Key</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1 opacity-50">Current Version</label>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                <span className="font-mono text-sm text-[var(--vault-primary)] font-bold">{app.version}</span>
                <span className="text-[9px] font-bold text-[var(--vault-on-surface-variant)] uppercase bg-white/5 px-2 py-0.5 rounded tracking-tighter">SemVer</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1 opacity-50">Hardware Lock (HWID)</label>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-widest ${app.hwid_enabled ? 'text-emerald-400' : 'text-red-400'}`}>
                  {app.hwid_enabled ? 'Enforced' : 'Disabled'}
                </span>
                <span className="material-symbols-outlined text-sm opacity-30">{app.hwid_enabled ? 'verified_user' : 'gpp_maybe'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Security Keys */}
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1 opacity-50">Owner ID</label>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between group">
                <span className="font-mono text-xs text-[var(--vault-on-surface)] truncate pr-4">{app.owner_id}</span>
                <button 
                  onClick={() => copyToClipboard(app.owner_id, "Owner ID")}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--vault-primary)]/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1 opacity-50">Application Secret Key</label>
              <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-4 overflow-hidden">
                  <code className="font-mono text-[11px] text-[var(--vault-primary)] truncate">
                    {visibleSecret ? app.app_secret : `APP_${"•".repeat(24)}`}
                  </code>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setVisibleSecret(!visibleSecret)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-[var(--vault-on-surface)] py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">{visibleSecret ? 'visibility_off' : 'visibility'}</span>
                    {visibleSecret ? 'Hide Key' : 'Reveal Key'}
                  </button>
                  <button 
                    onClick={() => copyToClipboard(app.app_secret, "Secret Key")}
                    className="flex-1 bg-[var(--vault-primary)] text-[var(--vault-on-primary)] py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--vault-primary)]/20"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    Copy Key
                  </button>
                </div>
              </div>
              <p className="text-[9px] text-amber-400/60 italic px-2 mt-2">Warning: Never share your Secret Key. Anyone with this key can bypass security protocols.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Security Section */}
      <div className="glass-card rounded-3xl p-10 border border-white/5 relative overflow-hidden">
        <div className="mb-10">
          <h3 className="text-2xl font-bold text-white mb-1">Infrastructure Security</h3>
          <p className="text-sm text-zinc-500">Orchestrate high-level security protocols and application availability.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { 
              id: 'hwid_enabled', 
              name: 'Hardware Lock (HWID)', 
              desc: 'Restrict access to authorized devices only.', 
              icon: 'devices',
              active: app.hwid_enabled,
              color: 'purple'
            },
            { 
              id: 'maintenance_mode', 
              name: 'Maintenance Mode', 
              desc: 'Temporarily disable access for system updates.', 
              icon: 'construction',
              active: app.maintenance_mode,
              color: 'amber'
            },
            { 
              id: 'developer_lock', 
              name: 'Emergency Lockdown', 
              desc: 'Instant freeze of all application endpoints.', 
              icon: 'emergency_home',
              active: app.developer_lock,
              color: 'red'
            },
          ].map((control) => (
            <div key={control.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col justify-between group hover:border-white/10 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-xl bg-${control.color}-500/10 flex items-center justify-center text-${control.color}-400 shadow-inner`}>
                  <span className="material-symbols-outlined">{control.icon}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={control.active}
                    onChange={async (e) => {
                      try {
                        const res = await api.put(`/developer/apps/${app.id}/update`, { [control.id]: e.target.checked });
                        setApp({ ...app, [control.id]: e.target.checked });
                      } catch (err) {
                        alert("Failed to update security parameter");
                      }
                    }}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500 shadow-inner"></div>
                </label>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">{control.name}</h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-tight">{control.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Guide Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer group">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 text-purple-400">
             <span className="material-symbols-outlined">menu_book</span>
          </div>
          <h4 className="text-sm font-bold mb-2">SDK Integration</h4>
          <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Download our C++, C#, or Python SDKs to get started with AuthSys in minutes.</p>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 text-blue-400">
             <span className="material-symbols-outlined">webhook</span>
          </div>
          <h4 className="text-sm font-bold mb-2">Webhooks</h4>
          <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Configure webhooks to receive real-time notifications for key events and user logins.</p>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 text-emerald-400">
             <span className="material-symbols-outlined">analytics</span>
          </div>
          <h4 className="text-sm font-bold mb-2">Advanced Metrics</h4>
          <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Detailed analytics for this specific application across all regions and versions.</p>
        </div>
      </div>
    </div>
  );
}
