'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';

export default function TelegramBotPage() {
  const { selectedAppId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [token, setToken] = useState('');
  const [apps, setApps] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [botsRes, appsRes] = await Promise.all([
        api.get('/developer/bots'),
        api.get('/developer/apps')
      ]);
      setApps(appsRes.data);
      const telegramBot = botsRes.data.find((b: any) => b.bot_type === 'telegram' && b.app_id === selectedAppId);
      setConfig(telegramBot);
      if (telegramBot) setToken(telegramBot.bot_token);
      else setToken('');
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
        bot_type: 'telegram',
        bot_token: token
      });
      toast.success("Telegram Bot configured successfully!");
      fetchData();
    } catch (err) {
      toast.error("Failed to save bot configuration");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--vault-primary)]"></div>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-bold text-white tracking-tight">Telegram Integration</h2>
        <nav className="flex items-center gap-2 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest mt-2">
          <span>Enterprise</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[var(--vault-primary)]">Automation Bots</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#0088cc]/10 blur-[100px] rounded-full"></div>
             
             <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#0088cc]/20 flex items-center justify-center">
                   <svg className="w-8 h-8 text-[#0088cc]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.08-.66.02-.18.27-.36.74-.55 2.89-1.26 4.82-2.09 5.79-2.5 2.75-1.15 3.32-1.35 3.7-.1.08.21.05.47.05.74z"/>
                   </svg>
                </div>
                <div>
                   <h3 className="text-xl font-bold text-white">Bot Configuration</h3>
                   <p className="text-xs text-[var(--vault-on-surface-variant)] uppercase tracking-widest font-bold">Manage {selectedAppId ? apps.find(a => a.id === selectedAppId)?.name : 'Application'}</p>
                </div>
             </div>

             <form onSubmit={handleSave} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] text-[var(--vault-on-surface-variant)] font-bold uppercase tracking-widest ml-1 block">Telegram Bot Token</label>
                  <div className="relative group">
                    <input 
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="123456789:AAHe8..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#0088cc]/50 transition-all placeholder:text-white/10"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-[#0088cc]/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"></div>
                  </div>
                  <p className="text-[9px] text-white/30 italic ml-1 mt-2">Obtain your token from @BotFather on Telegram.</p>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button 
                    type="submit"
                    className="px-8 py-4 bg-[#0088cc] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#0088cc]/20 active:scale-[0.95] hover:shadow-[#0088cc]/40 transition-all flex items-center gap-2"
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
           <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-[#0088cc]/10 to-transparent">
              <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-widest">Setup Guide</h4>
              <ul className="space-y-4">
                {[
                  { step: 1, text: 'Search for @BotFather on Telegram' },
                  { step: 2, text: 'Send /newbot and follow instructions' },
                  { step: 3, text: 'Copy the API Token' },
                  { step: 4, text: 'Paste the token here and Save' },
                ].map(s => (
                  <li key={s.step} className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0">{s.step}</span>
                    <span className="text-xs text-[var(--vault-on-surface-variant)] leading-tight">{s.text}</span>
                  </li>
                ))}
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
