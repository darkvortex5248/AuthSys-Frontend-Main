import axios from 'axios';
import { useAuthStore } from '@/store/auth';
import { signOut } from 'next-auth/react';

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.endsWith('/') 
      ? process.env.NEXT_PUBLIC_API_URL + 'api/v1' 
      : process.env.NEXT_PUBLIC_API_URL + '/api/v1';
  }
  
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol.startsWith('http') ? window.location.protocol : 'http:';
    const hostname = window.location.hostname || 'localhost';
    // Default to port 8000 for local dev if no env var is set
    return `${protocol}//${hostname}:8000/api/v1`;
  }
  
  return 'http://127.0.0.1:8000/api/v1';
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

api.interceptors.request.use((config) => {
  const isDeveloperApi = config.url?.includes('/developer/');
  const isAdminApi = config.url?.includes('/admin/');
  
  const devToken = useAuthStore.getState().token;
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  
  if (isAdminApi && adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else if (devToken) {
    config.headers.Authorization = `Bearer ${devToken}`;
  } else if (adminToken) {
    // Fallback for cases where it's not explicitly /admin/ but we have an admin token
    config.headers.Authorization = `Bearer ${adminToken}`;
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error(`[API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.message);
    
    if (error.response?.status === 401) {
      const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/super-admin');
      
      if (isAdminPath) {
        localStorage.removeItem('admin_token');
        window.location.href = '/super-admin/login';
      } else {
        useAuthStore.getState().logout();
        await signOut({ callbackUrl: '/login' });
      }
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
       // Network error (server down or CORS) - don't logout automatically, just notify
       console.warn("Network error detected. Backend may be unreachable.");
    }
    return Promise.reject(error);
  }
);

export default api;
