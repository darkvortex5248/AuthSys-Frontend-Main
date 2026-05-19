'use client';
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import dynamic from 'next/dynamic';
import { useApps, useDeveloperMe } from '@/hooks/use-developer-queries';
import { canAccessNav, tierDisplayName, getTierLevel } from '@/lib/plan-access';
const AIChatWidget = dynamic(() => import('@/components/dashboard/AIChatWidget'), { ssr: false });
import { useSession, signOut } from 'next-auth/react';

const navItems = [
  { name: 'Overview', icon: 'dashboard', href: '/dashboard', tier: 'tester' },
  { name: 'Applications', icon: 'apps', href: '/applications', tier: 'tester' },
  { name: 'License Keys', icon: 'vpn_key', href: '/license-keys', tier: 'tester' },
  { name: 'Users', icon: 'group', href: '/users', tier: 'tester' },
  { name: 'Analytics', icon: 'insights', href: '/analytics', tier: 'tester' },
  { name: 'Blacklist', icon: 'block', href: '/blacklist', tier: 'tester' },
  { name: 'Variables', icon: 'code', href: '/variables', tier: 'tester' },
  
  // Developer Tier Features
  { name: 'Team Management', icon: 'groups', href: '/team', tier: 'developer' },
  { name: 'Customer Panel', icon: 'person_search', href: '/customer-panel', tier: 'developer' },
  { name: 'Functions', icon: 'settings_suggest', href: '/functions', tier: 'developer' },
  
  // Seller Tier Features
  { name: 'Chatrooms', icon: 'forum', href: '/chatrooms', tier: 'seller' },
  { name: 'Discord Bot', icon: 'smart_toy', href: '/discord-bot', tier: 'seller' },
  { name: 'Telegram Bot', icon: 'send', href: '/telegram-bot', tier: 'seller' },
  { name: 'Seller API', icon: 'api', href: '/seller-api', tier: 'seller' },

  { name: 'Billing', icon: 'payments', href: '/billing', tier: 'tester' },
  { name: 'Audit Logs', icon: 'history', href: '/audit-logs', tier: 'tester' },
  { name: 'Settings', icon: 'settings', href: '/settings', tier: 'tester' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { user, setUser, selectedAppId, setSelectedAppId, logout, token, setToken } = useAuthStore();
  const hasToken = Boolean(token);
  const { data: apps = [] } = useApps(hasToken);
  const { data: profile, refetch: refetchProfile, isFetching: profileFetching } = useDeveloperMe(hasToken);
  const activeUser = profile ?? user;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isLoggingOut) return;

    if (sessionStatus === 'authenticated' && (session as any)?.backendToken) {
      const backendToken = (session as any).backendToken as string;
      if (token !== backendToken) {
        setToken(backendToken);
      }
    }

    if (profile) {
      const planChanged =
        user?.subscription_tier !== profile.subscription_tier ||
        user?.plan?.id !== profile.plan?.id;
      if (!user || user.id !== profile.id || planChanged) {
        setUser(profile);
      }
    }
  }, [sessionStatus, session, token, setToken, profile, setUser, user, isLoggingOut]);

  useEffect(() => {
    if (!mounted || isLoggingOut) return;
    if (sessionStatus === 'loading') return;
    const hasBackendSession =
      sessionStatus === 'authenticated' && Boolean((session as any)?.backendToken);
    if (!token && !hasBackendSession) {
      router.replace('/login');
    }
  }, [mounted, token, sessionStatus, session, router, isLoggingOut]);

  useEffect(() => {
    if (apps.length === 0) return;
    const valid = selectedAppId && apps.some((a) => a.id === selectedAppId);
    if (!valid) {
      setSelectedAppId(apps[0].id);
    }
  }, [apps, selectedAppId, setSelectedAppId]);

  useEffect(() => {
    if (!hasToken) return;
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 1) {
        api.get(`/developer/analytics/search?q=${searchQuery}`).then(res => {
          setSearchResults(res.data);
          setShowSearch(true);
        });
      } else {
        setShowSearch(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, hasToken]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    logout();
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="font-body-md text-[var(--vault-on-surface)] selection:bg-[var(--vault-primary)]/30 min-h-screen bg-[var(--vault-background)]">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--vault-primary)]/10 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--vault-secondary)]/10 blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed left-0 top-0 h-full w-[260px] border-r border-white/5 bg-[var(--vault-surface)]/80 lg:bg-[var(--vault-surface)]/30 backdrop-blur-xl flex flex-col py-8 shadow-2xl z-[60] transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-6 mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[var(--vault-primary)] tracking-tight">AuthSys</h1>
            <p className="text-[10px] text-[var(--vault-on-surface-variant)] uppercase tracking-widest mt-1 opacity-70">Enterprise Security</p>
          </div>
          <button 
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/5"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
        
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {mounted && navItems.filter((item) => {
            const userTier = activeUser?.subscription_tier || activeUser?.plan?.name || 'tester';
            const planFeatures = Array.isArray(activeUser?.plan?.features_json)
              ? (activeUser.plan.features_json as string[]).map((f) => f?.toString())
              : [];
            return canAccessNav(
              item.tier as 'tester' | 'developer' | 'seller',
              userTier,
              planFeatures,
              item.name,
            );
          }).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  isActive 
                    ? 'text-[var(--vault-primary)] font-bold border-l-2 border-[var(--vault-primary)] bg-[var(--vault-primary)]/5 active-nav-glow' 
                    : 'text-[var(--vault-on-surface-variant)] hover:text-[var(--vault-on-surface)] hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 mt-auto space-y-1">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-all"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-260px)] h-16 bg-[var(--vault-surface)]/30 backdrop-blur-md border-b border-white/5 flex justify-between items-center px-4 lg:px-8 z-40">
        <div className="flex items-center gap-4">
          <button 
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          
          <div className="relative hidden sm:block">
             <select 
              value={selectedAppId || ''} 
              onChange={(e) => setSelectedAppId(parseInt(e.target.value))}
              className="appearance-none bg-transparent border border-white/20 rounded-xl px-4 py-2 pr-10 text-xs font-bold uppercase tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-[var(--vault-primary)]/50 transition-all cursor-pointer"
             >
               <option value="" disabled>Select Application</option>
               {apps.map(app => (
                 <option key={app.id} value={app.id} className="bg-[var(--vault-surface)] text-white">{app.name.toUpperCase()}</option>
               ))}
             </select>
             <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--vault-primary)] text-sm">expand_more</span>
          </div>
          <div className="h-6 w-px bg-white/5 hidden sm:block"></div>
          <div className="relative flex-1 max-w-[140px] sm:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-sm">search</span>
            <input 
              className="w-full bg-white/5 border-none rounded-full pl-9 pr-4 py-1.5 text-[11px] focus:ring-1 focus:ring-[var(--vault-primary)]/50 placeholder:text-white/20" 
              placeholder="Search..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            />
            {showSearch && searchResults && (
              <div className="absolute top-full left-0 w-[300px] sm:w-[400px] mt-2 glass-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden p-2">
                <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
                  {searchResults.apps.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[9px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-3 mb-2">Applications</p>
                      {searchResults.apps.map((app: any) => (
                        <button key={app.id} onClick={() => { setSelectedAppId(app.id); setSearchQuery(''); }} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg flex items-center gap-3 transition-colors">
                          <span className="material-symbols-outlined text-[var(--vault-primary)] text-lg">apps</span>
                          <span className="text-xs font-bold">{app.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* ... rest of search results ... */}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {mounted && activeUser && (
            <button
              type="button"
              onClick={() => refetchProfile()}
              title="Refresh subscription & features"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--vault-primary)]/30 bg-[var(--vault-primary)]/10 hover:bg-[var(--vault-primary)]/20 transition-all"
            >
              <span
                className={`material-symbols-outlined text-sm text-[var(--vault-primary)] ${profileFetching ? 'animate-spin' : ''}`}
              >
                {profileFetching ? 'sync' : 'workspace_premium'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--vault-primary)]">
                {tierDisplayName(activeUser.subscription_tier, activeUser.plan?.name)}
              </span>
              {getTierLevel(activeUser.subscription_tier || activeUser.plan?.name) >= 4 && (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-black">
                  MAX
                </span>
              )}
            </button>
          )}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-[var(--vault-on-surface)] group-hover:text-[var(--vault-primary)] transition-colors">
                {mounted ? (activeUser?.username || 'Developer') : 'Developer'}
              </p>
              <p className="text-[10px] text-[var(--vault-on-surface-variant)] uppercase tracking-wider">
                {mounted ? (activeUser?.email || '') : ''}
              </p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[var(--vault-primary)]/20 bg-white/5 flex items-center justify-center font-bold text-base sm:text-lg text-[var(--vault-primary)] uppercase">
              {mounted ? (activeUser?.username?.substring(0, 2) || 'AD') : 'AD'}
            </div>
          </div>
        </div>
      </header>

      <main className={`transition-all duration-300 mt-16 p-4 lg:p-8 min-h-screen relative z-10 ${sidebarOpen ? 'blur-sm lg:blur-none' : ''} lg:ml-[260px]`}>
        {children}
      </main>

      <AIChatWidget />
    </div>
  );
}
