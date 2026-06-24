import { create } from 'zustand';
import Cookies from 'js-cookie';
import { supabase } from '@/lib/supabase';

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL;
    return url.endsWith('/') ? url + 'api/v1' : url + '/api/v1';
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol.startsWith('http')
      ? window.location.protocol
      : 'http:';
    const hostname = window.location.hostname || 'localhost';
    return `${protocol}//${hostname}:8000/api/v1`;
  }
  return 'http://127.0.0.1:8000/api/v1';
}

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  display_name?: string;
  bio?: string;
  timezone?: string;
  is_verified: boolean;
  subscription_tier?: string;
  supabase_user_id?: string | null;
  plan?: {
    id: number;
    name: string;
    max_apps: number;
    max_users_per_app: number;
    max_keys_per_month: number;
    features_json: any;
  };
}

interface AuthState {
  token: string | null;
  user: User | null;
  selectedAppId: number | null;
  isLoading: boolean;
  setToken: (token: string) => void;
  setUser: (user: User | null) => void;
  setSelectedAppId: (id: number | null) => void;
  restoreSession: () => Promise<void>;
  logout: () => void;
}

/**
 * Fetch the application developer profile from the backend using a Supabase
 * access token. The backend verifies the RS256 token and resolves it to a
 * `developer_accounts` row (Phase 3 dual-verifier).
 */
async function fetchDevProfile(accessToken: string): Promise<User | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/developer/auth/supabase/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => {
  const initialAppId = Cookies.get('selectedAppId');
  const initialUser = Cookies.get('user');

  return {
    token: null,
    user: initialUser ? JSON.parse(initialUser) : null,
    selectedAppId: initialAppId ? parseInt(initialAppId) : null,
    isLoading: true,

    setToken: (token) => {
      set({ token });
    },

    setUser: (user) => {
      if (user) Cookies.set('user', JSON.stringify(user), { expires: 1, path: '/' });
      else Cookies.remove('user', { path: '/' });
      set({ user });
    },

    setSelectedAppId: (id) => {
      if (id) Cookies.set('selectedAppId', id.toString(), { expires: 7, path: '/' });
      else Cookies.remove('selectedAppId', { path: '/' });
      set({ selectedAppId: id });
    },

    restoreSession: async () => {
      try {
        set({ isLoading: true });

        // ── New path: Supabase session ──────────────────────────────────
        // If Supabase env vars are configured, read the session from the
        // browser client (cookies are synced by @supabase/ssr).
        const hasSupabaseConfig = Boolean(
          process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        if (hasSupabaseConfig) {
          const { data: sessionData, error } = await supabase.auth.getSession();
          if (!error && sessionData.session) {
            const accessToken = sessionData.session.access_token;
            const user = await fetchDevProfile(accessToken);
            if (user) {
              set({ token: accessToken, user, isLoading: false });
              return;
            }
          }
          set({ token: null, isLoading: false });
          return;
        }

        // ── Legacy path: backend httpOnly cookie (pre-migration) ────────
        const res = await fetch(`${getApiBaseUrl()}/developer/auth/session`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('No session');
        const data = await res.json();
        set({ token: data.access_token, user: data.user, isLoading: false });
      } catch {
        set({ token: null, isLoading: false });
      }
    },

    logout: async () => {
      // Sign out of Supabase (clears its cookies + revokes the session).
      const hasSupabaseConfig = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      if (hasSupabaseConfig) {
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore — clear local state anyway
        }
      } else {
        // Legacy backend logout
        try {
          await fetch(`${getApiBaseUrl()}/developer/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch {
          // ignore errors — clear local state anyway
        }
      }
      Cookies.remove('user', { path: '/' });
      Cookies.remove('selectedAppId', { path: '/' });
      set({ token: null, user: null, selectedAppId: null });
    },
  };
});
