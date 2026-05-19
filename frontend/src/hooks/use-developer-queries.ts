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
    staleTime: 15_000,
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
    staleTime: 15_000,
  });
}

/** Invalidate lists that change when apps/keys/users are mutated */
export function useInvalidateDeveloperData() {
  const queryClient = useQueryClient();

  return {
    apps: () => queryClient.invalidateQueries({ queryKey: queryKeys.apps }),
    overview: () =>
      queryClient.invalidateQueries({ queryKey: ['developer', 'overview'] }),
    keys: (appId: number) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.keys(appId) }),
    users: (appId: number) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.users(appId) }),
    all: (appId?: number) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps });
      queryClient.invalidateQueries({ queryKey: ['developer', 'overview'] });
      if (appId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.keys(appId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.users(appId) });
      }
    },
  };
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
