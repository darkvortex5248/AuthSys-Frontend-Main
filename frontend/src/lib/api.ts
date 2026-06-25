import axios, { type InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from '@/lib/api-base-url';
import { useAuthStore } from '@/store/auth';

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
  (error) => {
    if (error.code === 'ERR_NETWORK' || !error.response) {
      console.warn('Network error detected. Backend may be unreachable.');
    }
    return Promise.reject(error);
  }
);

export default api;
