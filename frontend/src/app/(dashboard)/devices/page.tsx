'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';

type Device = {
  id: number;
  hwid: string;
  device_name: string | null;
  is_active: boolean;
  last_checkin_at: string | null;
  notes: string | null;
  created_at: string | null;
};

export default function DevicesPage() {
  const confirm = useConfirm();
  const { selectedAppId } = useAuthStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const fetchDevices = useCallback(async () => {
    if (!selectedAppId) { setLoading(false); return; }
    try {
      const res = await api.get<{ devices: Device[] }>(`/developer/devices/${selectedAppId}`);
      setDevices(res.data.devices || []);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, [selectedAppId]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const handleToggle = async (device: Device) => {
    setTogglingIds((prev) => new Set(prev).add(device.id));
    try {
      const res = await api.post<{ is_active: boolean }>(
        `/developer/devices/${selectedAppId}/${device.id}/toggle`
      );
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, is_active: res.data.is_active } : d))
      );
      toast.success(res.data.is_active ? 'Device enabled' : 'Device disabled');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to toggle device');
    } finally {
      setTogglingIds((prev) => { const next = new Set(prev); next.delete(device.id); return next; });
    }
  };

  const handleDelete = async (device: Device) => {
    const ok = await confirm({
      title: 'Remove device?',
      message: `This will permanently remove ${device.device_name || device.hwid} from your app.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/developer/devices/${selectedAppId}/${device.id}`);
      setDevices((prev) => prev.filter((d) => d.id !== device.id));
      toast.success('Device removed');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete device');
    }
  };

  const activeCount = devices.filter((d) => d.is_active).length;
  const disabledCount = devices.filter((d) => !d.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Devices</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Remote activation control for desktop applications
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {activeCount} Active
        </div>
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          {disabledCount} Disabled
        </div>
        <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--muted-foreground)] text-sm font-bold">
          {devices.length} Total
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
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
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-[var(--muted-foreground)]">
                    No devices registered yet. Launch your EXE to register the first device.
                  </td>
                </tr>
              ) : (
                devices.map((device) => (
                  <tr key={device.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-[var(--foreground)]">
                        {device.device_name || 'Unnamed Device'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-[var(--muted-foreground)] truncate max-w-[200px] block">
                        {device.hwid}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        device.is_active
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${device.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {device.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {device.last_checkin_at
                          ? new Date(device.last_checkin_at).toLocaleString()
                          : 'Never'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {device.created_at
                          ? new Date(device.created_at).toLocaleDateString()
                          : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggle(device)}
                          disabled={togglingIds.has(device.id)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${
                            device.is_active
                              ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {togglingIds.has(device.id)
                            ? '...'
                            : device.is_active
                              ? 'Disable'
                              : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDelete(device)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[var(--muted-foreground)] text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
