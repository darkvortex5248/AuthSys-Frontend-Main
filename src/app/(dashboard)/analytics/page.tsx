'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { useAnalytics } from '@/hooks/use-developer-queries';
import {
  Users, Zap, Key, Ban, Globe, RefreshCw, AlertCircle,
  BarChart2, TrendingUp, Lock
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

function Counter({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView || !target) return;
    let current = 0;
    const step = target / 40;
    const t = setInterval(() => {
      current = Math.min(current + step, target);
      setVal(Math.round(current));
      if (current >= target) clearInterval(t);
    }, 28);
    return () => clearInterval(t);
  }, [inView, target]);

  return <span ref={ref}>{val.toLocaleString()}</span>;
}

function StatCard({ label, value, icon: Icon, color, isLive, delay }: any) {
  return (
    <motion.div
      variants={fadeIn} initial="hidden" animate="show"
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1], delay }}
      className="premium-card p-5 relative overflow-hidden group"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: `radial-gradient(ellipse at 80% 0%, ${color}12 0%, transparent 70%)` }} />
      <div className="flex items-start justify-between mb-4">
        <div className="stat-icon-circle">
          <Icon className="w-4.5 h-4.5" />
        </div>
        {isLive && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[var(--primary)]" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--primary)]">Live</span>
          </div>
        )}
      </div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
          <Counter target={Number(value) || 0} />
        </p>
      </div>
    </motion.div>
  );
}

