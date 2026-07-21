'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--primary)]/30 selection:text-black font-sans">
      <style jsx global>{`
        @keyframes shake { 
          10%, 90% { transform: translate3d(-1px, 0, 0); } 
          20%, 80% { transform: translate3d(2px, 0, 0); } 
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 
          40%, 60% { transform: translate3d(4px, 0, 0); } 
        }
      `}</style>
      
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        {/* Ambient background glow elements */}
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-[var(--primary)] opacity-[0.06] blur-[150px] rounded-full pointer-events-none animate-pulse-slow"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-[var(--primary)] opacity-[0.04] blur-[150px] rounded-full pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-[var(--ring)] opacity-[0.03] blur-[120px] rounded-full pointer-events-none"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-[420px]"
        >
          {children}
        </motion.div>
      </main>
      
      <footer className="w-full py-12 flex flex-col items-center justify-center gap-6 bg-[var(--background)] border-t border-white/5">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/60 flex items-center justify-center">
              <span className="material-symbols-outlined text-black text-xs font-black">shield</span>
           </div>
           <div className="text-[11px] font-black leading-none tracking-[0.2em] text-[var(--foreground)] uppercase">AUTHSYS CORE</div>
        </div>
        <p className="text-[13px] font-medium text-[var(--muted-foreground)] opacity-60">© {new Date().getFullYear()} AuthSys. All rights reserved.</p>
        <div className="flex gap-8">
          <Link className="text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-all duration-200 uppercase tracking-widest" href="#">Privacy</Link>
          <Link className="text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-all duration-200 uppercase tracking-widest" href="#">Terms</Link>
          <Link className="text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-all duration-200 uppercase tracking-widest" href="#">Help</Link>
        </div>
      </footer>
    </div>
  );
}
