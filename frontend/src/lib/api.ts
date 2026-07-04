import axios, { type InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from '@/lib/api-base-url';
import { useAuthStore } from '@/store/auth';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

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

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const url = config.url || '';
  const adminToken =
    typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const devToken = useAuthStore.getState().token;

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
    if (error.code === 'ERR_NETWORK' || !error.response) {
      console.warn('Network error detected. Backend may be unreachable.');
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    const url = originalRequest?.url || '';

    if (isProtectedAdminRoute(url)) {
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !originalRequest._retry && !url.includes('/auth/session')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await fetch(`${getApiBaseUrl()}/developer/auth/session`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Session refresh failed');

        const data = await res.json();
        const newToken = data.access_token;

        useAuthStore.getState().setToken(newToken);
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        processQueue(error, null);
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
