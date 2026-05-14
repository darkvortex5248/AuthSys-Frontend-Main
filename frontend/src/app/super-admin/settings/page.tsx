'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await api.get('/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(res.data);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettingValue = async (key: string, value: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      await api.put(`/admin/settings/${key}`, { value }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSettings();
    } catch (err) {
      console.error("Failed to update setting", err);
    }
  };

  const toggleSetting = (key: string, currentValue: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    updateSettingValue(key, newValue);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#adc6ff]/20 border-t-[#adc6ff] rounded-full animate-spin"></div>
    </div>
  );

  const getVal = (key: string) => settings.find(s => s.key === key)?.value || '';

  return (
    <div className="space-y-10 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e1e2ec] tracking-tight">System Core Configuration</h1>
          <p className="text-[#8c909f] mt-1">Manage global platform behaviors and security flags</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={fetchSettings}
             className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-[#e1e2ec] hover:bg-white/10 transition-all flex items-center gap-2"
           >
             <span className="material-symbols-outlined text-sm">refresh</span>
             Sync State
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
            <h3 className="text-lg font-bold text-[#e1e2ec] mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#ffb786]">dns</span>
              Operational Mode
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-[#8c909f] uppercase tracking-widest px-1">System State</label>
                <div className="relative group">
                  <select 
                    value={getVal('system_mode') || 'live'}
                    onChange={(e) => updateSettingValue('system_mode', e.target.value)}
                    className="w-full bg-[#0b0e15]/80 border border-white/10 rounded-xl py-3.5 px-4 text-xs font-bold text-[#e1e2ec] appearance-none outline-none focus:ring-1 focus:ring-[#ffb786]/50 transition-all cursor-pointer group-hover:border-[#ffb786]/30"
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
                   <p className="text-[11px] text-[#8c909f] leading-relaxed">
                    {getVal('system_mode') === 'maintenance' ? 'All public-facing API nodes and dashboards are locked for regular users.' : 
                     getVal('system_mode') === 'update' ? 'System is in read-only mode. New registrations and payments are paused.' :
                     getVal('system_mode') === 'lockdown' ? 'Critical emergency mode. Only authorized hardware signatures are allowed.' : 
                     getVal('system_mode') === 'beta' ? 'New features enabled. Monitoring for potential performance instability.' :
                     'Platform is operating at full capacity. All systems nominal.'}
                   </p>
                </div>
              </div>
              
              <div className="h-px bg-white/5 my-2"></div>
                 <label className="block text-[10px] font-bold text-[#8c909f] uppercase tracking-widest px-1">Watch Demo URL</label>
                  <input 
                   id="input-watch_demo_url"
                   type="url" 
                   defaultValue={getVal('watch_demo_url')}
                   className="w-full bg-[#0b0e15]/50 border border-white/10 rounded-xl py-2.5 px-4 text-[#adc6ff] text-xs font-mono outline-none focus:ring-1 focus:ring-[#adc6ff]/50"
                   placeholder="https://youtube.com/..."
                  />
                  <button 
                    onClick={() => {
                      const el = document.getElementById('input-watch_demo_url') as HTMLInputElement;
                      if (el) updateSettingValue('watch_demo_url', el.value);
                    }}
                    className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-[#adc6ff] uppercase tracking-widest hover:bg-[#adc6ff]/10 transition-all"
                  >
                    Update Demo URL
                  </button>
              </div>
            </div>

          <div className="glass-card rounded-xl p-8 border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
            <h3 className="text-lg font-bold text-[#e1e2ec] mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#adc6ff]">verified_user</span>
              Platform Identity
            </h3>
            <div className="space-y-4">
               {[
                 { key: 'platform_name', label: 'Platform Name', icon: 'label', placeholder: 'AuthSys' },
                 { key: 'platform_logo', label: 'Logo URL', icon: 'image', placeholder: '/logo.png' },
                 { key: 'platform_favicon', label: 'Favicon URL', icon: 'token', placeholder: '/favicon.ico' },
               ].map(field => (
                 <div key={field.key}>
                   <label className="block text-[10px] font-bold text-[#8c909f] uppercase tracking-widest mb-1.5 px-1">{field.label}</label>
                   <div className="relative group">
                     <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#424754] text-sm group-focus-within:text-[#adc6ff] transition-colors">{field.icon}</span>
                     <input 
                      id={`input-${field.key}`}
                      type="text" 
                      defaultValue={getVal(field.key)}
                      className="w-full bg-[#0b0e15]/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[#e1e2ec] text-xs outline-none focus:ring-1 focus:ring-[#adc6ff]/50"
                      placeholder={field.placeholder}
                     />
                   </div>
                 </div>
               ))}
               <button 
                onClick={() => {
                  ['platform_name', 'platform_logo', 'platform_favicon'].forEach(k => {
                    const el = document.getElementById(`input-${k}`) as HTMLInputElement;
                    if (el) updateSettingValue(k, el.value);
                  });
                  alert("Platform identity updated!");
                }}
                className="w-full mt-2 py-3 rounded-xl bg-[#adc6ff] text-[#0b0e15] font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#adc6ff]/20"
               >
                 Save Identity Changes
               </button>
            </div>
          </div>

          <div className="glass-card rounded-xl p-8">
            <h3 className="text-lg font-bold text-[#e1e2ec] mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#adc6ff]">bolt</span>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full py-2.5 rounded-lg border border-white/5 hover:bg-white/5 text-xs text-[#8c909f] font-bold uppercase transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">cleaning_services</span>
                Clear System Logs
              </button>
              <button className="w-full py-2.5 rounded-lg border border-white/5 hover:bg-white/5 text-xs text-[#8c909f] font-bold uppercase transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">cached</span>
                Flush Global Cache
              </button>
            </div>
          </div>
        </div>

        {/* Branding & Content */}
        <div className="lg:col-span-2 space-y-8">
           <div className="glass-card rounded-xl p-8">
              <h3 className="text-lg font-bold text-[#e1e2ec] mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#adc6ff]">description</span>
                Landing Content
              </h3>
              <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-bold text-[#8c909f] uppercase tracking-widest mb-2 px-1">Hero / Docs Paragraph</label>
                    <textarea 
                      id="input-landing_paragraph"
                      defaultValue={getVal('landing_paragraph')}
                      className="w-full bg-[#0b0e15]/50 border border-white/10 rounded-xl p-4 text-sm text-[#e1e2ec] focus:ring-2 focus:ring-[#adc6ff]/50 h-32 resize-none outline-none leading-relaxed"
                      placeholder="The modern standard for software authentication..."
                    ></textarea>
                 </div>
                 
                 <button 
                   onClick={() => {
                     const el = document.getElementById('input-landing_paragraph') as HTMLTextAreaElement;
                     if (el) updateSettingValue('landing_paragraph', el.value);
                     alert("Landing content updated!");
                   }}
                   className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[#adc6ff] font-bold text-xs uppercase tracking-widest hover:bg-[#adc6ff] hover:text-[#0b0e15] transition-all shadow-lg"
                 >
                   Save Content Changes
                 </button>

                 <div className="p-4 rounded-xl bg-[#adc6ff]/5 border border-[#adc6ff]/10">
                    <p className="text-[10px] font-bold text-[#adc6ff] uppercase tracking-widest mb-2">Live Preview Hook</p>
                    <p className="text-sm text-[#8c909f] italic">"{getVal('landing_paragraph')}"</p>
                 </div>
              </div>
           </div>

           <div className="glass-card rounded-xl p-8 border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
              <h3 className="text-lg font-bold text-[#e1e2ec] mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#adc6ff]">contact_support</span>
                Support & Contact
              </h3>
              <div className="space-y-4">
                 {[
                   { key: 'contact_email', label: 'Support Email', icon: 'mail', placeholder: 'support@authsys.com' },
                   { key: 'contact_phone', label: 'Support Phone', icon: 'call', placeholder: '+1 (800) 123-4567' },
                   { key: 'contact_address', label: 'Location', icon: 'location_on', placeholder: 'Silicon Valley, CA' },
                 ].map(field => (
                   <div key={field.key}>
                     <label className="block text-[10px] font-bold text-[#8c909f] uppercase tracking-widest mb-1.5 px-1">{field.label}</label>
                     <div className="relative group">
                       <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#424754] text-sm group-focus-within:text-[#adc6ff] transition-colors">{field.icon}</span>
                       <input 
                        id={`input-${field.key}`}
                        type="text" 
                        defaultValue={getVal(field.key)}
                        className="w-full bg-[#0b0e15]/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[#e1e2ec] text-xs outline-none focus:ring-1 focus:ring-[#adc6ff]/50"
                        placeholder={field.placeholder}
                       />
                     </div>
                   </div>
                 ))}
                 <button 
                  onClick={() => {
                    ['contact_email', 'contact_phone', 'contact_address'].forEach(k => {
                      const el = document.getElementById(`input-${k}`) as HTMLInputElement;
                      if (el) updateSettingValue(k, el.value);
                    });
                    alert("Contact information updated!");
                  }}
                  className="w-full mt-2 py-3 rounded-xl bg-white/5 border border-white/10 text-[#adc6ff] font-bold text-xs uppercase tracking-widest hover:bg-[#adc6ff] hover:text-[#0b0e15] transition-all shadow-lg"
                 >
                   Save Contact Details
                 </button>
              </div>
           </div>

           <div className="glass-card rounded-xl p-8">
             <h3 className="text-lg font-bold text-[#e1e2ec] mb-6 flex items-center gap-3">
               <span className="material-symbols-outlined text-[#adc6ff]">shield</span>
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
                       <p className="text-sm font-bold text-[#e1e2ec]">{item.name}</p>
                       <p className="text-[10px] text-[#8c909f] mt-1 uppercase tracking-widest">{item.desc}</p>
                     </div>
                     <span className={`material-symbols-outlined text-2xl transition-all ${isActive ? 'text-[#adc6ff]' : 'text-[#32353c]'}`}>
                       {isActive ? 'toggle_on' : 'toggle_off'}
                     </span>
                   </div>
                 );
               })}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
