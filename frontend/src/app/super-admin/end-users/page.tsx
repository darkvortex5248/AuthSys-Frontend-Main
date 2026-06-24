'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';

export default function EndUsersPage() {
  const confirm = useConfirm();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminApi.get<any[]>('/admin/end-users');
        setUsers(res.data || []);
      } catch (err: any) {
        toast.error(err.response?.data?.detail || 'Failed to load end users');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = users.filter((u: any) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.hwid?.toLowerCase().includes(search.toLowerCase())
  );

  const handleBan = async (id: number, banned: boolean) => {
    const ok = await confirm({
      title: banned ? 'Unban user?' : 'Ban user?',
      message: banned ? 'This user will be able to access the platform again.' : 'This user will lose access to all applications.',
      confirmLabel: banned ? 'Unban' : 'Ban',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminApi.post(`/admin/end-users/${id}/${banned ? 'unban' : 'ban'}`);
      toast.success(`User ${banned ? 'unbanned' : 'banned'}`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_banned: !banned } : u));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update user');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">End User Management</h1>
          <p className="text-[var(--muted-foreground)] mt-1">View and manage all end users across the platform</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-sm">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-[var(--card)]/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)]"
            placeholder="Search by username, email, or HWID..." />
        </div>
      </div>

      <div className="glass-card rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Username</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">App</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">HWID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Joined</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((u: any) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-[var(--primary)]">{u.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[var(--foreground)]">{u.username}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[var(--muted-foreground)]">{u.email || '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-[var(--foreground)]">{u.app_name || u.app_id || '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-[var(--muted-foreground)] truncate max-w-[120px] block">
                      {u.hwid ? `${u.hwid.substring(0, 12)}...` : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      u.is_banned
                        ? 'bg-red-500/10 text-red-400'
                        : u.is_verified
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {u.is_banned ? 'Banned' : u.is_verified ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-[var(--muted-foreground)]">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedUser(u)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-[var(--foreground)] hover:bg-white/10 transition-all">View</button>
                      <button onClick={() => handleBan(u.id, u.is_banned)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          u.is_banned
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        }`}>
                        {u.is_banned ? 'Unban' : 'Ban'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-[var(--muted-foreground)] text-sm italic">No end users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[var(--card)] border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--foreground)]">{selectedUser.username}</h2>
              <button onClick={() => setSelectedUser(null)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'User ID', value: selectedUser.id },
                { label: 'Email', value: selectedUser.email || '—' },
                { label: 'App', value: selectedUser.app_name || selectedUser.app_id || '—' },
                { label: 'HWID', value: selectedUser.hwid || '—' },
                { label: 'Status', value: selectedUser.is_banned ? 'Banned' : selectedUser.is_verified ? 'Active' : 'Pending' },
                { label: 'IP', value: selectedUser.ip_address || selectedUser.last_ip || '—' },
                { label: 'Last Seen', value: selectedUser.last_seen ? new Date(selectedUser.last_seen).toLocaleString() : '—' },
                { label: 'Created', value: selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : '—' },
              ].map(f => (
                <div key={f.label} className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                  <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">{f.label}</span>
                  <span className="text-sm font-mono text-[var(--foreground)]">{f.value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedUser(null)} className="w-full mt-6 py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-xs uppercase tracking-widest text-[var(--foreground)]">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
