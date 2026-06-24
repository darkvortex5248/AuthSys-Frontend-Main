'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';

export default function AdminUsersPage() {
  const confirm = useConfirm();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('admin');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminApi.get<any[]>('/admin/admins');
        setAdmins(res.data || []);
      } catch { /* maybe no endpoint yet */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleCreate = async () => {
    if (!newUsername.trim() || !newPassword.trim()) { toast.error('Username and password required'); return; }
    setSaving(true);
    try {
      await adminApi.post('/admin/admins', { username: newUsername, password: newPassword, role: newRole });
      toast.success('Admin user created');
      setShowModal(false);
      setNewUsername(''); setNewPassword(''); setNewRole('admin');
      const res = await adminApi.get<any[]>('/admin/admins');
      setAdmins(res.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create admin');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Delete admin?', message: 'This admin will lose access immediately.', confirmLabel: 'Delete', cancelLabel: 'Cancel', variant: 'danger' });
    if (!ok) return;
    try {
      await adminApi.delete(`/admin/admins/${id}`);
      toast.success('Admin deleted');
      setAdmins(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete admin');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Admin Users</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Manage platform administrator accounts</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[#131313] font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-[var(--primary)]/20">
          <span className="material-symbols-outlined text-sm">add</span>
          Create Admin
        </button>
      </div>

      <div className="glass-card rounded-xl">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">ID</th>
              <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Username</th>
              <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Role</th>
              <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Last Login</th>
              <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Created</th>
              <th className="px-6 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {admins.map((a: any) => (
              <tr key={a.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4"><span className="text-xs font-mono text-[var(--primary)]">{a.id}</span></td>
                <td className="px-6 py-4"><span className="text-sm font-bold text-[var(--foreground)]">{a.username}</span></td>
                <td className="px-6 py-4"><span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-[var(--primary)]/10 text-[var(--primary)]">{a.role || 'admin'}</span></td>
                <td className="px-6 py-4"><span className="text-xs text-[var(--muted-foreground)]">{a.last_login ? new Date(a.last_login).toLocaleString() : '—'}</span></td>
                <td className="px-6 py-4"><span className="text-xs text-[var(--muted-foreground)]">{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</span></td>
                <td className="px-6 py-4">
                  <button onClick={() => handleDelete(a.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 hover:bg-red-500/20 transition-all">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-20 text-center text-[var(--muted-foreground)] text-sm italic">No admin users found.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md bg-[var(--card)] border border-white/10 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">Create Admin User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Username</label>
                <input value={newUsername} onChange={e => setNewUsername(e.target.value)}
                  className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-[var(--foreground)]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-[var(--foreground)]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)}
                  className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-[var(--foreground)]">
                  <option value="admin" className="bg-[#0b0e15]">Admin</option>
                  <option value="superadmin" className="bg-[#0b0e15]">Super Admin</option>
                  <option value="support" className="bg-[#0b0e15]">Support</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-[#131313] font-bold text-xs uppercase tracking-widest disabled:opacity-50">
                {saving ? 'Creating...' : 'Create'}
              </button>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-xs uppercase tracking-widest text-[var(--foreground)]">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
