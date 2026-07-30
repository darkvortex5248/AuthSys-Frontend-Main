'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function AdminChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      router.push('/super-admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shadow-2xl border border-[var(--primary)]/20 mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl text-[var(--primary)]">lock_reset</span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2 tracking-tight">Change Password</h1>
          <p className="text-[var(--muted-foreground)] text-sm">You must change your password before continuing.</p>
        </div>

        <div className="bg-[var(--card)]/60 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-3 px-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-[background-color,box-shadow,border-color] duration-200 ease-out"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-3 px-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-[background-color,box-shadow,border-color] duration-200 ease-out"
                placeholder="At least 8 characters"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-3 px-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-[background-color,box-shadow,border-color] duration-200 ease-out"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-[#93000a]/10 border border-[#93000a]/20 text-[#ffb4ab] text-xs py-3 px-4 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--primary)] text-white font-bold py-4 rounded-xl shadow-xl shadow-[var(--primary)]/10 hover:brightness-105 active:brightness-95 transition-[background-color,box-shadow,border-color] duration-200 ease-out flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  Change Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
