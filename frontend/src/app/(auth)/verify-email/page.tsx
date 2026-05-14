'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function VerifyEmailPage() {
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
    <>
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-[var(--vault-secondary)]/10 rounded-full flex items-center justify-center mb-8 border border-[var(--vault-secondary)]/20">
          <span className="material-symbols-outlined text-[48px] text-[var(--vault-primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_unread</span>
        </div>
        
        <h1 className="text-3xl font-bold text-[var(--vault-on-surface)] mb-2">Verify your identity</h1>
        <p className="text-[var(--vault-on-surface-variant)] mb-8">
          We've sent a 6-digit verification code to your email.
        </p>

        <div className="w-full space-y-8">
          <div className="grid grid-cols-6 gap-3">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { if (el) inputRefs.current[i] = el; }}
                type="text"
                className="w-full h-14 text-center text-2xl font-bold bg-black/20 border border-white/10 rounded-lg text-[var(--vault-primary)] focus:border-[var(--vault-primary)] focus:ring-1 focus:ring-[var(--vault-primary)] outline-none transition-all"
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
            className="vault-primary-button w-full h-[52px] rounded-lg text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Identity'}
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
          </button>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-xs text-[var(--vault-on-surface-variant)]">Didn't receive the email?</p>
          <button 
            onClick={handleResend}
            className="text-[var(--vault-primary)] font-bold text-sm hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Resend Email
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 w-full">
           <Link href="/login" className="text-sm font-medium text-[var(--vault-on-surface-variant)] hover:text-[var(--vault-primary)] flex items-center justify-center gap-2 transition-colors duration-200">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Log in
          </Link>
        </div>
      </div>
    </>
  );
}
