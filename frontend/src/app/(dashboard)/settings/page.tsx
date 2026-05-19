'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useDeveloperMe } from '@/hooks/use-developer-queries';
import { tierDisplayName } from '@/lib/plan-access';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { data: profile, refetch: refreshSubscription, isFetching } = useDeveloperMe(true);
  const activeUser = profile ?? user;
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({ username: '', email: '' });
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (profile) setUser(profile);
  }, [profile, setUser]);

  useEffect(() => {
    if (activeUser) {
      setProfileData({ username: activeUser.username, email: activeUser.email });
    }
  }, [activeUser]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/developer/auth/me', { username: profileData.username });
      setUser(res.data);
      showMessage('success', "Profile updated successfully");
    } catch (err: any) {
      showMessage('error', err.response?.data?.detail || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/developer/auth/change-password', passwordData);
      setPasswordData({ old_password: '', new_password: '' });
      showMessage('success', "Password changed successfully");
    } catch (err: any) {
      showMessage('error', err.response?.data?.detail || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'General Profile', icon: 'person' },
    { id: 'security', name: 'Security & Access', icon: 'security' },
    { id: 'subscription', name: 'Plan & Billing', icon: 'payments' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10">
        <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Account <span className="text-gradient">Settings</span></h2>
        <p className="text-zinc-500 font-medium">Manage your identity, security protocols, and subscription tier.</p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-[#d97757]/10 text-[#d97757] border border-[#d97757]/20 font-bold' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              <span className="text-sm">{tab.name}</span>
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <section className="glass-card rounded-[24px] p-8 md:p-10 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <span className="material-symbols-outlined text-[120px]">account_circle</span>
              </div>
              
              <div className="relative z-10">
                <div className="mb-10">
                  <h3 className="text-2xl font-bold text-white mb-1">Identity Gateway</h3>
                  <p className="text-sm text-zinc-500">Your public profile information within the AuthSys network.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-8 max-w-2xl">
                  <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#d97757] to-blue-600 p-[1px] shadow-2xl">
                      <div className="w-full h-full bg-[#0a0a0f] rounded-[23px] flex items-center justify-center font-black text-3xl text-white uppercase tracking-tighter">
                        {profileData.username.substring(0, 2)}
                      </div>
                    </div>
                    <div className="text-center sm:text-left">
                       <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Current Tier</p>
                       <span className="px-3 py-1 rounded-full bg-[#d97757]/10 text-[#d97757] border border-[#d97757]/20 text-[10px] font-black uppercase tracking-widest">
                          {tierDisplayName(activeUser?.subscription_tier, activeUser?.plan?.name)}
                       </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1 group-focus-within:text-[#d97757] transition-colors">Developer Alias</label>
                      <input 
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-800 focus:border-[#d97757]/50 focus:bg-white/[0.04] outline-none transition-all text-sm"
                        type="text" 
                        value={profileData.username} 
                        onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Registered Email</label>
                      <input className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-zinc-600 text-sm cursor-not-allowed" type="email" value={profileData.email} disabled />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="bg-gradient-to-r from-[#d97757] to-blue-600 text-white px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[#d97757]/20 hover:shadow-[#d97757]/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {loading ? 'Propagating Changes...' : 'Synchronize Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {activeTab === 'security' && (
            <section className="glass-card rounded-[24px] p-8 md:p-10 border border-white/5 relative overflow-hidden">
              <div className="mb-10">
                <h3 className="text-2xl font-bold text-white mb-1">Access Credentials</h3>
                <p className="text-sm text-zinc-500">Update your security passkey and manage multi-factor authentication.</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1 group-focus-within:text-[#d97757] transition-colors">Current Passkey</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 text-lg">lock</span>
                    <input 
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-zinc-800 focus:border-[#d97757]/50 focus:bg-white/[0.04] outline-none transition-all text-sm"
                      type="password" required
                      value={passwordData.old_password}
                      onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1 group-focus-within:text-[#d97757] transition-colors">New Passkey</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 text-lg">key_visualizer</span>
                    <input 
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-zinc-800 focus:border-[#d97757]/50 focus:bg-white/[0.04] outline-none transition-all text-sm"
                      type="password" required
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all active:scale-[0.99]"
                >
                  {loading ? 'Processing...' : 'Rotate Passkey'}
                </button>
              </form>
            </section>
          )}

          {activeTab === 'subscription' && (
            <section className="glass-card rounded-[24px] p-8 md:p-10 border border-white/5 relative overflow-hidden">
               <div className="mb-10 flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Infrastructure Tier</h3>
                  <p className="text-sm text-zinc-500">Overview of your current resource limits and active capabilities.</p>
                </div>
                <span className="px-4 py-2 rounded-xl bg-[#d97757] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#d97757]/20">
                   {activeUser?.plan?.name || tierDisplayName(activeUser?.subscription_tier)} Plan
                </span>
                <button
                  type="button"
                  onClick={() => refreshSubscription()}
                  disabled={isFetching}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-[#d97757] hover:bg-[#d97757]/10 disabled:opacity-50"
                >
                  {isFetching ? 'Syncing…' : 'Refresh plan'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                 {[
                   { label: 'Max Applications', value: activeUser?.plan?.max_apps ?? 5, icon: 'apps' },
                   { label: 'Max License Keys', value: (activeUser?.plan?.max_keys_per_month === 0 || activeUser?.plan?.max_keys_per_month === -1) ? 'Unlimited' : (activeUser?.plan?.max_keys_per_month ?? 100), icon: 'vpn_key' },
                   { label: 'Max Users', value: (activeUser?.plan?.max_users_per_app === 0 || activeUser?.plan?.max_users_per_app === -1) ? 'Unlimited' : (activeUser?.plan?.max_users_per_app ?? 500), icon: 'group' },
                 ].map((stat, i) => (
                   <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-[#d97757] text-xl">{stat.icon}</span>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                      </div>
                      <p className="text-3xl font-black text-white">{stat.value}</p>
                   </div>
                 ))}
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Active Capabilities</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {Array.isArray(activeUser?.plan?.features_json) && activeUser.plan.features_json.map((feature: string, i: number) => (
                     <div key={feature} className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                        <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                        <span className="text-xs font-bold text-emerald-400/90">{feature}</span>
                     </div>
                   ))}
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                 <div>
                   <p className="text-sm font-bold text-white">Need higher throughput?</p>
                   <p className="text-xs text-zinc-500">Upgrade to an enterprise-grade tier for unlimited orchestration.</p>
                 </div>
                 <button onClick={() => setActiveTab('billing')} className="px-8 py-3 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all">
                    Upgrade Infrastructure
                 </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
