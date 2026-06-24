'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  let errorMessage = "An unexpected error occurred during authentication.";
  let errorTitle = "Access Restricted";

  if (error === "AccessDenied") {
    errorMessage = "Your sign-in request was rejected. This usually happens if your account is banned, your email is unverified, or the security server is currently unreachable.";
    errorTitle = "Access Denied";
  } else if (error === "Configuration") {
    errorMessage = "There is a server-side configuration issue. Please contact the system administrator.";
    errorTitle = "System Configuration Error";
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8 relative">
        <div className="absolute -top-6 -left-6 w-12 h-12 bg-red-500/10 rounded-full blur-xl animate-pulse"></div>
        <h2 className="text-4xl font-extrabold text-[var(--foreground)] mb-2 tracking-tight">
          {errorTitle.split(' ')[0]} <span className="text-red-500">{errorTitle.split(' ').slice(1).join(' ')}</span>
        </h2>
        <p className="text-[var(--muted-foreground)] text-sm font-medium">
          Error Protocol Code: <span className="text-red-500/80 font-mono">{error || "UNKNOWN_ERR"}</span>
        </p>
      </header>

      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-red-500 mt-0.5">warning</span>
          <p className="text-sm text-red-200/80 leading-relaxed font-medium">
            {errorMessage}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Link 
          href="/login"
          className="w-full h-[56px] rounded-xl bg-white/[0.03] border border-white/10 text-white font-bold text-sm tracking-widest uppercase hover:bg-white/[0.08] transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Return to Login
        </Link>
        
        <a 
          href="mailto:support@rinoxauth.com"
          className="w-full h-[56px] rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-sm tracking-widest uppercase shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">support_agent</span>
          Contact Support
        </a>
      </div>

      <footer className="text-center pt-8 border-t border-white/5 mt-8">
        <p className="text-[10px] text-[var(--muted-foreground)] font-bold uppercase tracking-[0.2em] opacity-50">
          Security Subsystem Error Handling v2.1
        </p>
      </footer>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-20">
        <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
