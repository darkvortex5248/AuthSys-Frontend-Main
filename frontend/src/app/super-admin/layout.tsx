'use client';
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/api';

const navItems = [
  { name: 'Overview', icon: 'dashboard', href: '/super-admin/dashboard' },
  { name: 'Developers', icon: 'engineering', href: '/super-admin/developers' },
  { name: 'Subscription Plans', icon: 'card_membership', href: '/super-admin/plans' },
  { name: 'Payments', icon: 'payments', href: '/super-admin/payments' },
  { name: 'SDKs', icon: 'deployed_code', href: '/super-admin/sdk' },
  { name: 'Settings', icon: 'settings', href: '/super-admin/settings' },
];

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('admin_token');
    if (!token && pathname !== '/super-admin/login') {
      router.push('/super-admin/login');
    }
  }, [pathname]);

  if (!mounted) return null;
  if (pathname === '/super-admin/login') return <>{children}</>;

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/super-admin/login');
  };

  return (
    <div className="font-body-md text-[#e5e2e1] selection:bg-[#d97757]/30 min-h-screen bg-[#0d0d0d]">
      <style jsx global>{`
        body {
            background-color: #0d0d0d;
            background-image: radial-gradient(circle at 50% -20%, rgba(217, 119, 87, 0.08) 0%, transparent 50%),
                              radial-gradient(circle at 0% 100%, rgba(217, 119, 87, 0.03) 0%, transparent 40%);
            background-attachment: fixed;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .active-nav-glow {
            box-shadow: -2px 0 10px rgba(217, 119, 87, 0.2);
        }
      `}</style>

      <aside className="fixed left-0 top-0 h-full w-[260px] border-r border-white/5 bg-[#0d0d0d]/30 backdrop-blur-xl flex flex-col py-8 shadow-2xl z-50">
        <div className="px-6 mb-10">
          <h1 className="text-2xl font-bold text-[#d97757] tracking-tight">AuthSys Admin</h1>
          <p className="text-[10px] text-[#8e8ea0] uppercase tracking-widest mt-1 opacity-70">Enterprise Core</p>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive 
                    ? 'text-[#d97757] font-bold border-l-2 border-[#d97757] bg-[#d97757]/5 active-nav-glow' 
                    : 'text-[#c8c6c5] hover:text-[#e5e2e1] hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-xl" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-medium">Terminate Session</span>
          </button>
        </div>
      </aside>

      <header className="fixed top-0 right-0 w-[calc(100%-260px)] h-16 bg-[#0d0d0d]/30 backdrop-blur-md border-b border-white/5 flex justify-between items-center px-8 z-40">
        <h2 className="text-lg font-bold text-[#e5e2e1]">
          {navItems.find(i => i.href === pathname)?.name || 'Admin Console'}
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Core Online</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#d97757]/10 flex items-center justify-center text-[#d97757] font-bold text-xs uppercase border border-[#d97757]/20">
             AD
          </div>
        </div>
      </header>

      <main className="ml-[260px] pt-24 p-8 min-h-screen relative z-10">
        {children}
      </main>
    </div>
  );
}
