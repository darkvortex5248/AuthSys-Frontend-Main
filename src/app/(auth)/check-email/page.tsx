'use client';
import Link from 'next/link';

export default function CheckEmailPage() {
  return (
    <>
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-8 relative border border-[var(--primary)]/20">
          <div className="absolute inset-0 bg-[var(--primary)]/5 rounded-full blur-xl animate-pulse"></div>
          <span className="material-symbols-outlined text-[48px] text-[var(--primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
        </div>
        
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Check your email</h1>
        <p className="text-[var(--muted-foreground)] mb-8">
          We've sent password reset instructions to your email. Please check your inbox and spam folder.
        </p>

        <div className="w-full flex flex-col gap-4">
          <button className="vault-primary-button w-full h-[52px] rounded-lg text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2">
            Open Webmail
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </button>
          <p className="text-sm text-[var(--muted-foreground)]">
            Didn't receive the email? <button className="text-[var(--primary)] font-bold hover:underline">Resend</button>
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 w-full">
           <Link href="/login" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--primary)] flex items-center justify-center gap-2 transition-colors duration-200">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Log in
          </Link>
        </div>
      </div>
    </>
  );
}
