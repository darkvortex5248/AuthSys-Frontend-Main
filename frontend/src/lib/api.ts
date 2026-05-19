import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth';
import { signOut } from 'next-auth/react';

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.endsWith('/')
      ? process.env.NEXT_PUBLIC_API_URL + 'api/v1'
      : process.env.NEXT_PUBLIC_API_URL + '/api/v1';
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol.startsWith('http')
      ? window.location.protocol
      : 'http:';
    const hostname = window.location.hostname || 'localhost';
    return `${protocol}//${hostname}:8000/api/v1`;
  }

  return 'http://127.0.0.1:8000/api/v1';
};

/** Routes under /admin/ that do not require admin JWT */
function isPublicAdminRoute(url: string): boolean {
  return (
    url.includes('/admin/login') ||
    url.includes('/admin/settings/public') ||
    url.includes('/admin/sdks/public')
  );
}

/** Protected admin routes — use admin_token only */
function isProtectedAdminRoute(url: string): boolean {
  return url.includes('/admin/') && !isPublicAdminRoute(url);
}

let handlingUnauthorized = false;

const api = axios.create({
  baseURL: getBaseUrl(),
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const url = config.url || '';
  const adminToken =
    typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const devToken = useAuthStore.getState().token;

  // Never attach tokens to public admin endpoints
  if (isPublicAdminRoute(url)) {
    delete config.headers.Authorization;
    return config;
  }

  if (isProtectedAdminRoute(url)) {
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  }

  // Developer routes: developer JWT only (never admin_token — causes instant 401 logout)
  if (devToken) {
    config.headers.Authorization = `Bearer ${devToken}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    if (status === 401 && !handlingUnauthorized) {
      const isAdminPath =
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/super-admin');
      const hadDevAuth = Boolean(error.config?.headers?.Authorization);
      const isProtectedAdmin = isProtectedAdminRoute(url);

      // Public routes: never force logout
      if (isPublicAdminRoute(url)) {
        return Promise.reject(error);
      }

      handlingUnauthorized = true;
      try {
        if (isAdminPath || isProtectedAdmin) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_token');
            if (!window.location.pathname.includes('/super-admin/login')) {
              window.location.href = '/super-admin/login';
            }
          }
        } else if (hadDevAuth) {
          useAuthStore.getState().logout();
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            await signOut({ callbackUrl: '/login' });
          }
        }
      } finally {
        setTimeout(() => {
          handlingUnauthorized = false;
        }, 1500);
      }
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      console.warn('Network error detected. Backend may be unreachable.');
    }

    return Promise.reject(error);
  }
);

export default api;
