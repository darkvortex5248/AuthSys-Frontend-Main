'use client';
import { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { useOverview } from '@/hooks/use-developer-queries';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const TIME_RANGE_DAYS: Record<string, number> = {
  'Last 24 Hours': 1,
  'Last 7 Days': 7,
  'Last 30 Days': 30,
  'All Time': 365,
};

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    startTime.current = Date.now();
    const duration = 800;
    const from = ref.current;
    const to = value;

    const animate = () => {
      const elapsed = Date.now() - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      ref.current = Math.round(from + (to - from) * ease);
      setDisplay(ref.current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <>{display}{suffix}</>;
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

export default function OverviewPage() {
  const [showTimeRange, setShowTimeRange] = useState(false);
  const [timeRange, setTimeRange] = useState('Last 7 Days');
  const days = TIME_RANGE_DAYS[timeRange] ?? 7;

  const { data, isLoading, isFetching, isError, refetch } = useOverview(days);

  const chartData = useMemo(() => {
    if (!data?.chart_data?.length) return [];
    return data.chart_data.map((d: { name: string; logins: number }) => ({
      name: d.name,
      logins: d.logins,
    }));
  }, [data?.chart_data]);

  const handleExport = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Applications', data.total_apps],
      ['Active Keys', data.active_keys],
      ['Active Sessions', data.active_sessions],
      ['Suspicious (24h)', data.suspicious_24h],
      ['', ''],
      ['Key Usage Type', 'Count'],
      ...(data.key_usage || []).map((u: { type: string; count: number }) => [
        u.type, u.count,
      ]),
      ['', ''],
      ['Country', 'Users'],
      ...(data.top_countries || []).map((c: { name: string; count: number }) => [
        c.name, c.count,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `rinox_auth_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-[50vh] gap-4"
      >
        <div className="w-16 h-16 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-[var(--destructive)]">error_outline</span>
        </div>
        <p className="text-[var(--muted-foreground)] text-lg font-medium">
          Could not load dashboard data.
        </p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => refetch()}
          className="px-6 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-sm font-bold shadow-lg shadow-[var(--accent-opacity-20)]"
        >
          Retry
        </motion.button>
      </motion.div>
    );
  }

  const COLORS = ['var(--primary)', 'var(--primary)', 'var(--ring)'];
  const PIE_COLORS = ['var(--primary)', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="page-wrapper pt-6 overflow-visible space-y-6"
    >
      {isFetching && (
        <div className="fixed top-20 right-4 z-[110] flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--border)] text-[10px] font-bold uppercase tracking-widest text-[var(--primary)]">
          <span className="w-3 h-3 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          Updating
        </div>
      )}

      {/* Header */}
      <motion.div variants={fadeIn} transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }} className="page-header overflow-visible">
        <div className="page-header-content">
          <h1 className="page-title">System Overview</h1>
          <nav className="breadcrumb">
            <span>Enterprise</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="breadcrumb-active">Overview</span>
          </nav>
        </div>
        <div className="flex gap-3 relative z-[100]">
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowTimeRange(!showTimeRange)}
              className="btn-secondary"
            >
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              {timeRange}
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </motion.button>
            <AnimatePresence>
              {showTimeRange && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-48 glass-card rounded-xl shadow-2xl z-[110] overflow-hidden"
                >
                  {Object.keys(TIME_RANGE_DAYS).map((range) => (
                    <button
                      key={range}
                      onClick={() => { setTimeRange(range); setShowTimeRange(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[var(--accent-opacity-8)] transition-colors ${
                        timeRange === range ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleExport}
            className="btn-primary"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export Data
          </motion.button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: 'apps', label: 'Total Applications', value: data.total_apps, color: 'primary', desc: 'Registered applications' },
          { icon: 'vpn_key', label: 'Active Keys', value: data.active_keys, color: 'secondary', desc: 'Valid license keys' },
          { icon: 'bolt', label: 'Active Sessions', value: data.active_sessions, color: 'tertiary', desc: 'Live user sessions' },
          { icon: 'warning', label: 'Suspicious (24h)', value: data.suspicious_24h, color: 'red', desc: 'Flagged activities' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            variants={fadeIn}
            transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
            whileHover={{ y: -4, scale: 1.01 }}
            className={`premium-card p-6 relative overflow-hidden ${
              card.color === 'red' ? 'border-[var(--destructive)]/20 hover:shadow-[var(--destructive)]/10' : 'hover:shadow-lg'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="flex justify-between items-start relative z-10 mb-4">
              <div className="stat-icon-circle">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {card.icon}
                </span>
              </div>
              <motion.div
                className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                title={card.desc}
              >
                <span className="material-symbols-outlined text-sm text-[var(--muted-foreground)]">info</span>
              </motion.div>
            </div>
            <p className="stat-label text-[var(--muted-foreground)]">{card.label}</p>
            <p className={`stat-value text-2xl font-bold mt-1 ${card.color === 'red' ? 'text-[var(--destructive)]' : 'text-[var(--foreground)]'}`}>
              <AnimatedCounter value={card.value} />
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={fadeIn} transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }} className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Daily Logins Area Chart */}
        <div className="lg:col-span-6 premium-card p-6">
          <h3 className="section-title mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--primary)]">timeline</span>
            Daily Logins
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="loginGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                  labelStyle={{ color: 'var(--foreground)', fontSize: 12, fontWeight: 700 }}
                  itemStyle={{ color: 'var(--primary)', fontSize: 11 }}
                />
                <Area
                  type="monotone"
                  dataKey="logins"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#loginGradient)"
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-4 premium-card p-6 flex flex-col">
          <h3 className="section-title mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--primary)]">history</span>
            Recent Activity
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[330px] pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {(data.recent_activity || []).map((log: any, i: number) => (
                <motion.div
                  key={log.id || i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                  className="flex gap-4 items-start group"
                >
                  <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    log.is_suspicious
                      ? 'bg-red-400 shadow-[0_0_8px_rgba(255,180,171,0.6)]'
                      : 'bg-[var(--primary)] shadow-[0_0_8px_rgba(173,198,255,0.6)]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <p className="text-sm font-bold text-[var(--foreground)] truncate">
                        {log.action_type.toUpperCase()}
                        {log.details?.reason ? ` — ${log.details.reason}` : ''}
                      </p>
                      <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                      IP: {log.ip_address} · {log.country || 'Unknown Location'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {(data.recent_activity || []).length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-[var(--muted-foreground)] text-sm">
                No activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Bottom Row */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Countries */}
        <motion.div variants={fadeIn} transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }} className="premium-card p-6">
          <h4 className="section-title mb-6">
            Top Traffic Countries
          </h4>
          <div className="space-y-4">
            {(data.top_countries || []).map((c: { name: string; count: number }, i: number) => {
              const totalUsers = data.total_users || 1;
              const percentage = Math.round((c.count / totalUsers) * 100);
              return (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="space-y-1.5"
                >
                  <div className="flex justify-between text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <span className="text-[var(--primary)]/60 text-[11px]">{String.fromCodePoint(0x1F310)}</span>
                      {c.name}
                    </span>
                    <span className="font-bold text-[var(--primary)]">{percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
                      className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] rounded-full"
                    />
                  </div>
                </motion.div>
              );
            })}
            {(data.top_countries || []).length === 0 && (
              <div className="text-[var(--muted-foreground)] text-xs text-center py-4">No data yet</div>
            )}
          </div>
        </motion.div>

        {/* License Key Usage Pie Chart */}
        <motion.div variants={fadeIn} transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }} className="premium-card p-6">
          <h4 className="section-title mb-4">
            License Key Usage
          </h4>
          <div className="flex items-center justify-center h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(data.key_usage || []).map((item: { type: string; count: number }, i: number) => ({
                    name: item.type,
                    value: item.count,
                    color: PIE_COLORS[i % PIE_COLORS.length],
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {(data.key_usage || []).map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                  labelStyle={{ color: 'var(--foreground)', fontSize: 12, fontWeight: 700 }}
                  itemStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {(data.key_usage || []).map((item: { type: string; count: number }, i: number) => (
              <div key={item.type} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="stat-label">
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Suspicious IPs */}
        <motion.div variants={fadeIn} transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }} className="premium-card p-6">
          <h4 className="section-title mb-4">
            Suspicious IPs
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 stat-label">IP Address</th>
                  <th className="text-right py-3 px-4 stat-label">Attempts</th>
                  <th className="text-right py-3 px-4 stat-label">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {(data.suspicious_ips || []).map((row: { ip: string; attempts: number; status: string }, i: number) => (
                  <motion.tr
                    key={row.ip}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-medium font-mono text-[var(--foreground)]">{row.ip}</td>
                    <td className={`py-3 px-4 text-sm text-right font-bold ${
                      row.status === 'error' ? 'text-red-400' : 'text-[var(--ring)]'
                    }`}>{row.attempts}</td>
                    <td className="py-3 px-4 text-right">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-[var(--primary)] hover:underline text-xs font-bold uppercase tracking-wider"
                      >
                        {row.status === 'error' ? 'BLOCK' : 'WATCH'}
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
                {(data.suspicious_ips || []).length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-[var(--muted-foreground)] text-xs">
                      No active threats detected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

