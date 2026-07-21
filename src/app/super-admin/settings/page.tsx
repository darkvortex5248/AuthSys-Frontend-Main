'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await adminApi.get<any[]>('/admin/settings');
      setSettings(res.data);
      const map: Record<string, string> = {};
      res.data.forEach((s: any) => {
        map[s.key] = s.value ?? '';
      });
      setForm(map);
    } catch (err) {
      toast.error('Failed to load settings');
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettingValue = async (key: string, value: string) => {
    try {
      await adminApi.put(`/admin/settings/${key}`, { value });
      await fetchSettings();
      toast.success('Setting updated');
    } catch (err) {
      toast.error('Failed to update setting');
      console.error("Failed to update setting", err);
    }
  };

  const toggleSetting = (key: string, currentValue: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    updateSettingValue(key, newValue);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
    </div>
  );

  const getVal = (key: string) => form[key] ?? settings.find((s) => s.key === key)?.value ?? '';

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveFields = async (keys: string[]) => {
    try {
      const payload: Record<string, string> = {};
      keys.forEach((k) => {
        payload[k] = getVal(k);
      });
      await adminApi.put('/admin/settings/bulk', { settings: payload });
      await fetchSettings();
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const runBootstrap = async () => {
    setSyncing(true);
    try {
      await adminApi.post('/admin/bootstrap');
      await fetchSettings();
      toast.success('Platform defaults synced');
    } catch {
      toast.error('Bootstrap failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">System Core Configuration</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Manage global platform behaviors and security flags</p>
        </div>
        <div className="flex gap-3 flex-wrap">
           <Link
             href="/super-admin/settings/payments"
             className="px-4 py-2 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-all flex items-center gap-2"
           >
             <span className="material-symbols-outlined text-sm">account_balance</span>
             Payment Methods
           </Link>
           <button 
             onClick={runBootstrap}
             disabled={syncing}
             className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-[var(--foreground)] hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
           >
             <span className="material-symbols-outlined text-sm">refresh</span>
             {syncing ? 'Syncing…' : 'Sync defaults'}
           </button>
           <div className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-xs font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
             Live Edge
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Controls */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-card rounded-xl p-8 border border-white/5 bg-gradient-to-br from-[#ffb786]/5 to-transparent">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#ffb786]">dns</span>
              Operational Mode
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest px-1">System State</label>
                <div className="relative group">
                  <select 
                    value={getVal('system_mode') || 'live'}
                    onChange={(e) => updateSettingValue('system_mode', e.target.value)}
                    className="w-full bg-[var(--card)]/80 border border-white/10 rounded-xl py-3.5 px-4 text-xs font-bold text-[var(--foreground)] appearance-none outline-none focus:ring-1 focus:ring-[#ffb786]/50 transition-all cursor-pointer group-hover:border-[#ffb786]/30"
                  >
                    <option value="live">🟢 OPERATIONAL (LIVE)</option>
                    <option value="maintenance">🟠 MAINTENANCE MODE</option>
                    <option value="update">🔵 SYSTEM UPDATE</option>
                    <option value="lockdown">🔴 SECURITY LOCKDOWN</option>
                    <option value="beta">🧪 BETA / EXPERIMENTAL</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#ffb786] text-lg">expand_more</span>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5">
                   <p className="text-[10px] text-[#ffb786] font-bold uppercase tracking-widest mb-1">Impact Analysis</p>
                   <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                    {getVal('system_mode') === 'maintenance' ? 'All public-facing API nodes and dashboards are locked for regular users.' : 
                     getVal('system_mode') === 'update' ? 'System is in read-only mode. New registrations and payments are paused.' :
                     getVal('system_mode') === 'lockdown' ? 'Critical emergency mode. Only authorized hardware signatures are allowed.' : 
                     getVal('system_mode') === 'beta' ? 'New features enabled. Monitoring for potential performance instability.' :
                     'Platform is operating at full capacity. All systems nominal.'}
                   </p>
                </div>
              </div>
              
              <div className="h-px bg-white/5 my-2"></div>
                 <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest px-1">Watch Demo URL</label>
                  <input 
                   id="input-watch_demo_url"
                   type="url" 
                   value={getVal('watch_demo_url')}
                   onChange={(e) => setField('watch_demo_url', e.target.value)}
                   className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-2.5 px-4 text-[var(--primary)] text-xs font-mono outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                   placeholder="https://youtube.com/..."
                  />
                  <button 
                    onClick={() => saveFields(['watch_demo_url'])}
                    className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest hover:bg-[var(--primary)]/10 transition-all"
                  >
                    Update Demo URL
                  </button>
              </div>
            </div>

          <div className="glass-card rounded-xl p-8 border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-[var(--primary)]">verified_user</span>
              Platform Identity
            </h3>
            <div className="space-y-4">
               {[
                 { key: 'platform_name', label: 'Platform Name', icon: 'label', placeholder: 'AuthSys' },
                 { key: 'platform_logo', label: 'Logo URL', icon: 'image', placeholder: '/logo.png' },
                 { key: 'platform_favicon', label: 'Favicon URL', icon: 'token', placeholder: '/favicon.ico' },
               ].map(field => (
                 <div key={field.key}>
                   <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-1.5 px-1">{field.label}</label>
                   <div className="relative group">
                     <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#525250] text-sm group-focus-within:text-[var(--primary)] transition-colors">{field.icon}</span>
                     <input 
                      id={`input-${field.key}`}
                      type="text" 
                      value={getVal(field.key)}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[var(--foreground)] text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                      placeholder={field.placeholder}
                     />
                   </div>
                 </div>
               ))}
               <button 
                onClick={() => saveFields(['platform_name', 'platform_logo', 'platform_favicon'])}
                className="w-full mt-2 py-3 rounded-xl bg-[var(--primary)] text-[#131313] font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[var(--primary)]/20"
               >
                 Save Identity Changes
               </button>
            </div>
          </div>

          <div className="glass-card rounded-xl p-8">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-[var(--primary)]">bolt</span>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={runBootstrap}
                className="w-full py-2.5 rounded-lg border border-white/5 hover:bg-white/5 text-xs text-[var(--muted-foreground)] font-bold uppercase transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">cleaning_services</span>
                Reset missing defaults
              </button>
              <button
                type="button"
                onClick={fetchSettings}
                className="w-full py-2.5 rounded-lg border border-white/5 hover:bg-white/5 text-xs text-[var(--muted-foreground)] font-bold uppercase transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">cached</span>
                Reload all settings
              </button>
            </div>
          </div>
        </div>

        {/* Support & Contact + Security */}
        <div className="lg:col-span-2 space-y-8">
           <div className="glass-card rounded-xl p-8 border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--primary)]">contact_support</span>
                Support & Contact
              </h3>
              <div className="space-y-4">
                 {[
                   { key: 'contact_email', label: 'Support Email', icon: 'mail', placeholder: 'support@authsys.com' },
                   { key: 'contact_phone', label: 'Support Phone', icon: 'call', placeholder: '+1 (800) 123-4567' },
                   { key: 'contact_address', label: 'Location', icon: 'location_on', placeholder: 'Silicon Valley, CA' },
                 ].map(field => (
                   <div key={field.key}>
                     <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-1.5 px-1">{field.label}</label>
                     <div className="relative group">
                       <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#525250] text-sm group-focus-within:text-[var(--primary)] transition-colors">{field.icon}</span>
                       <input 
                        id={`input-${field.key}`}
                        type="text" 
                        value={getVal(field.key)}
                      onChange={(e) => setField(field.key, e.target.value)}
                        className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[var(--foreground)] text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                        placeholder={field.placeholder}
                       />
                     </div>
                   </div>
                 ))}
                 <button 
                  onClick={() => saveFields(['contact_email', 'contact_phone', 'contact_address'])}
                  className="w-full mt-2 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--primary)] font-bold text-xs uppercase tracking-widest hover:bg-[var(--primary)] hover:text-[#131313] transition-all shadow-lg"
                 >
                   Save Contact Details
                 </button>
              </div>
           </div>

           <div className="glass-card rounded-xl p-8">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--primary)]">shield</span>
                Advanced Security
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'strict_hwid', name: 'Strict HWID Enforcement', desc: 'Lock sessions to hardware' },
                  { key: 'ip_risk_scoring', name: 'IP Risk Scoring', desc: 'Auto-ban high risk traffic' },
                  { key: 'developer_2fa', name: 'Developer 2FA', desc: 'Mandatory for all roots' },
                  { key: 'rate_limiting', name: 'System Rate Limiting', desc: 'Protect all API nodes' },
                ].map(item => {
                  const setting = settings.find(s => s.key === item.key);
                  const isActive = setting?.value === 'true';
                  return (
                    <div 
                     key={item.key} 
                     onClick={() => toggleSetting(item.key, setting?.value || 'false')}
                     className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[var(--foreground)]">{item.name}</p>
                        <p className="text-[10px] text-[var(--muted-foreground)] mt-1 uppercase tracking-widest">{item.desc}</p>
                      </div>
                      <span className={`material-symbols-outlined text-2xl transition-all ${isActive ? 'text-[var(--primary)]' : 'text-[#32353c]'}`}>
                        {isActive ? 'toggle_on' : 'toggle_off'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stripe Config */}
            <StripeConfigSection />
         </div>
       </div>
     </div>
   );
 }

 function StripeConfigSection() {
   const [status, setStatus] = useState<any>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
     adminApi.get('/admin/stripe-status')
       .then(res => setStatus(res.data))
       .catch(() => setStatus(null))
       .finally(() => setLoading(false));
   }, []);

   return (
     <div className="glass-card rounded-xl p-8 border border-white/5 bg-gradient-to-br from-[var(--primary)]/5 to-transparent">
       <h3 className="text-lg font-bold text-[var(--foreground)] mb-6 flex items-center gap-3">
         <span className="material-symbols-outlined text-[var(--primary)]">payments</span>
         Stripe International Payments
       </h3>

       {loading ? (
         <div className="flex justify-center py-6">
           <div className="w-6 h-6 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
         </div>
       ) : (
         <div className="space-y-4">
           <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
             <span className={`material-symbols-outlined text-2xl ${status?.configured ? 'text-green-500' : 'text-zinc-600'}`}>
               {status?.configured ? 'check_circle' : 'radio_button_unchecked'}
             </span>
             <div>
               <p className="text-sm font-bold text-[var(--foreground)]">{status?.configured ? 'Stripe Connected' : 'Not Configured'}</p>
               <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                 {status?.configured
                   ? `Key: ${status.publishable_key_preview}`
                   : 'Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY in .env'}
               </p>
             </div>
           </div>

           <div className="grid grid-cols-3 gap-3 text-center">
             {[
               { label: 'Secret Key', ok: status?.has_secret_key },
               { label: 'Publishable Key', ok: status?.has_publishable_key },
               { label: 'Webhook Secret', ok: status?.has_webhook_secret },
             ].map(item => (
               <div key={item.label} className="p-3 rounded-xl bg-white/5 border border-white/5">
                 <span className={`material-symbols-outlined text-lg ${item.ok ? 'text-green-500' : 'text-zinc-600'}`}>
                   {item.ok ? 'check' : 'close'}
                 </span>
                 <p className="text-[9px] text-[var(--muted-foreground)] mt-1 font-bold uppercase tracking-widest">{item.label}</p>
               </div>
             ))}
           </div>

           <div className="p-4 rounded-xl bg-[var(--background)] border border-white/5">
             <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-1">Webhook Endpoint</p>
             <code className="text-xs text-[var(--primary)] font-mono break-all">
               {typeof window !== 'undefined' ? `${window.location.origin}/api/v1/billing/stripe-webhook` : ''}
             </code>
           </div>

           <Link
             href="https://dashboard.stripe.com/apikeys"
             target="_blank"
             className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-[var(--primary)] hover:bg-white/10 transition-all"
           >
             <span className="material-symbols-outlined text-sm">open_in_new</span>
             Stripe Dashboard
           </Link>
         </div>
       )}
     </div>
   );
 }
