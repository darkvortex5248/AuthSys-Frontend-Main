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
  setToken: (token: string) => void;
  setUser: (user: User | null) => void;
  setSelectedAppId: (id: number | null) => void;
  logout: () => void;
}

// Token stored in memory only (not localStorage) for XSS protection.
// On page reload, it is restored from the httpOnly cookie via /session endpoint.
let _inMemoryToken: string | null = null;

function getAuthToken(): string | null {
  return _inMemoryToken;
}

function setAuthToken(token: string | null): void {
  _inMemoryToken = token;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: getAuthToken(),
  user: null,
  selectedAppId: null,

  setToken: (token) => {
    setAuthToken(token);
    set({ token });
  },

  setUser: (user) => {
    set({ user });
  },

  setSelectedAppId: (id) => {
    set({ selectedAppId: id });
  },

  logout: async () => {
    try {
      await fetch(`${getApiBaseUrl()}/developer/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch { /* ignore */ }
    setAuthToken(null);
    set({ token: null, user: null, selectedAppId: null });
  },
}));