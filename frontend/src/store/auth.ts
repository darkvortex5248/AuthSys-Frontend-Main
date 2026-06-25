import { create } from 'zustand';
import Cookies from 'js-cookie';
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
  setToken: (token: string) => void;
  setUser: (user: User | null) => void;
  setSelectedAppId: (id: number | null) => void;
  restoreSession: () => Promise<void>;
  logout: () => void;
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
      try {
        await fetch(`${getApiBaseUrl()}/developer/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch {
        // ignore errors — clear local state anyway
      }
      Cookies.remove('user', { path: '/' });
      Cookies.remove('selectedAppId', { path: '/' });
      set({ token: null, user: null, selectedAppId: null });
    },
  };
});