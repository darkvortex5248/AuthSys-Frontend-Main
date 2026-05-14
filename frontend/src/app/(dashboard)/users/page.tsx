'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function UsersPage() {
  const { selectedAppId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [showBanModal, setShowBanModal] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<any>(null);
  const [banData, setBanData] = useState({ reason: 'Violation of terms', days: 0 });
  const [newUser, setNewUser] = useState({ username: '', password: '', email: '' });
  const [editData, setEditData] = useState({ username: '', email: '', password: '' });
  const [mounted, setMounted] = useState(false);

  const fetchUsers = async () => {
    if (!selectedAppId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/developer/users/${selectedAppId}`);
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (selectedAppId) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [selectedAppId]);

  const handleBan = async () => {
    if (!showBanModal) return;
    try {
      await api.post(`/developer/users/${showBanModal.id}/ban`, banData);
      setShowBanModal(null);
      fetchUsers();
    } catch (err) {
      alert("Failed to ban user");
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return;
    try {
      await api.post('/developer/users/create', { ...newUser, app_id: selectedAppId });
      setShowAddModal(false);
      setNewUser({ username: '', password: '', email: '' });
      fetchUsers();
    } catch (err) {
      alert("Failed to create user. Username might be taken.");
    }
  };

  const handleUnban = async (id: number) => {
    try {
      await api.post(`/developer/users/${id}/unban`);
      fetchUsers();
    } catch (err) {
      alert("Failed to unban user");
    }
  };

  const handleHWIDReset = async (id: number) => {
    if (!confirm("Reset HWID for this user?")) return;
    try {
      await api.post(`/developer/users/${id}/hwid-reset`);
      alert("HWID Reset Successful");
      fetchUsers();
    } catch (err) {
      alert("Failed to reset HWID");
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    try {
      const payload: any = { username: editData.username, email: editData.email };
      if (editData.password) payload.password = editData.password;
      await api.put(`/developer/users/${showEditModal.id}`, payload);
      setShowEditModal(null);
      fetchUsers();
    } catch (err) {
      alert("Failed to update user");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user permanently?")) return;
    try {
      await api.delete(`/developer/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  if (!mounted) return null;

  if (!selectedAppId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-[var(--vault-on-surface-variant)]">
        <span className="material-symbols-outlined text-6xl mb-4 opacity-20">apps</span>
        <p className="text-xl font-bold">Please select an application first</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="text-4xl font-bold text-[var(--vault-on-surface)] mb-2">User Management</h2>
          <p className="text-[var(--vault-on-surface-variant)] font-medium">Managing users for App ID: {selectedAppId}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[var(--vault-primary)] text-[var(--vault-on-primary)] px-6 py-3 rounded-xl font-bold shadow-lg shadow-[var(--vault-primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs uppercase tracking-widest"
        >
          <span className="material-symbols-outlined">person_add</span>
          Add Manual User
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Users', val: users.length, icon: 'groups', color: 'var(--vault-primary)' },
          { label: 'Banned', val: users.filter(u => u.is_banned).length, icon: 'block', color: 'red-400' },
          { label: 'Active Sessions', val: users.filter(u => u.last_login_at).length, icon: 'bolt', color: '#34d399' },
          { label: 'HWID Locked', val: users.filter(u => u.hwid).length, icon: 'devices', color: 'var(--vault-tertiary)' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
            </div>
            <p className="text-[10px] text-[var(--vault-on-surface-variant)] mb-1 uppercase tracking-widest font-bold">{stat.label}</p>
            <h3 className="text-4xl font-bold text-[var(--vault-on-surface)] leading-none">{stat.val}</h3>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h3 className="text-lg font-bold text-[var(--vault-on-surface)]">User Directory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                {['User', 'Status', 'IP Address', 'Last Login', 'Actions'].map((h, i) => (
                  <th key={h} className={`px-8 py-4 text-[10px] text-[var(--vault-on-surface-variant)] uppercase tracking-widest font-bold border-b border-white/5 ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {users.map((user, i) => (
                <tr key={i} className={`hover:bg-white/[0.02] transition-colors group ${user.is_banned ? 'opacity-60' : ''}`}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center font-bold text-xs uppercase">
                        {user.username.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--vault-on-surface)] group-hover:text-[var(--vault-primary)] transition-colors">{user.username}</p>
                        <p className="text-xs text-[var(--vault-on-surface-variant)]">{user.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: user.is_banned ? 'red' : '#34d399' }}></div>
                      <span className="text-xs font-bold text-[var(--vault-on-surface)]">{user.is_banned ? 'Banned' : 'Active'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-xs text-[var(--vault-on-surface-variant)] font-mono">{user.last_ip || user.ip_address || 'N/A'}</td>
                  <td className="px-8 py-5 text-xs text-[var(--vault-on-surface-variant)] font-medium">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleHWIDReset(user.id)}
                        title="Reset HWID"
                        className="p-2 text-[var(--vault-on-surface-variant)] hover:text-[var(--vault-primary)] hover:bg-[var(--vault-primary)]/5 rounded-lg transition-all flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                      </button>
                      <button 
                        onClick={() => {
                          setShowEditModal(user);
                          setEditData({ username: user.username, email: user.email || '', password: '' });
                        }}
                        title="Edit User"
                        className="p-2 text-[var(--vault-on-surface-variant)] hover:text-blue-400 hover:bg-blue-400/5 rounded-lg transition-all"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete User"
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                      {user.is_banned ? (
                        <button 
                          onClick={() => handleUnban(user.id)}
                          title="Unban"
                          className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all"
                        >
                          <span className="material-symbols-outlined text-[20px]">check_circle</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => setShowBanModal(user)}
                          title="Ban"
                          className="p-2 text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
                        >
                          <span className="material-symbols-outlined text-[20px]">block</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-8 py-10 text-center text-[var(--vault-on-surface-variant)] text-sm">No users found for this application.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[var(--vault-surface)]/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-xl font-bold text-[var(--vault-on-surface)]">Add Manual User</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--vault-on-surface-variant)] hover:text-red-400 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Username</label>
                <input 
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm" 
                  placeholder="Enter username" required
                  value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Initial Password</label>
                <input 
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm" 
                  type="password" placeholder="Enter password" required
                  value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Email (Optional)</label>
                <input 
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm" 
                  type="email" placeholder="Enter email"
                  value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl border border-white/5 font-bold text-xs uppercase">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-[var(--vault-primary)] text-[var(--vault-on-primary)] font-bold text-xs uppercase">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[var(--vault-surface)]/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-xl font-bold text-[var(--vault-on-surface)]">Edit User: {showEditModal.username}</h3>
              <button onClick={() => setShowEditModal(null)} className="text-[var(--vault-on-surface-variant)] hover:text-red-400 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditUser} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Username</label>
                <input 
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm" 
                  placeholder="Enter username" required
                  value={editData.username} onChange={(e) => setEditData({...editData, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">New Password (Leave blank to keep same)</label>
                <input 
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm" 
                  type="password" placeholder="Enter new password"
                  value={editData.password} onChange={(e) => setEditData({...editData, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Email</label>
                <input 
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm" 
                  type="email" placeholder="Enter email"
                  value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowEditModal(null)} className="flex-1 py-3 rounded-xl border border-white/5 font-bold text-xs uppercase">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-[var(--vault-primary)] text-[var(--vault-on-primary)] font-bold text-xs uppercase">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[var(--vault-surface)]/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-xl font-bold text-red-400">Ban User: {showBanModal.username}</h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Reason</label>
                <input 
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm" 
                  value={banData.reason} onChange={(e) => setBanData({...banData, reason: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Duration (Days, 0 = Permanent)</label>
                <input 
                  type="number"
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm" 
                  value={banData.days} onChange={(e) => setBanData({...banData, days: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowBanModal(null)} className="flex-1 py-3 rounded-xl border border-white/5 font-bold text-xs uppercase">Cancel</button>
                <button onClick={handleBan} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-xs uppercase">Confirm Ban</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
