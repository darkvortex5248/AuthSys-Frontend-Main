'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Cookie, X, Shield, Check, Info } from 'lucide-react';

const CONSENT_KEY = 'rinox-cookie-consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[301] w-[calc(100%-2rem)] max-w-3xl"
          >
            <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#121212] to-[#0a0a0a] shadow-2xl shadow-black/60 p-0 overflow-hidden">
              {/* Top accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-[var(--primary)] via-[var(--primary)] to-[var(--primary)]" />

              <button
                onClick={decline}
                className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] flex items-center justify-center text-[var(--muted-foreground)] hover:text-white transition-all z-10"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
                  {/* Icon */}
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 border border-[var(--primary)]/15 flex items-center justify-center">
                      <Cookie className="w-7 h-7 text-[var(--primary)]" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--card)] border border-white/[0.06] flex items-center justify-center">
                      <Shield className="w-3 h-3 text-[var(--primary)]" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
                      Your Privacy Matters to Us
                    </h2>
                    <p className="text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed mb-4">
                      We use cookies and similar technologies to secure your session, remember your preferences, 
                      and help us improve our platform. We prioritize your data security and never sell your 
                      personal information.
                    </p>

                    {/* Info cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                        <Shield className="w-4 h-4 text-[var(--primary)] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-0.5">Essential Cookies</p>
                          <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">Required for authentication & security. Always active.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                        <Info className="w-4 h-4 text-[var(--primary)] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-0.5">Preference Cookies</p>
                          <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">Remember your UI settings & theme choices.</p>
                        </div>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        onClick={accept}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-black text-sm font-black uppercase tracking-widest hover:bg-[var(--primary)]/90 active:scale-[0.97] transition-all shadow-lg shadow-[var(--primary)]/25"
                      >
                        <Check className="w-4 h-4" />
                        Accept All
                      </button>
                      <button
                        onClick={decline}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/[0.08] text-[var(--muted-foreground)] text-sm font-black uppercase tracking-widest hover:text-white hover:bg-white/[0.04] active:scale-[0.97] transition-all"
                      >
                        Decline
                      </button>
                      <Link
                        href="/cookies"
                        className="text-center sm:text-left text-[11px] font-medium text-[var(--primary)] hover:text-[var(--primary)] underline underline-offset-4 transition-colors whitespace-nowrap"
                      >
                        Cookie Policy
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
