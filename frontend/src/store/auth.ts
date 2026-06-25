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

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const ls = localStorage.getItem('auth_token');
    if (ls) return ls;
    const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch { return null; }
}

function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  } catch { /* ignore */ }
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