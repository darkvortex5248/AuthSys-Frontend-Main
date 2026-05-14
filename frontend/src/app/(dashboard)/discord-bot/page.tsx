'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';

export default function DiscordBotPage() {
  const { selectedAppId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [token, setToken] = useState('');
  const [appId, setAppId] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [apps, setApps] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [botsRes, appsRes] = await Promise.all([
        api.get('/developer/bots'),
        api.get('/developer/apps')
      ]);
      setApps(appsRes.data);
      const discordBot = botsRes.data.find((b: any) => b.bot_type === 'discord' && b.app_id === selectedAppId);
      setConfig(discordBot);
      if (discordBot) {
        setToken(discordBot.bot_token);
        setAppId(discordBot.discord_app_id || '');
        setPublicKey(discordBot.discord_public_key || '');
      } else {
        setToken('');
        setAppId('');
        setPublicKey('');
      }
    } catch (err) {
      console.error("Failed to fetch bot config", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedAppId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) {
      toast.error("Please select an application first");
      return;
    }
    try {
      await api.post('/developer/bots/config', {
        app_id: selectedAppId,
        bot_type: 'discord',
        bot_token: token,
        discord_app_id: appId,
        discord_public_key: publicKey
      });
      toast.success("Discord Bot configured successfully!");
      fetchData();
    } catch (err) {
      toast.error("Failed to save bot configuration");
    }
  };

  const interactionsUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/v1/bots/discord/interactions` 
    : '';

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--vault-primary)]"></div>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-bold text-white tracking-tight">Discord Integration</h2>
        <nav className="flex items-center gap-2 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest mt-2">
          <span>Enterprise</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[var(--vault-primary)]">Automation Bots</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#5865F2]/10 blur-[100px] rounded-full"></div>
             
             <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#5865F2]/20 flex items-center justify-center">
                   <svg className="w-8 h-8 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                   </svg>
                </div>
                <div>
                   <h3 className="text-xl font-bold text-white">Bot Configuration</h3>
                   <p className="text-xs text-[var(--vault-on-surface-variant)] uppercase tracking-widest font-bold">Manage {selectedAppId ? apps.find(a => a.id === selectedAppId)?.name : 'Application'}</p>
                </div>
             </div>

             <form onSubmit={handleSave} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-[var(--vault-on-surface-variant)] font-bold uppercase tracking-widest ml-1 block">Application ID</label>
                    <input 
                      type="text"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      placeholder="1234567890..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#5865F2]/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-[var(--vault-on-surface-variant)] font-bold uppercase tracking-widest ml-1 block">Public Key</label>
                    <input 
                      type="text"
                      value={publicKey}
                      onChange={(e) => setPublicKey(e.target.value)}
                      placeholder="ed25519_public_key..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#5865F2]/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-[var(--vault-on-surface-variant)] font-bold uppercase tracking-widest ml-1 block">Bot Token</label>
                  <div className="relative group">
                    <input 
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="MTIzNDU2Nzg5MDEyMzQ1Njc4.Xyz..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#5865F2]/50 transition-all"
                    />
                  </div>
                </div>

                {config && (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-2">
                    <label className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-widest ml-1 block">Interactions Endpoint URL</label>
                    <div className="flex gap-2">
                      <input 
                        readOnly
                        value={interactionsUrl}
                        className="flex-1 bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-[11px] font-mono text-emerald-400 focus:outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(interactionsUrl);
                          toast.success("URL copied to clipboard!");
                        }}
                        className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                      </button>
                    </div>
                    <p className="text-[9px] text-emerald-400/50 italic ml-1">Paste this URL into Discord Developer Portal &gt; General Information &gt; Interactions Endpoint URL</p>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4">
                  <button 
                    type="submit"
                    className="px-8 py-4 bg-[#5865F2] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#5865F2]/20 active:scale-[0.95] hover:shadow-[#5865F2]/40 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">save</span>
                    Save Configuration
                  </button>
                  {config && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                       <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
                    </div>
                  )}
                </div>
             </form>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] border border-white/5">
             <h4 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Bot Commands Help</h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { cmd: '/usercreate', desc: 'Create a new end user' },
                  { cmd: '/genkey', desc: 'Generate a license key' },
                  { cmd: '/ban', desc: 'Ban a user or HWID' },
                  { cmd: '/stats', desc: 'View app analytics' },
                ].map(c => (
                  <div key={c.cmd} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                    <p className="text-[var(--vault-primary)] font-mono text-sm font-bold">{c.cmd}</p>
                    <p className="text-[10px] text-[var(--vault-on-surface-variant)] mt-1">{c.desc}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-[#5865F2]/10 to-transparent">
              <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-widest">Setup Guide</h4>
              <ul className="space-y-4">
                {[
                  { step: 1, text: 'Go to Discord Developer Portal' },
                  { step: 2, text: 'Create a new Application & Bot' },
                  { step: 3, text: 'Enable all Privileged Gateway Intents' },
                  { step: 4, text: 'Copy the Token and paste it here' },
                ].map(s => (
                  <li key={s.step} className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0">{s.step}</span>
                    <span className="text-xs text-[var(--vault-on-surface-variant)] leading-tight">{s.text}</span>
                  </li>
                ))}
              </ul>
           </div>

           <div className="glass-card p-6 rounded-[2rem] border border-white/5">
              <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-widest">Status</h4>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--vault-on-surface-variant)]">Gateway Connection</span>
                    <span className={config ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{config ? 'CONNECTED' : 'DISCONNECTED'}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--vault-on-surface-variant)]">Command Sync</span>
                    <span className={config ? 'text-emerald-400 font-bold' : 'text-white/20 font-bold'}>{config ? 'SYNCHRONIZED' : 'PENDING'}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
