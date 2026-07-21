'use client';
import { useEffect } from 'react';

export default function SuperAdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-red-400">error</span>
      </div>
      <h2 className="text-xl font-bold text-[var(--foreground)]">Something went wrong</h2>
      <p className="text-sm text-[var(--muted-foreground)] text-center max-w-md">
        {error.message || 'An unexpected error occurred in the admin panel.'}
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-bold hover:bg-[var(--primary)]/80 transition-all"
      >
        Try again
      </button>
    </div>
  );
}
