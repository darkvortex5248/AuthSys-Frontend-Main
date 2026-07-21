'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';

type DeviceGroup = {
  id: number;
  name: string;
  group_secret: string;
  is_active: boolean;
  max_devices: number;
  device_count: number;
  created_at: string | null;
};

export default function DeviceGroupsPage() {
  const confirm = useConfirm();
  const [groups, setGroups] = useState<DeviceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMaxDevices, setNewMaxDevices] = useState(50);
  const [creating, setCreating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get<DeviceGroup[]>('/developer/device-groups');
      setGroups(res.data || []);
    } catch {
      toast.error('Failed to load device groups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleCreate = async () => {
    if (!newName.trim()) return toast.error('Name is required');
    setCreating(true);
    try {
      await api.post('/developer/device-groups', { name: newName, max_devices: newMaxDevices });
      toast.success('Device group created');
      setShowCreate(false);
      setNewName('');
      setNewMaxDevices(50);
      fetchGroups();
    } catch {
      toast.error('Failed to create device group');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (group: DeviceGroup) => {
    if (!await confirm({ title: 'Delete device group?', message: `This will also remove all ${group.device_count} devices.`, confirmLabel: 'Delete', cancelLabel: 'Cancel', variant: 'danger' })) return;
    try {
      await api.delete(`/developer/device-groups/${group.id}`);
      toast.success('Device group deleted');
      fetchGroups();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleRegen = async (group: DeviceGroup) => {
    if (!await confirm({ title: 'Regenerate secret?', message: 'Existing devices using the old secret will stop working.', confirmLabel: 'Regenerate', cancelLabel: 'Cancel', variant: 'danger' })) return;
    try {
      await api.post(`/developer/device-groups/${group.id}/regenerate-secret`);
      toast.success('Secret regenerated');
      fetchGroups();
    } catch {
      toast.error('Failed to regenerate');
    }
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success('Copied');
  };

  if (loading || !mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-end">
          <div className="space-y-3">
            <div className="h-10 w-52 bg-[var(--accent-opacity-8)] rounded-xl" />
            <div className="h-4 w-72 bg-[var(--accent-opacity-8)] rounded-xl" />
          </div>
          <div className="h-10 w-36 bg-[var(--accent-opacity-8)] rounded-xl" />
        </div>
        <div className="h-80 bg-[var(--accent-opacity-8)] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Device Groups</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Create device groups for your EXEs — no login required</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-[#131313] text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Group
        </button>
      </div>

      {showCreate && (
        <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Group Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]/50 transition-all"
                placeholder="e.g. My Game EXE" />
            </div>
            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Max Devices</label>
              <input type="number" value={newMaxDevices} onChange={e => setNewMaxDevices(parseInt(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]/50 transition-all" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleCreate} disabled={creating}
                className="flex-1 px-4 py-2 rounded-xl bg-[var(--primary)] text-[#131313] text-xs font-black uppercase tracking-widest disabled:opacity-50">
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-white/40 text-xs font-black uppercase tracking-widest hover:text-white/70">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-white/20">devices</span>
          </div>
          <p className="text-[var(--foreground)] font-semibold">No device groups yet</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Create one to start protecting your EXEs</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
          <style>{`
            @keyframes rowIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
            .grp-row { animation:rowIn 0.3s ease-out both; }
          `}</style>
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Group Secret</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Devices</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Max</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {groups.map((group, i) => (
                <tr key={group.id} className="grp-row hover:bg-white/[0.02] transition-colors" style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-[var(--foreground)]">{group.name}</p>
                      <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Created {group.created_at ? new Date(group.created_at).toLocaleDateString() : '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-[var(--primary)] bg-[var(--primary)]/8 px-2 py-1 rounded-lg truncate max-w-[180px] block">
                        {group.group_secret.substring(0, 20)}...
                      </code>
                      <button onClick={() => copySecret(group.group_secret)}
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-[var(--primary)]/15 text-white/30 hover:text-[var(--primary)] transition-all">
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      group.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${group.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {group.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">{group.device_count}</td>
                  <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">{group.max_devices >= 999999 ? '∞' : group.max_devices}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => copySecret(group.group_secret)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[var(--muted-foreground)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--primary)]/15 hover:text-[var(--primary)] transition-all">
                        Copy Secret
                      </button>
                      <button onClick={() => handleRegen(group)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500/20 transition-all">
                        Regenerate
                      </button>
                      <button onClick={() => handleDelete(group)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all">
                        Delete
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
