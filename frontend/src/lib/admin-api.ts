import type { AxiosResponse } from 'axios';
import api from '@/lib/api';

/** Admin API calls — always use admin_token (never developer JWT). */
const adminApi = {
  get: <T = unknown>(url: string): Promise<AxiosResponse<T>> => api.get<T>(url),
  post: <T = unknown>(url: string, data?: unknown): Promise<AxiosResponse<T>> =>
    api.post<T>(url, data),
  put: <T = unknown>(url: string, data?: unknown): Promise<AxiosResponse<T>> =>
    api.put<T>(url, data),
  delete: <T = unknown>(url: string): Promise<AxiosResponse<T>> => api.delete<T>(url),
};

export default adminApi;
