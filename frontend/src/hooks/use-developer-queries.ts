'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth';

function useIsAuthenticated() {
  return Boolean(useAuthStore((s) => s.token));
}

export function useDeveloperMe(enabled?: boolean) {
  const authed = useIsAuthenticated();
  const run = enabled ?? authed;
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const res = await api.get('/developer/auth/me');
      return res.data;
    },
    enabled: run,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    retry: (count, err: any) => err?.response?.status !== 401 && count < 1,
  });
}

export function useApps(enabled?: boolean) {
  const authed = useIsAuthenticated();
  const run = enabled ?? authed;
  return useQuery({
    queryKey: queryKeys.apps,
    queryFn: async () => {
      const res = await api.get('/developer/apps');
      return res.data as any[];
    },
    enabled: run,
    staleTime: 30_000,
    retry: (count, err: any) => err?.response?.status !== 401 && count < 1,
  });
}

export function useOverview(days: number) {
  const authed = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.overview(days),
    queryFn: async () => {
      const res = await api.get(`/developer/analytics/overview?days=${days}`);
      return res.data;
    },
    enabled: authed,
    placeholderData: keepPreviousData,
    staleTime: 20_000,
    retry: (count, err: any) => err?.response?.status !== 401 && count < 1,
  });
}

export function useLicenseKeys(appId: number | null) {
  const authed = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.keys(appId ?? 0),
    queryFn: async () => {
      const res = await api.get(`/developer/keys/${appId}`);
      return res.data as any[];
    },
    enabled: authed && !!appId,
    staleTime: 0,
  });
}

export function useAppUsers(appId: number | null) {
  const authed = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.users(appId ?? 0),
    queryFn: async () => {
      const res = await api.get(`/developer/users/${appId}`);
      return res.data as any[];
    },
    enabled: authed && !!appId,
    staleTime: 0,
  });
}

/** Refetch lists immediately after mutations (no manual refresh needed) */
export function useInvalidateDeveloperData() {
  const queryClient = useQueryClient();

  return {
    apps: () => queryClient.refetchQueries({ queryKey: queryKeys.apps }),
    overview: () =>
      queryClient.refetchQueries({ queryKey: ['developer', 'overview'] }),
    keys: (appId: number) =>
      queryClient.refetchQueries({ queryKey: queryKeys.keys(appId) }),
    users: (appId: number) =>
      queryClient.refetchQueries({ queryKey: queryKeys.users(appId) }),
    all: async (appId?: number) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: queryKeys.apps }),
        queryClient.refetchQueries({ queryKey: ['developer', 'overview'] }),
        appId
          ? queryClient.refetchQueries({ queryKey: queryKeys.keys(appId) })
          : Promise.resolve(),
        appId
          ? queryClient.refetchQueries({ queryKey: queryKeys.users(appId) })
          : Promise.resolve(),
      ]);
    },
  };
}

export function useGenerateKeys() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDeveloperData();

  return useMutation({
    mutationFn: async (payload: {
      app_id: number;
      count: number;
      key_type: string;
      duration_days: number | null;
      expires_at: string | null;
    }) => {
      const res = await api.post('/developer/keys/bulk-generate', payload);
      return res.data;
    },
    onSuccess: async (_data, vars) => {
      await invalidate.keys(vars.app_id);
      await invalidate.overview();
    },
  });
}

export function useCreateLicenseKey() {
  const invalidate = useInvalidateDeveloperData();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post('/developer/keys/generate', payload);
      return res.data;
    },
    onSuccess: async (_data, vars: any) => {
      if (vars?.app_id) await invalidate.keys(vars.app_id as number);
      await invalidate.overview();
    },
  });
}

export function useDeleteLicenseKey() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDeveloperData();

  return useMutation({
    mutationFn: async ({ id, appId }: { id: number; appId: number }) => {
      await api.delete(`/developer/keys/${id}`);
      return { id, appId };
    },
    onMutate: async ({ id, appId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.keys(appId) });
      const prev = queryClient.getQueryData<any[]>(queryKeys.keys(appId));
      queryClient.setQueryData<any[]>(queryKeys.keys(appId), (old) =>
        (old ?? []).filter((k) => k.id !== id),
      );
      return { prev, appId };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.keys(ctx.appId), ctx.prev);
    },
    onSettled: async (_d, _e, { appId }) => {
      await invalidate.keys(appId);
      await invalidate.overview();
    },
  });
}

export function useCreateAppUser() {
  const invalidate = useInvalidateDeveloperData();

  return useMutation({
    mutationFn: async (payload: {
      app_id: number;
      username: string;
      password: string;
      email?: string;
    }) => {
      const res = await api.post('/developer/users/create', payload);
      return res.data;
    },
    onSuccess: async (_data, vars) => {
      await invalidate.users(vars.app_id);
      await invalidate.overview();
    },
  });
}

export function useDeleteAppUser() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDeveloperData();

  return useMutation({
    mutationFn: async ({ id, appId }: { id: number; appId: number }) => {
      await api.delete(`/developer/users/${id}`);
      return { id, appId };
    },
    onMutate: async ({ id, appId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users(appId) });
      const prev = queryClient.getQueryData<any[]>(queryKeys.users(appId));
      queryClient.setQueryData<any[]>(queryKeys.users(appId), (old) =>
        (old ?? []).filter((u) => u.id !== id),
      );
      return { prev, appId };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.users(ctx.appId), ctx.prev);
    },
    onSettled: async (_d, _e, { appId }) => {
      await invalidate.users(appId);
      await invalidate.overview();
    },
  });
}

export function useCreateApp() {
  const invalidate = useInvalidateDeveloperData();

  return useMutation({
    mutationFn: async (formData: {
      name: string;
      version: string;
      min_version: string;
      hwid_enabled: boolean;
    }) => {
      const res = await api.post('/developer/apps/create', formData);
      return res.data;
    },
    onSettled: () => {
      invalidate.apps();
      invalidate.overview();
    },
  });
}

export function useToggleApp() {
  const invalidate = useInvalidateDeveloperData();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.put(`/developer/apps/${id}/toggle`);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.apps });
      const previous = queryClient.getQueryData<any[]>(queryKeys.apps);
      queryClient.setQueryData<any[]>(queryKeys.apps, (old) =>
        (old ?? []).map((app) =>
          app.id === id
            ? { ...app, status: app.status === 'active' ? 'inactive' : 'active' }
            : app,
        ),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.apps, context.previous);
      }
    },
    onSettled: () => {
      invalidate.apps();
      invalidate.overview();
    },
  });
}

export function useDeleteApp() {
  const invalidate = useInvalidateDeveloperData();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/developer/apps/${id}`);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.apps });
      const previous = queryClient.getQueryData<any[]>(queryKeys.apps);
      queryClient.setQueryData<any[]>(queryKeys.apps, (old) =>
        (old ?? []).filter((app) => app.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.apps, context.previous);
      }
    },
    onSettled: () => {
      invalidate.apps();
      invalidate.overview();
    },
  });
}
