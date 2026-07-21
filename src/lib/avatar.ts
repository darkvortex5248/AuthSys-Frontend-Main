const AVATAR_PALETTES = [
  ['#6366f1', '#818cf8'],
  ['#ec4899', '#f472b6'],
  ['#f59e0b', '#fbbf24'],
  ['#10b981', '#34d399'],
  ['#3b82f6', '#60a5fa'],
  ['#8b5cf6', '#a78bfa'],
  ['var(--primary)', '#f59e7b'],
  ['#06b6d4', '#22d3ee'],
];

export function getAvatarPalette(name: string): [string, string] {
  const idx = name ? name.charCodeAt(0) % AVATAR_PALETTES.length : 0;
  return AVATAR_PALETTES[idx] as [string, string];
}

export function getInitials(name: string, fallback = 'JD'): string {
  return (name || fallback).substring(0, 2).toUpperCase();
}

export function getAvatarUrl(user: { avatar_url?: string; username?: string } | null): string | null {
  return user?.avatar_url?.trim() ? user.avatar_url.trim() : null;
}
