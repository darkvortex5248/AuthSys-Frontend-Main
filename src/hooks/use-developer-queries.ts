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
    staleTime: 30_000,
    refetchOnWindowFocus: false,
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

/** Instant from apps cache; fetches single app only when cache miss (direct URL). */
export function useApp(appId: number | null) {
  const authed = useIsAuthenticated();
  const id = appId ?? 0;
  const { data: apps = [], isLoading: appsLoading } = useApps();
  const cached = id ? apps.find((a) => a.id === id) : null;

  const single = useQuery({
    queryKey: queryKeys.app(id),
    queryFn: async () => {
      const res = await api.get(`/developer/apps/${id}`);
      return res.data as any;
    },
    enabled: authed && !!id && !cached,
    staleTime: 30_000,
    retry: (count, err: any) => err?.response?.status !== 401 && count < 1,
  });

  return {
    app: cached ?? single.data ?? null,
    isLoading: !!id && !cached && (appsLoading || single.isLoading),
    isFetching: single.isFetching,
  };
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
    staleTime: 60_000,
    refetchOnMount: false,
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
    staleTime: 60_000,
    refetchOnMount: false,
  });
}

/** Refetch lists immediately after mutations (no manual refresh needed) */
export function useInvalidateDeveloperData() {
  const queryClient = useQueryClient();

  return {
    apps: () => queryClient.refetchQueries({ queryKey: queryKeys.apps }),
    overview: () =>
      queryClient.refetchQueries({ queryKey: ['developer', 'overview'] }),
    keys: async (appId: number) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.keys(appId) });
      await queryClient.refetchQueries({ queryKey: queryKeys.keys(appId), type: 'active' });
    },
    users: async (appId: number) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users(appId) });
      await queryClient.refetchQueries({ queryKey: queryKeys.users(appId), type: 'active' });
    },
    blacklist: async (appId: number) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.blacklist(appId) });
      await queryClient.refetchQueries({ queryKey: queryKeys.blacklist(appId), type: 'active' });
    },
    variables: async (appId: number) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.variables(appId) });
      await queryClient.refetchQueries({ queryKey: queryKeys.variables(appId), type: 'active' });
    },
    auditLogs: async (appId: number) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs(appId) });
      await queryClient.refetchQueries({ queryKey: queryKeys.auditLogs(appId), type: 'active' });
    },
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
        appId
          ? queryClient.refetchQueries({ queryKey: queryKeys.blacklist(appId) })
          : Promise.resolve(),
        appId
          ? queryClient.refetchQueries({ queryKey: queryKeys.variables(appId) })
          : Promise.resolve(),
        appId
          ? queryClient.refetchQueries({ queryKey: queryKeys.auditLogs(appId) })
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
    onSuccess: async (data, vars) => {
      const appId = vars.app_id;
      const items = data?.items as any[] | undefined;
      if (items?.length) {
        queryClient.setQueryData<any[]>(queryKeys.keys(appId), (old) => {
          const ids = new Set((old ?? []).map((k) => k.id));
          const fresh = items.filter((k) => k.id && !ids.has(k.id));
          return [...fresh, ...(old ?? [])];
        });
      }
      await invalidate.keys(appId);
      await invalidate.overview();
    },
  });
}

