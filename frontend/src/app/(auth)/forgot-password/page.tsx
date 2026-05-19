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
    <div className="w-full max-w-[440px] bg-[#1a1a1a] p-[24px] rounded-xl border border-white/5 flex flex-col items-center transition-all duration-300 hover:border-white/10 shadow-2xl">
      <div className="w-12 h-12 bg-[#212121] border border-white/5 rounded-lg flex items-center justify-center mb-6">
        <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V20C17 21.1046 16.1046 22 15 22H9C7.89543 22 7 21.1046 7 20V4Z" stroke="#d97757" strokeWidth="2"></path>
          <path d="M7 8H17" stroke="#d97757" strokeWidth="2"></path>
          <path d="M7 16H17" stroke="#d97757" strokeWidth="2"></path>
        </svg>
      </div>
      
      <div className="text-center mb-8">
        <h1 className="text-[20px] font-semibold leading-[28px] tracking-[-0.01em] text-[#e5e2e1] mb-2">Reset password</h1>
        <p className="text-[13.5px] font-normal leading-[20px] text-[#dbc1b9] max-w-[320px] mx-auto">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div className="space-y-2">
          <label className="text-[10.5px] font-medium leading-[16px] tracking-[0.07em] text-[#5a5a72] block uppercase">Email Address</label>
          <div className="relative group rounded focus-within:shadow-[0_0_12px_rgba(217,119,87,0.13)] transition-all">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-[18px] text-[#474746] group-focus-within:text-[#d97757] transition-colors">mail</span>
            </div>
            <input 
              className="w-full h-[42px] bg-[#212121] border border-[rgba(255,255,255,0.08)] rounded text-[13.5px] text-[#e5e2e1] placeholder-[#3a3a4a] pl-10 focus:ring-0 focus:outline-none focus:border-[#d97757] transition-all duration-200" 
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
          className="w-full h-[42px] bg-[#d97757] hover:bg-[#c4664a] active:scale-[0.98] rounded text-[13.5px] font-medium text-[#5c1902] flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Sending...</>
          ) : (
            <>Send reset link <span className="material-symbols-outlined text-[18px]">login</span></>
          )}
        </button>
      </form>

      <div className="mt-8">
        <Link href="/login" className="text-[13.5px] text-[#d97757] hover:text-[#ffdbd0] transition-colors flex items-center gap-1 group">
          <span className="material-symbols-outlined text-[16px] transition-transform group-hover:-translate-x-0.5">arrow_back</span>
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
