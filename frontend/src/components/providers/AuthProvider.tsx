'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

function LoadingFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const token = useAuthStore((s) => s.token);
  const sessionReady = useAuthStore((s) => s.sessionReady);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // If we have a stored token but session hasn't been validated yet, show loader
  if (token && !sessionReady) {
    return <LoadingFallback />;
  }

  return <>{children}</>;
}