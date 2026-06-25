import { create } from 'zustand';
import { getApiBaseUrl } from '@/lib/api-base-url';

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
  sessionReady: boolean;
  setToken: (token: string) => void;
  setUser: (user: User | null) => void;
  setSelectedAppId: (id: number | null) => void;
  restoreSession: () => Promise<void>;
  logout: () => void;
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem('auth_token'); } catch { return null; }
}

function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  } catch { /* ignore */ }
}

export const useAuthStore = create<AuthState>((set) => {
  const initialToken = getStoredToken();

  return {
    token: initialToken,
    user: null,
    selectedAppId: null,
    isLoading: true,
    sessionReady: false,

    setToken: (token) => {
      setStoredToken(token);
      set({ token });
    },

    setUser: (user) => {
      set({ user });
    },

    setSelectedAppId: (id) => {
      set({ selectedAppId: id });
    },

    restoreSession: async () => {
      set({ isLoading: true, sessionReady: false });
      const token = getStoredToken();

      if (token) {
        try {
          const res = await fetch(`${getApiBaseUrl()}/developer/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (res.ok) {
            const user = await res.json();
            set({ token, user, isLoading: false, sessionReady: true });
            return;
          }
        } catch { /* fall through */ }
      }

      // No valid token → session restore done, no user
      set({ token: null, user: null, isLoading: false, sessionReady: true });
    },

    logout: async () => {
      try {
        await fetch(`${getApiBaseUrl()}/developer/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch { /* ignore */ }
      setStoredToken(null);
      set({ token: null, user: null, selectedAppId: null, sessionReady: true });
    },
  };
});