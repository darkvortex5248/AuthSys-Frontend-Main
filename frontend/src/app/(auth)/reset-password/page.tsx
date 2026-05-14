'use client';
import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const code = searchParams.get('code') || '';
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/developer/auth/reset-password', {
        email,
        code,
        new_password: formData.password
      });
      toast.success('Password reset successfully');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 items-center text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--vault-primary)]/10 flex items-center justify-center mb-2 border border-[var(--vault-primary)]/20">
          <span className="material-symbols-outlined text-[var(--vault-primary)] text-[32px]">password</span>
        </div>
        <h1 className="text-3xl font-bold text-[var(--vault-on-surface)]">Set new password</h1>
        <p className="text-[var(--vault-on-surface-variant)]">Please choose a strong password to secure your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-[0.2em] px-1" htmlFor="password">New Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-[20px]">lock</span>
              <input 
                className="glass-input w-full h-[48px] pl-12 pr-4 rounded-lg text-[var(--vault-on-surface)] placeholder:text-white/10"
                id="password" 
                placeholder="••••••••" 
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-[0.2em] px-1" htmlFor="confirmPassword">Confirm Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-[20px]">lock</span>
              <input 
                className="glass-input w-full h-[48px] pl-12 pr-4 rounded-lg text-[var(--vault-on-surface)] placeholder:text-white/10"
                id="confirmPassword" 
                placeholder="••••••••" 
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
            </div>
          </div>
        </div>

        <button 
          className="vault-primary-button w-full h-[52px] rounded-lg text-white font-bold text-sm tracking-wide disabled:opacity-50" 
          type="submit"
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[var(--vault-primary)]"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
