'use client';

import { useEffect } from 'react';
import { getApiBaseUrl } from '@/lib/api-base-url';
import { useAuthStore } from '@/store/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const token = useAuthStore.getState().token;

    if (!token) return;

    // Migrate OAuth cookie → localStorage (one-time)
    if (!localStorage.getItem('auth_token')) {
      const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]*)/);
      if (match) {
        const cookieToken = decodeURIComponent(match[1]);
        localStorage.setItem('auth_token', cookieToken);
        document.cookie = 'auth_token=; path=/; max-age=0';
        useAuthStore.getState().setToken(cookieToken);
      }
    }

    // Fire-and-forget /me to populate user
    fetch(`${getApiBaseUrl()}/developer/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((user) => {
        if (user) setUser(user);
      })
      .catch(() => {});
  }, [setUser]);

  return <>{children}</>;
}