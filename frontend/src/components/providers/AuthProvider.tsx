'use client';

import { useEffect } from 'react';
import { getApiBaseUrl } from '@/lib/api-base-url';
import { useAuthStore } from '@/store/auth';

async function tryRestoreSession(): Promise<string | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/developer/auth/session`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    const token = data.access_token;
    useAuthStore.getState().setToken(token);
    return token;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);

  useEffect(() => {
    let token = useAuthStore.getState().token;

    if (!token) {
      // No token in store — try restoring from httpOnly cookie
      tryRestoreSession().then((restored) => {
        if (restored) {
          token = restored;
          fetchUser(restored);
        }
      });
      return;
    }

    // Migrate OAuth cookie → localStorage (one-time)
    if (!localStorage.getItem('auth_token')) {
      const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]*)/);
      if (match) {
        const cookieToken = decodeURIComponent(match[1]);
        localStorage.setItem('auth_token', cookieToken);
        document.cookie = 'auth_token=; path=/; max-age=0';
        setToken(cookieToken);
        token = cookieToken;
      }
    }

    fetchUser(token);
  }, [setUser, setToken]);

  function fetchUser(token: string) {
    fetch(`${getApiBaseUrl()}/developer/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) return res.json();
        if (res.status === 401) return tryRestoreSession().then((newToken) => {
          if (newToken) {
            return fetch(`${getApiBaseUrl()}/developer/auth/me`, {
              headers: { Authorization: `Bearer ${newToken}` },
            }).then((r) => r.ok ? r.json() : null);
          }
          return null;
        });
        return null;
      })
      .then((user) => {
        if (user) setUser(user);
      })
      .catch(() => {});
  }

  return <>{children}</>;
}