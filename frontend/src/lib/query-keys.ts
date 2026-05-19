export const queryKeys = {
  me: ['developer', 'me'] as const,
  apps: ['developer', 'apps'] as const,
  overview: (days: number) => ['developer', 'overview', days] as const,
  keys: (appId: number) => ['developer', 'keys', appId] as const,
  users: (appId: number) => ['developer', 'users', appId] as const,
  analytics: (appId: number, days: number) => ['developer', 'analytics', appId, days] as const,
};
