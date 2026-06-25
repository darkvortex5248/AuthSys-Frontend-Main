'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

/**
 * Hydrates the Zustand auth store from Supabase cookies (or legacy backend
 * session) on every page load. Without this, OAuth logins set Supabase cookies
 * but API calls have no Bearer token → 403 "Not authenticated".
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return <>{children}</>;
}