function ChartBar({ label, value, maxValue, index }: { label: string; value: number; maxValue: number; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const [hovered, setHovered] = useState(false);

  return (
    <div ref={ref} className="flex-1 flex flex-col items-center gap-2 min-w-0 group cursor-default relative"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold whitespace-nowrap z-10 bg-[var(--card)] text-[var(--primary)]"
          >
            {value} logins
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full flex-1 relative flex items-end justify-center rounded-t-lg overflow-hidden" style={{ minHeight: 1 }}>
        <motion.div
          className="w-full rounded-t-lg transition-all duration-200"
          initial={{ height: 0 }}
          animate={inView ? { height: `${Math.max(pct, 2)}%` } : { height: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: index * 0.07 }}
          style={{
            background: hovered
              ? 'var(--primary)'
              : `linear-gradient(to top, color-mix(in srgb, var(--primary) 60%, transparent), color-mix(in srgb, var(--primary) 25%, transparent))`,
            boxShadow: hovered ? '0 0 16px color-mix(in srgb, var(--primary) 35%, transparent)' : 'none',
          }}
        />
      </div>
      <span className="stat-label tracking-wide">{label}</span>
    </div>
  );
}

function CountryBar({ name, count, total, index }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const pct = total > 0 ? (count / total) * 100 : 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: index * 0.07 }}
      className="flex items-center gap-4"
    >
      <span className="w-20 sm:w-28 text-sm font-bold text-[var(--foreground)] shrink-0 truncate">{name}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden bg-[var(--accent-opacity-8)]">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : { width: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: index * 0.07 + 0.2 }}
          style={{ background: `linear-gradient(to right, var(--primary), color-mix(in srgb, var(--primary) 50%, transparent))` }}
        />
      </div>
      <span className="text-xs font-bold w-12 sm:w-14 text-right text-[var(--primary)] shrink-0">{count} users</span>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const { selectedAppId } = useAuthStore();
  const { data: stats, isLoading, isFetching, isError, error, refetch } = useAnalytics(selectedAppId);

  if (!selectedAppId) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-16 h-16 rounded-xl bg-[var(--accent-opacity-8)] border border-[var(--border)] flex items-center justify-center">
        <Lock className="w-7 h-7 text-[var(--muted-foreground)]" />
      </div>
      <p className="text-lg font-bold text-[var(--muted-foreground)]">Select an application first</p>
    </div>
  );

  if (isLoading && !stats) return (
    <div className="page-wrapper pt-6 overflow-visible space-y-6">
      <div className="h-10 w-64 bg-[var(--accent-opacity-8)] rounded-xl animate-pulse" />
      <div className="h-4 w-48 bg-[var(--accent-opacity-8)] rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="premium-card p-5 space-y-4">
            <div className="w-10 h-10 bg-[var(--accent-opacity-8)] rounded-xl animate-pulse" />
            <div className="h-3 w-20 bg-[var(--accent-opacity-8)] rounded animate-pulse" />
            <div className="h-7 w-16 bg-[var(--accent-opacity-8)] rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
      <div className="premium-card p-7">
        <div className="h-60 bg-[var(--accent-opacity-8)] rounded-xl animate-pulse" />
      </div>
    </div>
  );

  if (isError && !stats) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4 px-4">
      <div className="w-16 h-16 rounded-xl bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-[var(--destructive)]" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">Analytics Error</h3>
        <p className="text-sm text-[var(--muted-foreground)] max-w-sm">{(error as any)?.response?.data?.detail || 'Failed to load analytics'}</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={() => refetch()}
        className="btn-secondary text-xs px-5 py-2.5"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Retry
      </motion.button>
    </div>
  );

  if (!stats) return null;

  const chartMax = Math.max(...(stats.chart_data?.map((d: any) => d.logins) ?? [1]), 1);

  return (
    <div className="page-wrapper pt-6 overflow-visible min-h-screen">
      {/* Header */}
      {isFetching && (
        <div className="fixed top-20 right-4 z-[110] flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--card)]/90 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-[var(--primary)]">
          <span className="w-3 h-3 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          Updating
        </div>
      )}
      <motion.div variants={fadeIn} initial="hidden" animate="show"
        transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
        className="page-header overflow-visible">
        <div className="page-header-content">
          <div className="breadcrumb">
            <span>Enterprise</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="breadcrumb-active">Analytics</span>
          </div>
          <h1 className="page-title">Analytics & Insights</h1>
          <p className="page-subtitle">
            Real-time for <span className="font-semibold text-[var(--foreground)]">{stats.app_name}</span>
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => refetch()}
          className="btn-secondary"
        >
          <RefreshCw className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Staggered content sections */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show">
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard label="Total Users" value={stats.total_users} icon={Users} color="var(--primary)" delay={0.05} />
        <StatCard label="Active Sessions" value={stats.active_sessions} icon={Zap} color="var(--primary)" isLive delay={0.1} />
        <StatCard label="Active Keys" value={stats.active_keys} icon={Key} color="var(--ring)" delay={0.15} />
        <StatCard label="Banned Users" value={stats.banned_users} icon={Ban} color="#f87171" delay={0.2} />
      </div>

      {/* Chart */}
      <motion.div variants={fadeIn} initial="hidden" animate="show"
        transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1], delay: 0.25 }}
        className="premium-card mb-6"
      >
        <div className="px-7 py-5 border-b border-white/5 bg-white/[0.015] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
              <h4 className="section-title">Authentication Trends</h4>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">Daily logins over the last 7 days</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/6 bg-white/[0.02]">
            <div className="w-2.5 h-2.5 rounded-sm bg-[var(--primary)]" />
            <span className="stat-label">Logins</span>
          </div>
        </div>

        <div className="px-7 pt-6 pb-5">
          <div className="relative" style={{ height: 220 }}>
            {[0, 25, 50, 75, 100].map(pct => (
              <div key={pct} className="absolute w-full border-t border-white/[0.04]"
                style={{ bottom: `${pct}%` }} />
            ))}
            <div className="absolute inset-0 flex items-end gap-3 px-1">
              {(stats.chart_data ?? []).map((d: any, i: number) => (
                <ChartBar key={i} label={d.name} value={d.logins} maxValue={chartMax} index={i} />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">

        {/* Geographic */}
        <motion.div variants={fadeIn} initial="hidden" animate="show"
          transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1], delay: 0.3 }}
          className="premium-card"
        >
          <div className="px-7 py-5 border-b border-white/5 bg-white/[0.015] flex items-center gap-3">
            <Globe className="w-4 h-4 text-[var(--primary)]" />
            <h4 className="section-title">Geographic Distribution</h4>
          </div>
          <div className="p-7 space-y-5">
            {stats.top_countries?.length > 0 ? stats.top_countries.map((r: any, i: number) => (
              <CountryBar key={r.name} name={r.name} count={r.count} total={stats.total_users} index={i} />
            )) : (
              <div className="py-10 flex flex-col items-center gap-3">
                <Globe className="w-8 h-8 text-white/10" />
                <p className="text-sm text-[var(--muted-foreground)]">No geographic data yet.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* License types */}
        <motion.div variants={fadeIn} initial="hidden" animate="show"
          transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1], delay: 0.35 }}
          className="premium-card"
        >
          <div className="px-7 py-5 border-b border-white/5 bg-white/[0.015] flex items-center gap-3">
            <Key className="w-4 h-4 text-[var(--primary)]" />
            <h4 className="section-title">License Type Distribution</h4>
          </div>
          <div className="p-7 space-y-3">
            {stats.key_usage?.length > 0 ? stats.key_usage.map((u: any, i: number) => (
              <motion.div
                key={u.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.07, duration: 0.4 }}
                className="flex items-center justify-between px-4 py-4 rounded-xl border border-white/6 bg-white/[0.02] group hover:border-white/12 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--primary)]/10">
                    <Key className="w-3.5 h-3.5 text-[var(--primary)]" />
                  </div>
                  <span className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wide">{u.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--primary)]">{u.count}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">keys</span>
                </div>
              </motion.div>
            )) : (
              <div className="py-10 flex flex-col items-center gap-3">
                <Key className="w-8 h-8 text-white/10" />
                <p className="text-sm text-[var(--muted-foreground)]">No keys generated yet.</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>
      </motion.div>
    </div>
  );
}
