'use client';
import { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
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
        new_password: formData.password,
      });
      toast.success('Password reset successfully');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const calculateStrength = (password: string) => {
    let score = 0;
    if (password.length > 0) score++;
    if (password.length > 8) score++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (password.length > 12) score++;
    return score;
  };

  const score = calculateStrength(formData.password);

  return (
    <div className="w-full max-w-[440px] bg-[var(--card)] rounded-xl border border-white/5 p-10 shadow-2xl transition-all duration-300">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center mb-4 shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_13%,transparent)]">
          <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V20C17 21.1046 16.1046 22 15 22H9C7.89543 22 7 21.1046 7 20V4Z" stroke="black" strokeWidth="2"></path>
            <path d="M7 8H17" stroke="black" strokeWidth="2"></path>
            <path d="M7 16H17" stroke="black" strokeWidth="2"></path>
          </svg>
        </div>
        <h1 className="text-[20px] font-semibold leading-[28px] tracking-[-0.01em] text-[#ffffff] mb-2">Create new password</h1>
        <p className="text-[13.5px] font-normal leading-[20px] text-[#a1a1aa] text-center">Your new password must be different from previous passwords.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10.5px] font-medium leading-[16px] tracking-[0.07em] text-[#a1a1aa] block uppercase px-1">New Password</label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] text-[18px]">lock</span>
            <input 
              className="w-full h-[42px] bg-[var(--card)] border border-white/5 rounded-lg pl-10 pr-10 text-[13.5px] focus:outline-none focus:border-[var(--primary)] focus:ring-0 transition-all placeholder-[#3f3f46] text-[#ffffff]" 
              id="new-password" 
              placeholder="Enter new password" 
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#ffffff] transition-colors focus:outline-none" 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          <div className="pt-2 px-1">
            <div className="flex gap-1.5 mb-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div 
                  key={level} 
                  className={`h-1 rounded-xs flex-grow transition-colors duration-300 ${
                    score >= level 
                      ? score <= 2 
                        ? 'bg-[#ef4444]' 
                        : score <= 4 
                          ? 'bg-[var(--primary)]' 
                          : 'bg-[#10b981]'
                      : 'bg-white/10'
                  }`}
                ></div>
              ))}
            </div>
            <span className={`text-[11px] font-medium ${
              score === 0 ? 'text-[#a1a1aa]' : 
              score <= 2 ? 'text-[#ef4444]' : 
              score <= 4 ? 'text-[var(--primary)]' : 'text-[#10b981]'
            }`}>
              {score === 0 ? "Security strength" : 
               score <= 2 ? "Weak password" : 
               score <= 4 ? "Good password" : "Strong password"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10.5px] font-medium leading-[16px] tracking-[0.07em] text-[#a1a1aa] block uppercase px-1">Confirm New Password</label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] text-[18px]">lock</span>
            <input 
              className="w-full h-[42px] bg-[var(--card)] border border-white/5 rounded-lg pl-10 pr-10 text-[13.5px] focus:outline-none focus:border-[var(--primary)] focus:ring-0 transition-all placeholder-[#3f3f46] text-[#ffffff]" 
              id="confirm-password" 
              placeholder="Repeat new password" 
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
            />
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#ffffff] transition-colors focus:outline-none" 
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <span className="material-symbols-outlined text-[18px]">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
        </div>

        <button 
          className="w-full h-[42px] bg-[var(--primary)] text-black font-medium text-[13.5px] rounded-lg hover:bg-[var(--primary)] active:scale-[0.98] transition-all shadow-[0_4px_12px_color-mix(in_srgb,var(--primary)_20%,transparent)] hover:shadow-[0_6px_16px_color-mix(in_srgb,var(--primary)_30%,transparent)] disabled:opacity-50 flex items-center justify-center gap-2" 
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Resetting...</>
          ) : (
            <>Reset password</>
          )}
        </button>

        <div className="text-center pt-2">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[var(--primary)] hover:text-[var(--primary)] transition-colors text-[13.5px] group">
            <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            Back to sign in
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[var(--primary)]"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}