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
// On page reload, it is restored from the JS-accessible auth_token cookie
// (set by the OAuth callback), or failing that, from the httpOnly cookie
// via the /session endpoint.
let _inMemoryToken: string | null = null;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function getAuthToken(): string | null {
  if (_inMemoryToken) return _inMemoryToken;
  const cookieToken = getCookie('auth_token');
  if (cookieToken) {
    _inMemoryToken = cookieToken;
    return cookieToken;
  }
  return null;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

function setAuthToken(token: string | null): void {
  _inMemoryToken = token;
  if (token === null) {
    deleteCookie('auth_token');
  }
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
    setAuthToken(null);
    set({ token: null, user: null, selectedAppId: null });
    try {
      await fetch(`${getApiBaseUrl()}/developer/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch { /* ignore */ }
  },
}));