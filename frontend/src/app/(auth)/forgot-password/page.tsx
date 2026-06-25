'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/developer/auth/forgot-password', { email });
      toast.success('Reset code sent to ' + email);
      window.location.href = `/verify-email?email=${encodeURIComponent(email)}&purpose=password_reset`;
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] bg-[var(--card)] p-[24px] rounded-xl border border-white/5 flex flex-col items-center transition-all duration-300 hover:border-white/10 shadow-2xl">
      <div className="w-12 h-12 bg-[var(--card)] border border-white/5 rounded-lg flex items-center justify-center mb-6">
        <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V20C17 21.1046 16.1046 22 15 22H9C7.89543 22 7 21.1046 7 20V4Z" stroke="var(--primary)" strokeWidth="2"></path>
          <path d="M7 8H17" stroke="var(--primary)" strokeWidth="2"></path>
          <path d="M7 16H17" stroke="var(--primary)" strokeWidth="2"></path>
        </svg>
      </div>
      
      <div className="text-center mb-8">
        <h1 className="text-[20px] font-semibold leading-[28px] tracking-[-0.01em] text-[#ffffff] mb-2">Reset password</h1>
        <p className="text-[13.5px] font-normal leading-[20px] text-[#a1a1aa] max-w-[320px] mx-auto">
          Enter your email address and we'll send you a code to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div className="space-y-2">
          <label className="text-[10.5px] font-medium leading-[16px] tracking-[0.07em] text-[#a1a1aa] block uppercase">Email Address</label>
          <div className="relative group rounded focus-within:shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_13%,transparent)] transition-all">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-[18px] text-[#a1a1aa] group-focus-within:text-[var(--primary)] transition-colors">mail</span>
            </div>
            <input 
              className="w-full h-[42px] bg-[var(--card)] border border-[rgba(255,255,255,0.05)] rounded text-[13.5px] text-[#ffffff] placeholder-[#3f3f46] pl-10 focus:ring-0 focus:outline-none focus:border-[var(--primary)] transition-all duration-200" 
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
          className="w-full h-[42px] bg-[var(--primary)] hover:bg-[var(--primary)] active:scale-[0.98] rounded text-[13.5px] font-medium text-black flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_4px_12px_color-mix(in_srgb,var(--primary)_20%,transparent)] hover:shadow-[0_6px_16px_color-mix(in_srgb,var(--primary)_30%,transparent)] disabled:opacity-50"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Sending...</>
          ) : (
            <>Send reset code <span className="material-symbols-outlined text-[18px]">login</span></>
          )}
        </button>
      </form>

      <div className="mt-8">
        <Link href="/login" className="text-[13.5px] text-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center gap-1 group">
          <span className="material-symbols-outlined text-[16px] transition-transform group-hover:-translate-x-0.5">arrow_back</span>
          Back to sign in
        </Link>
      </div>
    </div>
  );
}