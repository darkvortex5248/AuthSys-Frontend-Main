'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type CopyOptions = {
  label?: string;
  description?: string;
};

type CopyState = CopyOptions & {
  open: boolean;
  text: string;
};

const CopyContext = createContext<{
  copy: (text: string, options?: CopyOptions) => Promise<void>;
} | null>(null);

export function CopyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CopyState>({ open: false, text: '' });

  const copy = useCallback(async (text: string, options?: CopyOptions) => {
    const value = (text ?? '').trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement('textarea');
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setState({
      open: true,
      text: value,
      label: options?.label ?? 'Copied to clipboard',
      description: options?.description,
    });
    window.setTimeout(() => {
      setState((s) => ({ ...s, open: false }));
    }, 2800);
  }, []);

  const close = () => setState((s) => ({ ...s, open: false }));

  return (
    <CopyContext.Provider value={{ copy }}>
      {children}
      <AnimatePresence>
        {state.open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            className="fixed bottom-6 right-6 z-[210] w-full max-w-sm px-4 sm:px-0"
          >
            <motion.div
              className="rounded-2xl border border-emerald-500/25 bg-[#1a1a1f] p-5 shadow-2xl shadow-black/50"
              onClick={close}
            >
              <motion.div className="flex items-start gap-3">
                <motion.div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                </motion.div>
                <motion.div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#e5e2e1]">{state.label}</p>
                  {state.description && (
                    <p className="text-xs text-[#8e8ea0] mt-1">{state.description}</p>
                  )}
                  <code className="mt-2 block text-[11px] font-mono text-emerald-400/90 bg-black/30 rounded-lg px-3 py-2 break-all max-h-24 overflow-y-auto">
                    {state.text}
                  </code>
                </motion.div>
                <button
                  type="button"
                  onClick={close}
                  className="text-[#8e8ea0] hover:text-white transition-colors shrink-0"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </CopyContext.Provider>
  );
}

export function useCopy() {
  const ctx = useContext(CopyContext);
  if (!ctx) throw new Error('useCopy must be used within CopyProvider');
  return ctx.copy;
}
