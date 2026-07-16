'use client';
import { useEffect, useState, useCallback } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'active', label: 'Active' },
  { value: 'inactive_30d', label: 'Inactive 30d' },
  { value: 'inactive_90d', label: 'Inactive 90d' },
  { value: 'shadow', label: 'Shadow' },
  { value: 'orphaned', label: 'Orphaned' },
];

export default function EndUsersPage() {
  const confirm = useConfirm();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [categorizing, setCategorizing] = useState(false);
  const [showPurge, setShowPurge] = useState(false);
  const [purgeDays, setPurgeDays] = useState(365);
  const [purgeCategory, setPurgeCategory] = useState('orphaned');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [activity, setActivity] = useState<any[] | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const perPage = 50;

  const fetch = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const res = await adminApi.get<{ items: any[]; total: number }>(`/admin/end-users?${params}`);
      setUsers(res.data.items || []);
      setTotal(res.data.total || 0);
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load end users');
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => { fetch(); }, [fetch]);

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

  const handleCategorize = async () => {
    setCategorizing(true);
    try {
      const res = await adminApi.post<{ categorized: number }>('/admin/end-users/categorize');
      toast.success(`Categorized ${res.data.categorized} users`);
      fetch();
    } catch { toast.error('Failed to categorize'); }
    finally { setCategorizing(false); }
  };

  const handlePurge = async (dryRun: boolean) => {
    try {
      const params = new URLSearchParams({ older_than_days: String(purgeDays), dry_run: String(dryRun) });
      if (purgeCategory) params.set('category', purgeCategory);
      const res = await adminApi.post<{ purge_count: number }>(`/admin/end-users/purge?${params}`);
      if (dryRun) {
        toast.message(`Dry run: ${res.data.purge_count} users would be purged`);
      } else {
        toast.success(`Purged ${res.data.purge_count} users`);
        setShowPurge(false);
        fetch();
      }
    } catch { toast.error('Failed to purge'); }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map(u => u.id)));
    }
  };

  const handleBulkBan = async (banned: boolean) => {
    const label = banned ? 'unban' : 'ban';
    const ok = await confirm({
      title: `${banned ? 'Unban' : 'Ban'} ${selectedIds.size} users?`,
      message: `This will ${banned ? 'unban' : 'ban'} ${selectedIds.size} selected users.`,
      confirmLabel: banned ? 'Unban All' : 'Ban All',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminApi.post(`/admin/end-users/bulk/${label}`, Array.from(selectedIds));
      toast.success(`${banned ? 'Unbanned' : 'Banned'} ${selectedIds.size} users`);
      setSelectedIds(new Set());
      fetch();
    } catch { toast.error('Bulk operation failed'); }
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: `Delete ${selectedIds.size} users?`,
      message: `This will permanently delete ${selectedIds.size} selected users. This cannot be undone.`,
      confirmLabel: 'Delete All',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminApi.post('/admin/end-users/bulk/delete', Array.from(selectedIds));
      toast.success(`Deleted ${selectedIds.size} users`);
      setSelectedIds(new Set());
      fetch();
    } catch { toast.error('Bulk delete failed'); }
  };

  const viewUser = async (u: any) => {
    setSelectedUser(u);
    setActivity(null);
    setActivityLoading(true);
    try {
      const res = await adminApi.get<any[]>(`/admin/end-users/${u.id}/activity`);
      setActivity(res.data || []);
    } catch { setActivity([]); }
    finally { setActivityLoading(false); }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Username', 'Email', 'App', 'Category', 'Status', 'IP', 'Last Seen', 'Created'];
    const rows = users.map((u: any) => [
      u.id, u.username, u.email || '', u.app_name || u.app_id || '',
      u.user_category || 'active', u.is_banned ? 'Banned' : 'Active',
      u.ip_address || '', u.last_seen ? new Date(u.last_seen).toLocaleString() : '',
      u.created_at ? new Date(u.created_at).toLocaleString() : '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `end-users-page-${page}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / perPage);

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
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--muted-foreground)] hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            CSV
          </button>
          <button onClick={handleCategorize} disabled={categorizing}
            className="px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">category</span>
            {categorizing ? 'Categorizing...' : 'Categorize'}
          </button>
          <button onClick={() => setShowPurge(true)}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">cleaning_services</span>
            Purge
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-sm">search</span>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)]"
            placeholder="Search by username, email, or HWID..." />
        </div>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]">
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <span className="text-xs text-[var(--muted-foreground)]">{total} users</span>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <span className="text-sm text-blue-400 font-bold">{selectedIds.size} selected</span>
          <button onClick={() => handleBulkBan(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20">Unban All</button>
          <button onClick={() => handleBulkBan(false)}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold hover:bg-red-500/20">Ban All</button>
          <button onClick={handleBulkDelete}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/30">Delete All</button>
          <button onClick={() => setSelectedIds(new Set())}
            className="px-3 py-1.5 rounded-lg bg-white/5 text-[var(--muted-foreground)] text-[10px] font-bold hover:bg-white/10 ml-auto">Clear</button>
        </div>
      )}

      <div className="glass-card rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-4 py-4 w-10">
                  <input type="checkbox" checked={selectedIds.size === users.length && users.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-white/20 text-primary cursor-pointer" />
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Username</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">App</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Joined</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u: any) => (
                <tr key={u.id} className={`hover:bg-white/5 transition-colors group ${selectedIds.has(u.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-4 py-4">
                    <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)}
                      className="w-4 h-4 rounded border-white/20 text-primary cursor-pointer" />
                  </td>
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
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      u.user_category === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                      u.user_category === 'inactive_30d' ? 'bg-amber-500/10 text-amber-400' :
                      u.user_category === 'inactive_90d' ? 'bg-orange-500/10 text-orange-400' :
                      u.user_category === 'shadow' ? 'bg-purple-500/10 text-purple-400' :
                      u.user_category === 'orphaned' ? 'bg-red-500/10 text-red-400' :
                      'bg-gray-500/10 text-gray-400'
                    }`}>
                      {u.user_category?.replace('_', ' ') || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      u.is_banned ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {u.is_banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-[var(--muted-foreground)]">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => viewUser(u)}
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
              {users.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center text-[var(--muted-foreground)] text-sm italic">No end users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
            <span className="text-xs text-[var(--muted-foreground)]">{total} total users</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold disabled:opacity-30">Previous</button>
              <span className="px-3 py-1.5 text-xs text-[var(--muted-foreground)]">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[var(--card)] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-8 pb-4 border-b border-white/5">
              <h2 className="text-xl font-bold text-[var(--foreground)]">{selectedUser.username}</h2>
              <button onClick={() => setSelectedUser(null)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="overflow-y-auto p-8 pt-4 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'User ID', value: selectedUser.id },
                  { label: 'Email', value: selectedUser.email || '—' },
                  { label: 'App', value: selectedUser.app_name || selectedUser.app_id || '—' },
                  { label: 'Category', value: selectedUser.user_category?.replace('_', ' ') || 'active' },
                  { label: 'Status', value: selectedUser.is_banned ? 'Banned' : 'Active' },
                  { label: 'IP', value: selectedUser.ip_address || '—' },
                  { label: 'Last Seen', value: selectedUser.last_seen ? new Date(selectedUser.last_seen).toLocaleString() : '—' },
                  { label: 'Created', value: selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : '—' },
                ].map(f => (
                  <div key={f.label} className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                    <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">{f.label}</span>
                    <span className="text-sm font-mono text-[var(--foreground)]">{f.value}</span>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-black text-[var(--foreground)] mb-3 flex items-center gap-2 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-[var(--primary)] text-lg">history</span>
                  Activity Log
                </h3>
                {activityLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
                  </div>
                ) : activity && activity.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {activity.map((log: any) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          log.is_suspicious ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          <span className="material-symbols-outlined text-sm">{log.is_suspicious ? 'warning' : 'check_circle'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[var(--foreground)] capitalize">{log.action_type?.replace(/_/g, ' ')}</p>
                          <p className="text-[10px] text-[var(--muted-foreground)]">
                            {log.details ? JSON.stringify(log.details).substring(0, 80) : ''}
                            {log.ip_address ? ` · ${log.ip_address}` : ''}
                            {log.country ? ` · ${log.country}` : ''}
                          </p>
                          <p className="text-[10px] text-[var(--muted-foreground)] opacity-60">
                            {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--muted-foreground)] italic">No activity recorded for this user.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPurge && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md bg-[var(--card)] border border-white/10 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Purge End Users</h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">Remove old/inactive end users from the database.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Older than (days)</label>
                <input type="number" value={purgeDays} onChange={e => setPurgeDays(Number(e.target.value))} min={1}
                  className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-[var(--foreground)]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Category</label>
                <select value={purgeCategory} onChange={e => setPurgeCategory(e.target.value)}
                  className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-[var(--foreground)]">
                  <option value="">All categories</option>
                  {CATEGORIES.filter(c => c.value).map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => handlePurge(true)}
                className="flex-1 px-6 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-widest hover:bg-blue-500/20">
                Dry Run
              </button>
              <button onClick={() => handlePurge(false)}
                className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-red-600">
                Purge
              </button>
              <button onClick={() => setShowPurge(false)}
                className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-xs uppercase tracking-widest text-[var(--foreground)]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
