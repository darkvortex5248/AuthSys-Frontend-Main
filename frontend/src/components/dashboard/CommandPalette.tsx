'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const pages = [
  { name: 'Overview', icon: 'dashboard', href: '/dashboard' },
  { name: 'Applications', icon: 'apps', href: '/applications' },
  { name: 'License Keys', icon: 'vpn_key', href: '/license-keys' },
  { name: 'Users', icon: 'group', href: '/users' },
  { name: 'Analytics', icon: 'insights', href: '/analytics' },
  { name: 'Blacklist', icon: 'block', href: '/blacklist' },
  { name: 'Variables', icon: 'code', href: '/variables' },
  { name: 'Team Management', icon: 'groups', href: '/team' },
  { name: 'Functions', icon: 'settings_suggest', href: '/functions' },
  { name: 'Chatrooms', icon: 'forum', href: '/chatrooms' },
  { name: 'Discord Bot', icon: 'smart_toy', href: '/discord-bot' },
  { name: 'Telegram Bot', icon: 'send', href: '/telegram-bot' },
  { name: 'Seller API', icon: 'api', href: '/seller-api' },
  { name: 'Billing', icon: 'payments', href: '/billing' },
  { name: 'Audit Logs', icon: 'history', href: '/audit-logs' },
  { name: 'Settings', icon: 'settings', href: '/settings' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = query
    ? pages.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : pages;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    setQuery('');
    setSelectedIndex(0);
  }, [open]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) navigate(filtered[selectedIndex].href);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg glass-strong rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg">
                search
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search pages..."
                className="w-full bg-transparent border-none pl-12 pr-4 py-4 text-white placeholder:text-white/20 text-sm focus:outline-none"
              />
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/40 font-mono">
                ESC
              </kbd>
            </div>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar border-t border-white/5">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-white/30 text-sm">
                  No results found
                </div>
              ) : (
                filtered.map((page, i) => (
                  <button
                    key={page.href}
                    onClick={() => navigate(page.href)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      i === selectedIndex
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{page.icon}</span>
                    <span className="text-sm font-medium">{page.name}</span>
                    {i === selectedIndex && (
                      <span className="ml-auto text-[10px] text-white/30 font-mono flex items-center gap-1">
                        <span className="inline-block px-1 py-0.5 rounded bg-white/10">↵</span>
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
