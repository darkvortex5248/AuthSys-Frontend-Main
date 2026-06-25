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
  const initialToken = Cookies.get('token');
  const initialAppId = Cookies.get('selectedAppId');
  const initialUser = Cookies.get('user');

  return {
    token: initialToken || null,
    user: initialUser ? JSON.parse(initialUser) : null,
    selectedAppId: initialAppId ? parseInt(initialAppId) : null,
    isLoading: true,

    setToken: (token) => {
      if (token) Cookies.set('token', token, { expires: 1, path: '/' });
      else Cookies.remove('token', { path: '/' });
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
      set({ isLoading: true });
      const state = useAuthStore.getState();

      // Priority 1: Existing token → validate via /me
      if (state.token) {
        try {
          const res = await fetch(`${getApiBaseUrl()}/developer/auth/me`, {
            headers: { 'Authorization': `Bearer ${state.token}` },
          });
          if (res.ok) {
            const user = await res.json();
            set({ user, isLoading: false });
            return;
          }
        } catch { /* fall through */ }
      }

      // Priority 2: Cookie-based session (same-origin or SameSite=None)
      try {
        const res = await fetch(`${getApiBaseUrl()}/developer/auth/session`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          set({ token: data.access_token, user: data.user, isLoading: false });
          return;
        }
      } catch { /* fall through */ }

      set({ token: null, user: null, isLoading: false });
    },

    logout: async () => {
      try {
        await fetch(`${getApiBaseUrl()}/developer/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch { /* ignore */ }
      Cookies.remove('token', { path: '/' });
      Cookies.remove('user', { path: '/' });
      Cookies.remove('selectedAppId', { path: '/' });
      set({ token: null, user: null, selectedAppId: null });
    },
  };
});