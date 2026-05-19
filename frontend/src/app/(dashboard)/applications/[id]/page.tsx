'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-developer-queries';
import { useCopy } from '@/components/ui/copy-dialog';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const appId = parseInt(id as string, 10);
  const { app, isLoading } = useApp(Number.isNaN(appId) ? null : appId);
  const copy = useCopy();
  const [visibleSecret, setVisibleSecret] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    copy(text, { label: `${label} copied` });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="glass-card rounded-3xl h-96 bg-white/[0.02]" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-10 text-center">
        <p className="text-[var(--vault-on-surface-variant)] mb-4">Application not found</p>
        <button
          onClick={() => router.push('/applications')}
          className="text-[var(--vault-primary)] font-bold uppercase tracking-widest text-xs"
        >
          Back to Applications
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
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

      <div className="glass-card rounded-3xl p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--vault-primary)]/5 blur-[100px] -z-10"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
              <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1 opacity-50">Owner ID</label>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between group">
                <span className="font-mono text-sm text-[var(--vault-on-surface)] truncate mr-4">{app.owner_id}</span>
                <button
                  onClick={() => copyToClipboard(app.owner_id, 'Owner ID')}
                  className="material-symbols-outlined text-sm cursor-pointer hover:text-[var(--vault-primary)] opacity-50 group-hover:opacity-100 transition-all"
                >
                  content_copy
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1 opacity-50">Application Secret Key</label>
              <div className="bg-black/40 border border-[var(--vault-primary)]/20 rounded-2xl p-5 flex items-center justify-between group">
                <code className="font-mono text-xs text-[var(--vault-primary)] tracking-widest truncate mr-4">
                  {visibleSecret ? app.app_secret : `APP_${"•".repeat(24)}`}
                </code>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setVisibleSecret(!visibleSecret)}
                    className="material-symbols-outlined text-sm cursor-pointer hover:text-[var(--vault-primary)] opacity-50 group-hover:opacity-100 transition-all"
                  >
                    {visibleSecret ? 'visibility_off' : 'visibility'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(app.app_secret, 'Secret Key')}
                    className="material-symbols-outlined text-sm cursor-pointer hover:text-[var(--vault-primary)] opacity-50 group-hover:opacity-100 transition-all"
                  >
                    content_copy
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Users', val: app.total_users ?? 0 },
                { label: 'Keys', val: app.total_keys ?? 0 },
                { label: 'Logins Today', val: app.logins_today ?? 0 },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/[0.02] p-4 rounded-xl border border-white/5 text-center">
                  <p className="text-[10px] text-[var(--vault-on-surface-variant)] uppercase font-bold tracking-widest">{stat.label}</p>
                  <p className="text-lg font-bold text-[var(--vault-on-surface)]">{stat.val}</p>
                </div>
              ))}
            </div>

            <div className="p-6 bg-[var(--vault-primary)]/5 border border-[var(--vault-primary)]/10 rounded-2xl">
              <h3 className="text-xs font-bold text-[var(--vault-primary)] uppercase tracking-widest mb-3">C# SDK Setup</h3>
              <pre className="text-[10px] text-[var(--vault-on-surface-variant)] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`auth = new AuthSys(
    "${app.app_secret}",
    "${app.owner_id}",
    "${app.version}",
    "https://authsys-vtdu.onrender.com/api/v1"
);`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
