'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchUnread = async () => {
    try {
      const res = await api.get('/developer/notifications/unread-count');
      setCount(res.data.count || 0);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get('/developer/notifications?limit=5')
      .then(res => setNotifs(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    api.put('/developer/notifications/read').catch(() => {});
    setCount(0);
  }, [open]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const severityDot = (s: string) => {
    const colors: Record<string, string> = { info: '#60a5fa', warning: '#fbbf24', critical: '#f87171' };
    return colors[s] || '#60a5fa';
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 transition-all"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-[18px] text-white/60">notifications</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-black leading-none px-1 shadow-lg">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-32px)] z-[200] origin-top-right">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden backdrop-blur-xl">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <p className="text-[11px] font-black text-white/80 uppercase tracking-widest">Notifications</p>
              {notifs.length > 0 && (
                <button
                  onClick={() => { setOpen(false); router.push('/settings/account/notifications'); }}
                  className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest hover:underline"
                >
                  View all
                </button>
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                </div>
              ) : notifs.length > 0 ? (
                notifs.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { setOpen(false); router.push('/settings/account/notifications'); }}
                    className="w-full text-left px-5 py-3.5 hover:bg-white/[0.02] transition-colors border-b border-white/[0.02] last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: severityDot(n.severity) }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-bold text-white/85 truncate">{n.title}</p>
                        <p className="text-[10px] text-white/40 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[8px] font-mono text-white/20 mt-1">
                          {new Date(n.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center py-10 gap-2">
                  <span className="material-symbols-outlined text-[24px] text-white/15">notifications_off</span>
                  <p className="text-[11px] font-bold text-white/30">No notifications</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
