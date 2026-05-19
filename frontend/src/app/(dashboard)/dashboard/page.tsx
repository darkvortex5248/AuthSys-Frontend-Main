'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showTimeRange, setShowTimeRange] = useState(false);
  const [timeRange, setTimeRange] = useState('Last 24 Hours');

  const handleExport = () => {
    if (!data) return;
    
    // Prepare CSV data
    const rows = [
      ['Metric', 'Value'],
      ['Total Applications', data.total_apps],
      ['Active Keys', data.active_keys],
      ['Active Sessions', data.active_sessions],
      ['Suspicious (24h)', data.suspicious_24h],
      ['', ''],
      ['Key Usage Type', 'Count'],
      ...(data.key_usage || []).map((u: any) => [u.type, u.count]),
      ['', ''],
      ['Country', 'Users'],
      ...(data.top_countries || []).map((c: any) => [c.name, c.count])
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rinox_auth_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const fetchOverview = async (days: number = 7) => {
    setLoading(true);
    try {
      const res = await api.get(`/developer/analytics/overview?days=${days}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard overview", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const dayMap: any = {
      'Last 24 Hours': 1,
      'Last 7 Days': 7,
      'Last 30 Days': 30,
      'All Time': 365 // Approximation for all time
    };
    fetchOverview(dayMap[timeRange] || 7);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--vault-primary)]"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-bold text-[var(--vault-on-surface)] tracking-tight">System Overview</h2>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest mt-2">
            <span>Enterprise</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[var(--vault-primary)]">Dashboard</span>
          </nav>
        </div>
        <div className="flex gap-3 relative">
          <div className="relative">
            <button 
              onClick={() => setShowTimeRange(!showTimeRange)}
              className="px-4 py-2 glass-card rounded-lg flex items-center gap-2 text-sm font-medium text-[var(--vault-on-surface)] active:scale-[0.98] transition-all hover:bg-white/5"
            >
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              {timeRange}
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
            
            {showTimeRange && (
              <div className="absolute top-full right-0 mt-2 w-48 glass-card rounded-xl border border-white/10 shadow-2xl z-[100] overflow-hidden">
                {['Last 24 Hours', 'Last 7 Days', 'Last 30 Days', 'All Time'].map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setTimeRange(range);
                      setShowTimeRange(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors ${timeRange === range ? 'text-[var(--vault-primary)]' : 'text-[var(--vault-on-surface-variant)]'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-[var(--vault-primary)] text-[var(--vault-on-primary)] font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-[var(--vault-primary)]/20 active:scale-[0.98] hover:shadow-[var(--vault-primary)]/40 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export Data
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="glass-card p-5 rounded-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--vault-primary)]/10 blur-3xl rounded-full"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2 rounded-lg bg-[var(--vault-primary)]/10 text-[var(--vault-primary)]">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>apps</span>
            </div>
          </div>
          <h3 className="text-[var(--vault-on-surface-variant)] text-[10px] uppercase tracking-wider font-bold">Total Applications</h3>
          <p className="text-3xl font-bold text-[var(--vault-on-surface)] mt-1">{data.total_apps}</p>
        </div>
        {/* Card 2 */}
        <div className="glass-card p-5 rounded-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--vault-secondary)]/10 blur-3xl rounded-full"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2 rounded-lg bg-[var(--vault-secondary)]/10 text-[var(--vault-secondary)]">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>vpn_key</span>
            </div>
          </div>
          <h3 className="text-[var(--vault-on-surface-variant)] text-[10px] uppercase tracking-wider font-bold">Active Keys</h3>
          <p className="text-3xl font-bold text-[var(--vault-on-surface)] mt-1">{data.active_keys}</p>
        </div>
        {/* Card 3 */}
        <div className="glass-card p-5 rounded-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--vault-tertiary)]/10 blur-3xl rounded-full"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2 rounded-lg bg-[var(--vault-tertiary)]/10 text-[var(--vault-tertiary)]">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            </div>
          </div>
          <h3 className="text-[var(--vault-on-surface-variant)] text-[10px] uppercase tracking-wider font-bold">Active Sessions</h3>
          <p className="text-3xl font-bold text-[var(--vault-on-surface)] mt-1">{data.active_sessions}</p>
        </div>
        {/* Card 4 */}
        <div className="glass-card p-5 rounded-xl border-red-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 blur-3xl rounded-full"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <span className="text-red-400 text-[12px] font-bold">Live</span>
          </div>
          <h3 className="text-[var(--vault-on-surface-variant)] text-[10px] uppercase tracking-wider font-bold">Suspicious (24h)</h3>
          <p className="text-3xl font-bold text-red-400 mt-1">{data.suspicious_24h}</p>
        </div>
      </div>

      {/* Main Content Area: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mb-8">
        {/* Left: Daily Logins Chart (60%) */}
        <div className="lg:col-span-6 glass-card p-6 rounded-xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[var(--vault-on-surface)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--vault-primary)]">timeline</span>
              Daily Logins
            </h3>
            <div className="flex gap-2 items-center">
              <span className="w-3 h-3 rounded-full bg-[var(--vault-primary)]/50"></span>
              <span className="text-xs text-[var(--vault-on-surface-variant)]">Successful</span>
            </div>
          </div>
          <div className="flex-1 flex items-end gap-3 h-[280px] pt-4 relative">
             <div className="absolute inset-0 flex items-end justify-between px-2 pb-2">
                {(data.chart_data || []).map((item: any, i: number) => {
                  const maxLogins = Math.max(...(data.chart_data || []).map((d: any) => d.logins), 1);
                  const height = (item.logins / maxLogins) * 100;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 group/bar relative h-full justify-end" style={{ width: `${100 / data.chart_data.length}%` }}>
                       <div className="text-[10px] font-bold text-[var(--vault-primary)] opacity-0 group-hover/bar:opacity-100 transition-opacity mb-1">{item.logins}</div>
                       <div 
                        className="w-full max-w-[20px] bg-gradient-to-t from-[var(--vault-primary)]/20 to-[var(--vault-primary)] rounded-t-sm"
                        style={{ height: `${height}%` }}
                       ></div>
                       <div className="text-[10px] text-[var(--vault-on-surface-variant)] uppercase font-bold mt-2">{item.name}</div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>

        {/* Right: Recent Activity Live Feed (40%) */}
        <div className="lg:col-span-4 glass-card p-6 rounded-xl flex flex-col">
          <h3 className="text-lg font-bold text-[var(--vault-on-surface)] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--vault-secondary)]">history</span>
            Recent Activity
          </h3>
          <div className="flex-1 space-y-5 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {(data.recent_activity || []).map((log: any, i: number) => (
              <div key={i} className="flex gap-4 items-start group">
                <div className={`mt-1 w-2.5 h-2.5 rounded-full ${log.is_suspicious ? 'bg-red-400 shadow-[0_0_8px_rgba(255,180,171,0.6)]' : 'bg-[var(--vault-primary)] shadow-[0_0_8px_rgba(173,198,255,0.6)]'} flex-shrink-0`}></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-[var(--vault-on-surface)]">{log.action_type.toUpperCase()} - {log.details?.reason || 'Event Logged'}</p>
                    <span className="text-[10px] text-[var(--vault-on-surface-variant)]">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-[var(--vault-on-surface-variant)] mt-0.5">IP: {log.ip_address} · {log.country || 'Unknown Location'}</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] ${log.is_suspicious ? 'bg-red-400/10 text-red-400' : 'bg-[var(--vault-primary)]/10 text-[var(--vault-primary)]'} font-bold uppercase tracking-tight`}>
                    {log.is_suspicious ? 'High Risk' : 'Normal Risk'}
                  </span>
                </div>
              </div>
            ))}
            {(data.recent_activity || []).length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-[var(--vault-on-surface-variant)] text-sm">
                No activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Column 1: Top Countries */}
        <div className="glass-card p-6 rounded-xl">
          <h4 className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest mb-6">Top Traffic Countries</h4>
          <div className="space-y-4">
            {(data.top_countries || []).map((c: any) => {
              const totalUsers = data.total_users || 1;
              const percentage = Math.round((c.count / totalUsers) * 100);
              return (
                <div key={c.name} className="space-y-1.5">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{c.name}</span>
                    <span className="font-bold">{percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--vault-primary)] rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
            {data.top_countries.length === 0 && <div className="text-[var(--vault-on-surface-variant)] text-xs text-center py-4">No data yet</div>}
          </div>
        </div>

        {/* Column 2: Key Usage (Donut) */}
        <div className="glass-card p-6 rounded-xl flex flex-col items-center text-center">
          <h4 className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest mb-4 w-full text-left">License Key Usage</h4>
          <div className="relative w-40 h-40 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" fill="transparent" r="70" stroke="rgba(255,255,255,0.05)" strokeWidth="12"></circle>
              {(data.key_usage || []).map((item: any, i: number) => {
                const total = data.active_keys || 1;
                const dashArray = 440;
                const offset = dashArray - (item.count / total) * dashArray;
                const colors = ['var(--vault-primary)', 'var(--vault-secondary)', 'var(--vault-tertiary)'];
                return (
                  <circle 
                    key={i} cx="80" cy="80" fill="transparent" r="70" 
                    stroke={colors[i % colors.length]} 
                    strokeDasharray={dashArray} 
                    strokeDashoffset={offset} 
                    strokeLinecap="round" strokeWidth="12"
                  ></circle>
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[var(--vault-on-surface)]">{data.active_keys}</span>
              <span className="text-[10px] text-[var(--vault-on-surface-variant)] uppercase font-bold">Active</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full">
            {(data.key_usage || []).map((item: any, i: number) => {
               const colors = ['var(--vault-primary)', 'var(--vault-secondary)', 'var(--vault-tertiary)'];
               return (
                <div key={i} className="text-left border-l-2 pl-3" style={{ borderColor: colors[i % colors.length] }}>
                  <p className="text-[10px] text-[var(--vault-on-surface-variant)] uppercase font-bold">{item.type}</p>
                  <p className="text-lg font-bold" style={{ color: colors[i % colors.length] }}>{item.count}</p>
                </div>
               );
            })}
          </div>
        </div>

        {/* Column 3: Suspicious IPs */}
        <div className="glass-card p-6 rounded-xl">
          <h4 className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest mb-4">Suspicious IPs</h4>
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] text-[var(--vault-on-surface-variant)] uppercase font-bold border-b border-white/5">
                  <th className="pb-2">IP Address</th>
                  <th className="pb-2 text-right">Attempts</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(data.suspicious_ips || []).map((row: any, i: number) => (
                  <tr key={i} className="group hover:bg-white/5 transition-all">
                    <td className="py-3 text-sm font-medium text-[var(--vault-on-surface)]">{row.ip}</td>
                    <td className={`py-3 text-sm text-right font-bold ${row.status === 'error' ? 'text-red-400' : 'text-[var(--vault-tertiary)]'}`}>{row.attempts}</td>
                    <td className="py-3 text-right">
                      <button className="text-[var(--vault-primary)] hover:underline text-xs font-bold uppercase tracking-wider">
                        {row.status === 'error' ? 'BLOCK' : 'WATCH'}
                      </button>
                    </td>
                  </tr>
                ))}
                {(data.suspicious_ips || []).length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-[var(--vault-on-surface-variant)] text-xs">No active threats detected.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <button className="w-full mt-4 py-2 text-xs font-bold text-[var(--vault-primary)] hover:bg-[var(--vault-primary)]/5 rounded-lg transition-all uppercase tracking-widest">View All Threats</button>
        </div>
      </div>
    </>
  );
}
