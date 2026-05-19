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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Calculate password strength
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
    <div className="w-full max-w-[440px] bg-[#1a1a1a] rounded-xl border border-white/5 p-10 shadow-2xl transition-all duration-300">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-[#d97757] flex items-center justify-center mb-4 shadow-[0_0_12px_rgba(217,119,87,0.13)]">
          <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V20C17 21.1046 16.1046 22 15 22H9C7.89543 22 7 21.1046 7 20V4Z" stroke="#541400" strokeWidth="2"></path>
            <path d="M7 8H17" stroke="#541400" strokeWidth="2"></path>
            <path d="M7 16H17" stroke="#541400" strokeWidth="2"></path>
          </svg>
        </div>
        <h1 className="text-[20px] font-semibold leading-[28px] tracking-[-0.01em] text-[#e5e2e1] mb-2">Create new password</h1>
        <p className="text-[13.5px] font-normal leading-[20px] text-[#dbc1b9] text-center">Your new password must be different from previous passwords.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10.5px] font-medium leading-[16px] tracking-[0.07em] text-[#dbc1b9] block uppercase px-1">New Password</label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#dbc1b9] text-[18px]">lock</span>
            <input 
              className="w-full h-[42px] bg-[#212121] border border-white/5 rounded-lg pl-10 pr-10 text-[13.5px] focus:outline-none focus:border-[#d97757] focus:ring-0 transition-all placeholder-[#3a3a4a] text-[#e5e2e1]" 
              id="new-password" 
              placeholder="Enter new password" 
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#dbc1b9] hover:text-[#ffb59e] transition-colors focus:outline-none" 
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
                  className={`h-1 rounded-[2px] flex-grow transition-colors duration-300 ${
                    score >= level 
                      ? score <= 2 
                        ? 'bg-[#ffb4ab]' 
                        : score <= 4 
                          ? 'bg-[#ffb59e]' 
                          : 'bg-[#5edac7]'
                      : 'bg-white/10'
                  }`}
                ></div>
              ))}
            </div>
            <span className={`text-[11px] font-medium ${
              score === 0 ? 'text-[#dbc1b9]' : 
              score <= 2 ? 'text-[#ffb4ab]' : 
              score <= 4 ? 'text-[#ffb59e]' : 'text-[#5edac7]'
            }`}>
              {score === 0 ? "Security strength" : 
               score <= 2 ? "Weak password" : 
               score <= 4 ? "Good password" : "Strong password"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10.5px] font-medium leading-[16px] tracking-[0.07em] text-[#dbc1b9] block uppercase px-1">Confirm New Password</label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#dbc1b9] text-[18px]">lock</span>
            <input 
              className="w-full h-[42px] bg-[#212121] border border-white/5 rounded-lg pl-10 pr-10 text-[13.5px] focus:outline-none focus:border-[#d97757] focus:ring-0 transition-all placeholder-[#3a3a4a] text-[#e5e2e1]" 
              id="confirm-password" 
              placeholder="Repeat new password" 
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
            />
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#dbc1b9] hover:text-[#ffb59e] transition-colors focus:outline-none" 
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <span className="material-symbols-outlined text-[18px]">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
        </div>

        <button 
          className="w-full h-[42px] bg-[#d97757] text-[#5c1902] font-medium text-[13.5px] rounded-lg hover:bg-[#c4664a] active:scale-[0.98] transition-all shadow-[0_0_12px_rgba(217,119,87,0.13)] disabled:opacity-50 flex items-center justify-center gap-2" 
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
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[#dbc1b9] hover:text-[#ffb59e] transition-colors text-[13.5px] group">
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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[var(--vault-primary)]"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
