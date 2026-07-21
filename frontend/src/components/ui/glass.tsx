'use client';

import { motion } from 'framer-motion';
import React from 'react';

export function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 bg-black/70 backdrop-blur-md"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div onClick={e => e.stopPropagation()} className="w-full max-w-[480px]">
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 24 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="glass-card w-full min-w-0 min-h-[580px] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-[var(--border)]"
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
}

export function ModalHeader({ title, onClose, danger = false }: { title: string; onClose: () => void; danger?: boolean }) {
  return (
    <div className="shrink-0 px-8 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--accent-opacity-8)]">
      <h3 className={`text-lg font-black tracking-tight ${danger ? 'text-[var(--destructive)]' : 'text-[var(--foreground)]'}`}>{title}</h3>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-xl bg-[var(--accent-opacity-8)] hover:bg-[var(--destructive)]/15 text-[var(--muted-foreground)] hover:text-[var(--destructive)] flex items-center justify-center transition-all duration-200"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}

export function GlassInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full bg-[var(--accent-opacity-8)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)]/85 font-mono focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--accent-opacity-15)] transition-all duration-200 placeholder:text-[var(--muted-foreground)] ${className}`}
      {...props}
    />
  );
}

export function GlassSelect({ className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full bg-[var(--accent-opacity-8)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)]/85 focus:outline-none focus:border-[var(--primary)]/50 transition-all duration-200 appearance-none ${className}`}
      {...props}
    />
  );
}

export function GlassTextarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full bg-[var(--accent-opacity-8)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)]/75 focus:outline-none focus:border-[var(--primary)]/50 transition-all duration-200 resize-none placeholder:text-[var(--muted-foreground)] ${className}`}
      {...props}
    />
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-[0.18em] mb-1.5 px-0.5">
      {children}
    </label>
  );
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const score = password.length === 0 ? 0 : (
    password.length < 1 ? 1 :
    password.length < 10 ? 2 :
    /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 4 :
    /[A-Z]/.test(password) || /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password) ? 3 : 2
  );
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'var(--destructive)', 'var(--warning)', '#4ade80', 'var(--primary)'];
  return password.length > 0 ? (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? colors[score] : 'rgba(255,255,255,0.08)' }}
          />
        ))}
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: colors[score] }}>
        {labels[score]}
      </p>
    </div>
  ) : null;
}

export function GlassDropzone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); onFiles(Array.from(e.dataTransfer.files)); }}
      onClick={() => inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
        dragging ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-white/10 hover:border-white/20 bg-white/[0.01]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={e => { if (e.target.files?.length) onFiles(Array.from(e.target.files)); }}
      />
      <span className="material-symbols-outlined text-[28px] text-white/20 mb-2">upload_file</span>
      <p className="text-xs font-bold text-white/40">Drop CSV here or click to browse</p>
      <p className="text-[9px] text-white/20 mt-1">Supports .csv files</p>
    </div>
  );
}
