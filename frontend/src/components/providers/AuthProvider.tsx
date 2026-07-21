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
    let mounted = true;
    let token = useAuthStore.getState().token;

    if (!token) {
      tryRestoreSession().then((restored) => {
        if (mounted && restored) {
          token = restored;
          fetchUser(restored);
        }
      });
      return () => { mounted = false; };
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