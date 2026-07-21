'use client';
import { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const purpose = searchParams.get('purpose') || 'verification';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const data = e.clipboardData.getData('text').slice(0, 6).split('');
    if (data.length === 6) {
      setOtp(data);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    try {
      if (purpose === 'password_reset') {
        // Just verify OTP first
        await api.post('/developer/auth/verify-otp', { email, code, purpose: 'password_reset' });
        toast.success('Code verified');
        router.push(`/reset-password?email=${encodeURIComponent(email)}&code=${code}`);
      } else {
        await api.post('/developer/auth/verify-email', { email, code, purpose: 'verification' });
        toast.success('Email verified successfully');
        router.push('/login');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/developer/auth/resend-verification', { email });
      toast.success('Verification code resent');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to resend code');
    }
  };

  return (
    <div className="w-full max-w-[440px] bg-[var(--card)] p-[24px] rounded-xl border border-white/5 transition-all duration-300 hover:border-white/10 shadow-[0_0_40px_2px_color-mix(in_srgb,var(--primary)_3%,transparent)]">
      <div className="flex justify-center mb-8">
        <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 shadow-[0_0_20px_0px_color-mix(in_srgb,var(--primary)_15%,transparent)]">
          <span className="material-symbols-outlined text-[32px] text-[var(--primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_unread</span>
        </div>
      </div>
      
      <div className="text-center mb-8">
        <h1 className="text-[20px] font-semibold leading-[28px] tracking-[-0.01em] text-[#ffffff] mb-2">Check your email</h1>
        <p className="text-[13.5px] font-normal leading-[20px] text-[#a1a1aa] max-w-[320px] mx-auto">
          We've sent a 6-digit verification code to <span className="font-semibold text-white">{email}</span>.
        </p>
      </div>

      <div className="w-full space-y-8">
        <div className="grid grid-cols-6 gap-2 sm:gap-3">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { if (el) inputRefs.current[i] = el; }}
              type="text"
              className="w-full h-[52px] text-center text-xl font-bold bg-[var(--card)] border border-white/5 rounded-lg text-[var(--primary)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all focus-within:shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_15%,transparent)]"
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              placeholder="·"
            />
          ))}
        </div>

        <button 
          onClick={handleVerify}
          disabled={loading}
          className="w-full h-[42px] bg-[var(--primary)] hover:bg-[var(--primary)] active:scale-[0.98] rounded text-[13.5px] font-medium text-black flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_4px_12px_color-mix(in_srgb,var(--primary)_20%,transparent)] hover:shadow-[0_6px_16px_color-mix(in_srgb,var(--primary)_30%,transparent)] disabled:opacity-50"
        >
          {loading ? (
            <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Verifying...</>
          ) : (
            <>Verify Identity <span className="material-symbols-outlined text-[18px]">verified_user</span></>
          )}
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-4 items-center">
        <button 
          onClick={() => router.push('/login')}
          className="w-full h-[42px] bg-[var(--card)] border border-white/5 hover:bg-[#222222] hover:border-white/10 text-[#ffffff] rounded text-[13.5px] font-medium flex items-center justify-center transition-all duration-200"
        >
          Return to sign in
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] text-[#a1a1aa]">Still need help?</span>
          <button 
            onClick={handleResend}
            className="text-[13.5px] font-medium text-[var(--primary)] hover:text-[var(--primary)] transition-colors duration-200 underline underline-offset-4 decoration-[var(--primary)]/30"
          >
            Resend email
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-20 text-zinc-500">
        Loading verification portal...
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