export function useCreateLicenseKey() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDeveloperData();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post('/developer/keys/generate', payload);
      return res.data;
    },
    onSuccess: async (data, vars: any) => {
      const appId = vars?.app_id as number;
      if (appId && data?.id) {
        queryClient.setQueryData<any[]>(queryKeys.keys(appId), (old) => {
          const list = old ?? [];
          if (list.some((k) => k.id === data.id)) return list;
          return [data, ...list];
        });
      }
      if (appId) await invalidate.keys(appId);
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
  const queryClient = useQueryClient();
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
    onSuccess: async (data, vars) => {
      if (data?.id) {
        queryClient.setQueryData<any[]>(queryKeys.users(vars.app_id), (old) => {
          const list = old ?? [];
          if (list.some((u) => u.id === data.id)) return list;
          return [data, ...list];
        });
      }
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
    onSuccess: async () => {
      await invalidate.apps();
      await invalidate.overview();
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

export function useAnalytics(appId: number | null) {
  const authed = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.analytics(appId ?? 0, 7),
    queryFn: async () => {
      const res = await api.get(`/developer/analytics/${appId}`);
      return res.data;
    },
    enabled: authed && !!appId,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: (count, err: any) => err?.response?.status !== 401 && count < 1,
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

/* ── Blacklist ────────────────────────────────────────────── */

export function useBlacklist(appId: number | null) {
  const authed = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.blacklist(appId ?? 0),
    queryFn: async () => {
      const res = await api.get(`/developer/blacklist/${appId}`);
      return res.data as any[];
    },
    enabled: authed && !!appId,
    staleTime: 60_000,
    refetchOnMount: false,
  });
}

export function useAddBlacklistEntry() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDeveloperData();
  return useMutation({
    mutationFn: async (payload: { app_id: number; type: string; value: string; reason?: string }) => {
      const res = await api.post('/developer/blacklist/add', payload);
      return res.data;
    },
    onSuccess: async (_data, vars) => {
      await invalidate.blacklist(vars.app_id);
    },
  });
}

export function useDeleteBlacklistEntry() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDeveloperData();
  return useMutation({
    mutationFn: async ({ id, appId }: { id: number; appId: number }) => {
      await api.delete(`/developer/blacklist/${id}`);
      return { id, appId };
    },
    onMutate: async ({ id, appId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.blacklist(appId) });
      const prev = queryClient.getQueryData<any[]>(queryKeys.blacklist(appId));
      queryClient.setQueryData<any[]>(queryKeys.blacklist(appId), (old) =>
        (old ?? []).filter((e) => e.id !== id),
      );
      return { prev, appId };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.blacklist(ctx.appId), ctx.prev);
    },
    onSettled: async (_d, _e, { appId }) => {
      await invalidate.blacklist(appId);
    },
  });
}

/* ── Variables ────────────────────────────────────────────── */

export function useVariables(appId: number | null) {
  const authed = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.variables(appId ?? 0),
    queryFn: async () => {
      const res = await api.get(`/developer/variables/${appId}`);
      return res.data as any[];
    },
    enabled: authed && !!appId,
    staleTime: 60_000,
    refetchOnMount: false,
  });
}

export function useCreateVariable() {
  const invalidate = useInvalidateDeveloperData();
  return useMutation({
    mutationFn: async (payload: { app_id: number; key_name: string; key_value: string; is_global: boolean }) => {
      const res = await api.post('/developer/variables/create', payload);
      return res.data;
    },
    onSuccess: async (_data, vars) => {
      await invalidate.variables(vars.app_id);
    },
  });
}

export function useDeleteVariable() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDeveloperData();
  return useMutation({
    mutationFn: async ({ id, appId }: { id: number; appId: number }) => {
      await api.delete(`/developer/variables/${id}`);
      return { id, appId };
    },
    onMutate: async ({ id, appId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.variables(appId) });
      const prev = queryClient.getQueryData<any[]>(queryKeys.variables(appId));
      queryClient.setQueryData<any[]>(queryKeys.variables(appId), (old) =>
        (old ?? []).filter((v) => v.id !== id),
      );
      return { prev, appId };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.variables(ctx.appId), ctx.prev);
    },
    onSettled: async (_d, _e, { appId }) => {
      await invalidate.variables(appId);
    },
  });
}

/* ── Audit Logs ───────────────────────────────────────────── */

export function useAuditLogs(appId: number | null) {
  const authed = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.auditLogs(appId ?? 0),
    queryFn: async () => {
      const res = await api.get(`/developer/analytics/${appId}`);
      return (res.data.recent_activity || []) as any[];
    },
    enabled: authed && !!appId,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: (count, err: any) => err?.response?.status !== 401 && count < 1,
  });
}

export function useClearAuditLogs() {
  const invalidate = useInvalidateDeveloperData();
  return useMutation({
    mutationFn: async (appId: number) => {
      await api.delete(`/developer/analytics/${appId}/logs`);
      return appId;
    },
    onSuccess: async (appId) => {
      await invalidate.auditLogs(appId);
    },
  });
}
