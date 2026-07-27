export const queryKeys = {
  me: ['developer', 'me'] as const,
  apps: ['developer', 'apps'] as const,
  app: (appId: number) => ['developer', 'app', appId] as const,
  overview: (days: number) => ['developer', 'overview', days] as const,
  keys: (appId: number, skip?: number, limit?: number) => ['developer', 'keys', appId, skip ?? 0, limit ?? 50] as const,
  users: (appId: number, skip?: number, limit?: number) => ['developer', 'users', appId, skip ?? 0, limit ?? 50] as const,
  analytics: (appId: number, days: number) => ['developer', 'analytics', appId, days] as const,
  blacklist: (appId: number) => ['developer', 'blacklist', appId] as const,
  variables: (appId: number) => ['developer', 'variables', appId] as const,
  auditLogs: (appId: number) => ['developer', 'audit-logs', appId] as const,
};
