"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Home, Grid, Key, Users, BarChart, ShieldAlert, Database, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import AgentChat from '@/components/AgentChat';
import api from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, logout } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [apps, setApps] = useState<any[]>([]);
  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Attempt to fetch apps to verify the token
        const res = await api.get('/developer/apps');
        if (isMounted) {
          setApps(res.data);
          setIsReady(true);
        }
      } catch (err: any) {
        if (isMounted) {
          if (err.response?.status === 401) {
            logout();
            router.push('/login');
          } else {
            // Even on other errors, we might want to let them in 
            // if we are sure the token is structurally valid, 
            // but for safety, let's just ready up if it's not a 401
            setIsReady(true);
          }
        }
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [token, router, logout]);

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[var(--background)]">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-500 font-medium animate-pulse">Verifying Session...</p>
      </div>
    );
  }

  const appIdMatch = pathname.match(/\/apps\/(\d+)/);
  const activeAppId = appIdMatch ? parseInt(appIdMatch[1]) : null;

  const handleLogout = async () => {
    logout();
    router.push('/login');
  };

  const appNav = [
    { name: 'Keys', href: `/apps/${activeAppId}/keys`, icon: Key },
    { name: 'Users', href: `/apps/${activeAppId}/users`, icon: Users },
    { name: 'Analytics', href: `/apps/${activeAppId}/analytics`, icon: BarChart },
    { name: 'Blacklist', href: `/apps/${activeAppId}/blacklist`, icon: ShieldAlert },
    { name: 'Variables', href: `/apps/${activeAppId}/variables`, icon: Database },
    { name: 'Settings', href: `/apps/${activeAppId}/settings`, icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="h-8 w-8 bg-[var(--primary)] rounded-lg flex items-center justify-center">
            <ShieldAlert size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] tracking-tight">AuthSys</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <Link href="/dashboard" className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${pathname === '/dashboard' ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium' : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100'}`}>
            <Home size={18} /> Overview
          </Link>
          <Link href="/apps" className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${pathname === '/apps' ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium' : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100'}`}>
            <Grid size={18} /> All Apps
          </Link>

          {activeAppId && (
            <div className="mt-8">
              <p className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                App Menu
              </p>
              {appNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.includes(item.href);
                return (
                  <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${isActive ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium' : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100'}`}>
                    <Icon size={18} /> {item.name}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full text-sm rounded-md text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-zinc-950 relative">
        <div className="p-8 max-w-7xl mx-auto min-h-full">
          {children}
        </div>
      </main>

      <AgentChat />
    </div>
  );
}
