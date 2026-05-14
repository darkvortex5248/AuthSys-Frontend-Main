import { create } from 'zustand';
import Cookies from 'js-cookie';

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
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

export const useAuthStore = create<AuthState>((set) => {
  const initialToken = Cookies.get('token');
  const sanitizedToken = (initialToken === 'null' || initialToken === 'undefined') ? null : (initialToken || null);
  
  const initialAppId = Cookies.get('selectedAppId');
  const initialUser = Cookies.get('user');
  
  return {
    token: sanitizedToken,
    user: initialUser ? JSON.parse(initialUser) : null,
    selectedAppId: initialAppId ? parseInt(initialAppId) : null,
    setToken: (token) => {
      Cookies.set('token', token, { expires: 1, path: '/' });
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
    logout: () => {
      Cookies.remove('token', { path: '/' });
      Cookies.remove('user', { path: '/' });
      Cookies.remove('selectedAppId', { path: '/' });
      set({ token: null, user: null, selectedAppId: null });
    },
  };
});
