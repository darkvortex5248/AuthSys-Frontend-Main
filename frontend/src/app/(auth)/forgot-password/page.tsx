'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/developer/auth/forgot-password', { email });
      toast.success('Reset code sent to ' + email);
      router.push(`/verify-email?email=${encodeURIComponent(email)}&purpose=password_reset`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 items-center text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--vault-primary)]/10 flex items-center justify-center mb-2 border border-[var(--vault-primary)]/20">
          <span className="material-symbols-outlined text-[var(--vault-primary)] text-[32px]">lock_reset</span>
        </div>
        <h1 className="text-3xl font-bold text-[var(--vault-on-surface)]">Reset your password</h1>
        <p className="text-[var(--vault-on-surface-variant)]">Enter your email address and we'll send you a link to reset your password.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-[0.2em] px-1" htmlFor="email">Email Address</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-[20px]">mail</span>
            <input 
              className="glass-input w-full h-[48px] pl-12 pr-4 rounded-lg text-[var(--vault-on-surface)] placeholder:text-white/10"
              id="email" 
              placeholder="name@company.com" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <button 
          className="vault-primary-button w-full h-[52px] rounded-lg text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 group"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : (
            <>
              <span>Send Reset Link</span>
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">arrow_forward</span>
            </>
          )}
        </button>
      </form>

      <div className="flex flex-col gap-6 items-center">
        <div className="w-full h-[1px] bg-white/5"></div>
        <Link href="/login" className="text-sm font-medium text-[var(--vault-on-surface-variant)] hover:text-[var(--vault-primary)] flex items-center gap-2 transition-colors duration-200">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Log in
        </Link>
      </div>
    </>
  );
}
