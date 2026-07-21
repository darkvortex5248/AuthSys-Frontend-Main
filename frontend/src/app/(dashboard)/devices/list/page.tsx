'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';

type Device = {
  id: number;
  hwid: string;
  device_name: string | null;
  status: string;
  ban_reason: string | null;
  last_checkin_at: string | null;
  created_at: string | null;
};

type DeviceGroup = {
  id: number;
  name: string;
};

export default function DevicesListPage() {
  const confirm = useConfirm();
  const [groups, setGroups] = useState<DeviceGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get<DeviceGroup[]>('/developer/device-groups');
      setGroups(res.data || []);
      if (res.data?.length > 0 && !selectedGroupId) {
        setSelectedGroupId(res.data[0].id);
      }
    } catch { }
  }, [selectedGroupId]);

  const fetchDevices = useCallback(async () => {
    if (!selectedGroupId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get<Device[]>(`/developer/device-groups/${selectedGroupId}/devices`);
      setDevices(res.data || []);
    } catch {
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, [selectedGroupId]);

  useEffect(() => { fetchGroups(); }, []);
  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const handleAction = async (deviceId: number, action: string) => {
    setActionLoading(prev => new Set(prev).add(deviceId));
    try {
      if (action === 'remove') {
        if (!await confirm({ title: 'Remove device?', message: 'This will permanently remove this device.', confirmLabel: 'Remove', cancelLabel: 'Cancel', variant: 'danger' })) return;
      }
      const res = await api.post(`/developer/device-groups/${selectedGroupId}/devices/${deviceId}/${action}`);
      toast.success(`Device ${action === 'remove' ? 'removed' : res.data.new_status || action + 'd'}`);
      fetchDevices();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || `Failed to ${action} device`);
    } finally {
      setActionLoading(prev => { const next = new Set(prev); next.delete(deviceId); return next; });
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { cls: string; icon: string }> = {
      active: { cls: 'bg-emerald-500/20 text-emerald-400', icon: 'check_circle' },
      paused: { cls: 'bg-amber-500/20 text-amber-400', icon: 'pause_circle' },
      banned: { cls: 'bg-red-500/20 text-red-400', icon: 'block' },
      perma_banned: { cls: 'bg-red-500/20 text-red-400', icon: 'remove_circle' },
      whitelisted: { cls: 'bg-blue-500/20 text-blue-400', icon: 'verified' },
    };
    const c = config[status] || { cls: 'bg-white/10 text-[var(--muted-foreground)]', icon: 'help' };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${c.cls}`}>
        <span className="material-symbols-outlined text-[12px]">{c.icon}</span>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Devices</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Manage devices registered to your groups</p>
        </div>
        <select
          value={selectedGroupId ?? ''}
          onChange={e => setSelectedGroupId(parseInt(e.target.value))}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]/50"
        >
          {groups.length === 0 && <option value="">No groups</option>}
          {groups.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
      </div>

      {loading || !mounted ? (
        <div className="space-y-6 animate-pulse">
          <div className="flex justify-between items-end">
            <div className="space-y-3">
              <div className="h-10 w-52 bg-[var(--accent-opacity-8)] rounded-xl" />
              <div className="h-4 w-64 bg-[var(--accent-opacity-8)] rounded-xl" />
            </div>
            <div className="h-10 w-44 bg-[var(--accent-opacity-8)] rounded-xl" />
          </div>
          <div className="h-80 bg-[var(--accent-opacity-8)] rounded-2xl" />
        </div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-white/20">devices_other</span>
          </div>
          <p className="text-[var(--foreground)] font-semibold">No devices registered</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Launch your EXE with the group secret to register</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
          <style>{`
            @keyframes rowIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
            .dev-row { animation:rowIn 0.3s ease-out both; }
          `}</style>
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Device</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">HWID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Last Seen</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Registered</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {devices.map((device, i) => (
                <tr key={device.id} className="dev-row hover:bg-white/[0.02] transition-colors" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[var(--foreground)]">
                      {device.device_name || 'Unnamed Device'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs font-mono text-[var(--muted-foreground)] truncate max-w-[180px] block">
                      {device.hwid}
                    </code>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(device.status)}</td>
                  <td className="px-6 py-4 text-xs text-[var(--muted-foreground)]">
                    {device.last_checkin_at ? new Date(device.last_checkin_at).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-xs text-[var(--muted-foreground)]">
                    {device.created_at ? new Date(device.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5 flex-wrap max-w-[220px]">
                      {device.status === 'active' && (
                        <button onClick={() => handleAction(device.id, 'pause')}
                          className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold uppercase tracking-widest hover:bg-amber-500/20 transition-all">
                          Pause
                        </button>
                      )}
                      {device.status === 'paused' && (
                        <button onClick={() => handleAction(device.id, 'unpause')}
                          className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
                          Unpause
                        </button>
                      )}
                      {device.status !== 'banned' && device.status !== 'perma_banned' && (
                        <button onClick={() => handleAction(device.id, 'ban')}
                          className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all">
                          Ban
                        </button>
                      )}
                      {device.status === 'banned' && (
                        <button onClick={() => handleAction(device.id, 'unban')}
                          className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
                          Unban
                        </button>
                      )}
                      {device.status !== 'perma_banned' && (
                        <button onClick={() => handleAction(device.id, 'perma-ban')}
                          className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all">
                          Perma-Ban
                        </button>
                      )}
                      {device.status !== 'whitelisted' && (
                        <button onClick={() => handleAction(device.id, 'whitelist')}
                          className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[9px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-all">
                          Whitelist
                        </button>
                      )}
                      <button onClick={() => handleAction(device.id, 'remove')}
                        className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[var(--muted-foreground)] text-[9px] font-bold uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400 transition-all">
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
