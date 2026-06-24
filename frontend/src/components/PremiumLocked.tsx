'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface PremiumLockedProps {
  feature: string;
  tier?: string;
}

export default function PremiumLocked({ feature, tier = 'Seller' }: PremiumLockedProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-24 px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6"
      >
        <span
          className="material-symbols-outlined text-4xl text-amber-400"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          lock
        </span>
      </motion.div>
      <h2 className="text-xl font-black text-white mb-3 tracking-tight">{feature} — Locked</h2>
      <p className="text-sm text-[#8e8ea0] mb-8 leading-relaxed max-w-sm">
        This feature requires the{' '}
        <span className="text-amber-400 font-bold">{tier}</span> plan or higher.
        Upgrade to unlock {feature.toLowerCase()} and other premium tools.
      </p>
      <Link
        href="/settings/billing"
        className="px-6 py-3 rounded-xl bg-amber-500/15 text-amber-400 text-sm font-black uppercase tracking-widest hover:bg-amber-500/25 transition-all"
      >
        View Plans →
      </Link>
    </div>
  );
}
